/**
 * Googleマップ口コミ監視
 *
 * 指定店舗の口コミを取得し、新着を検出する
 *
 * 改善点 (2026/01/18 レビュー対応):
 * - 環境変数でheadless制御
 * - セレクタの堅牢化（複数パターン対応）
 * - 「もっと見る」ボタン処理の改善
 * - エラーハンドリング強化
 * - BrowserPool共通化
 */

import { Page } from "playwright";
import {
  BrowserPool,
  HEADLESS_DEFAULT,
  trySelectors as findValidSelector,
  cleanup,
} from "./browser-pool";

export interface Review {
  id: string; // ユニークID（日付+著者名のハッシュ）
  rating: number; // 1-5
  text: string;
  authorName: string;
  publishedAt: Date | null;
  relativeTime: string; // "1週間前" など
}

export interface ReviewsResult {
  placeId: string;
  placeName: string;
  totalReviews: number;
  averageRating: number;
  reviews: Review[];
  checkedAt: Date;
  error?: string;
}

export interface FetchReviewsOptions {
  placeId?: string;
  placeName: string;
  searchKeyword?: string; // 検索して店舗を特定する場合
  maxReviews?: number;
  headless?: boolean;
}

// セレクタ候補（Googleマップの構造変更に対応）
const SELECTORS = {
  // 店舗名
  placeName: ["h1", "h1.DUwDvf", 'div[role="main"] h1'],
  // 評価
  ratingScore: ["div.fontDisplayLarge", "span.ceNzKf", "div.F7nice span"],
  // レビュー数
  reviewCount: [
    'button[aria-label*="クチコミ"]',
    'button[aria-label*="reviews"]',
    'span:has-text("件のクチコミ")',
  ],
  // 口コミタブ
  reviewsTab: [
    'button[aria-label*="クチコミ"]',
    'button:has-text("クチコミ")',
    'button[data-tab-index="1"]',
  ],
  // 口コミアイテム
  reviewItem: ["div[data-review-id]", "div.jftiEf", 'div[jscontroller="fIQYlf"]'],
  // 口コミスクロールコンテナ
  scrollContainer: ["div.m6QErb.DxyBCb", "div.m6QErb", 'div[role="main"] div.DxyBCb'],
  // 著者名
  authorName: ["div.d4r55", "button.WEBjve", "div.WNxzHc a"],
  // 星評価
  reviewRating: ['span[role="img"]', "span.kvMYJc"],
  // 投稿時期
  reviewTime: ["span.rsqaWe", "span.dehysf"],
  // 口コミ本文
  reviewText: ["span.wiI7pd", "div.MyEned span"],
  // もっと見るボタン
  moreButton: ["button.w8nwRe", "button.kyuRq", 'button:has-text("もっと見る")'],
};

// BrowserPool is imported from browser-pool.ts

/**
 * 複数のセレクタを試して最初に見つかった要素を返す
 */
async function trySelectorsForElement(
  parent: Page,
  selectors: string[]
): Promise<Awaited<ReturnType<Page["$"]>>> {
  for (const selector of selectors) {
    try {
      const el = await parent.$(selector);
      if (el) return el;
    } catch {
      continue;
    }
  }
  return null;
}

// findValidSelector is imported from browser-pool.ts as trySelectors

/**
 * 店舗の口コミを取得
 */
export async function fetchReviews(
  options: FetchReviewsOptions
): Promise<ReviewsResult> {
  const {
    placeId,
    placeName,
    searchKeyword,
    maxReviews = 20,
    headless = HEADLESS_DEFAULT,
  } = options;

  const pool = await BrowserPool.getInstance();
  let page: Page | null = null;

  try {
    const context = await pool.getContext({ headless });
    page = await context.newPage();

    // 店舗ページを開く
    let url: string;
    if (placeId) {
      url = `https://www.google.com/maps/place/?q=place_id:${placeId}`;
    } else if (searchKeyword) {
      url = `https://www.google.com/maps/search/${encodeURIComponent(searchKeyword + " " + placeName)}`;
    } else {
      url = `https://www.google.com/maps/search/${encodeURIComponent(placeName)}`;
    }

    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForTimeout(2000);

    // 検索結果から店舗を選択（必要な場合）
    if (!placeId) {
      const feedSelector = await findValidSelector(
        page,
        ['div[role="feed"]', 'div[role="main"] div[role="feed"]'],
        5000
      );
      if (feedSelector) {
        const firstResult = await page.$(`${feedSelector} > div > div[jsaction]`);
        if (firstResult) {
          await firstResult.click();
          await page.waitForTimeout(2000);
        }
      }
    }

    // 店舗名を取得
    let actualPlaceName = placeName;
    const nameEl = await trySelectorsForElement(page, SELECTORS.placeName);
    if (nameEl) {
      actualPlaceName = (await nameEl.textContent()) || placeName;
    }

    // 評価情報を取得
    const ratingInfo = await extractRatingInfo(page);

    // 口コミタブをクリック
    const reviewsTabSelector = await findValidSelector(page, SELECTORS.reviewsTab, 5000);
    if (reviewsTabSelector) {
      const reviewsTab = await page.$(reviewsTabSelector);
      if (reviewsTab) {
        await reviewsTab.click();
        await page.waitForTimeout(2000);
      }
    }

    // 口コミを取得
    const reviews = await extractReviews(page, maxReviews);

    return {
      placeId: placeId || "",
      placeName: actualPlaceName.trim(),
      totalReviews: ratingInfo.totalReviews,
      averageRating: ratingInfo.averageRating,
      reviews,
      checkedAt: new Date(),
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Review fetch error:", errorMessage);

    return {
      placeId: placeId || "",
      placeName: placeName,
      totalReviews: 0,
      averageRating: 0,
      reviews: [],
      checkedAt: new Date(),
      error: errorMessage,
    };
  } finally {
    if (page) {
      await page.close();
    }
  }
}

/**
 * 評価情報を抽出
 */
async function extractRatingInfo(
  page: Page
): Promise<{ averageRating: number; totalReviews: number }> {
  let averageRating = 0;
  let totalReviews = 0;

  try {
    // 評価スコア
    const ratingEl = await trySelectorsForElement(page, SELECTORS.ratingScore);
    if (ratingEl) {
      const ratingText = await ratingEl.textContent();
      if (ratingText) {
        averageRating = parseFloat(ratingText);
      }
    }

    // レビュー数
    for (const selector of SELECTORS.reviewCount) {
      const reviewCountEl = await page.$(selector);
      if (reviewCountEl) {
        const text = await reviewCountEl.textContent();
        const match = text?.match(/(\d+[,\d]*)/);
        if (match) {
          totalReviews = parseInt(match[1].replace(/,/g, ""));
          break;
        }
      }
    }
  } catch (e) {
    console.log("評価情報の取得でエラー:", e);
  }

  return { averageRating, totalReviews };
}

/**
 * 口コミリストを抽出
 */
async function extractReviews(page: Page, maxReviews: number): Promise<Review[]> {
  const reviews: Review[] = [];

  // 口コミアイテムのセレクタを探す
  const reviewItemSelector = await findValidSelector(page, SELECTORS.reviewItem, 10000);
  if (!reviewItemSelector) {
    console.log("口コミが見つかりません");
    return reviews;
  }

  // スクロールコンテナを探す
  const scrollContainerSelector = await findValidSelector(
    page,
    SELECTORS.scrollContainer,
    5000
  );

  // スクロールして口コミを読み込む
  for (let scroll = 0; scroll < 5 && reviews.length < maxReviews; scroll++) {
    const items = await page.$$(reviewItemSelector);

    for (let i = reviews.length; i < items.length && reviews.length < maxReviews; i++) {
      const item = items[i];

      try {
        // 著者名
        let authorName = "匿名";
        for (const selector of SELECTORS.authorName) {
          const authorEl = await item.$(selector);
          if (authorEl) {
            const name = await authorEl.textContent();
            if (name) {
              authorName = name.trim();
              break;
            }
          }
        }

        // 評価（星の数）
        let rating = 0;
        for (const selector of SELECTORS.reviewRating) {
          const starsEl = await item.$(selector);
          if (starsEl) {
            const starsLabel = await starsEl.getAttribute("aria-label");
            const ratingMatch = starsLabel?.match(/(\d)/);
            if (ratingMatch) {
              rating = parseInt(ratingMatch[1]);
              break;
            }
          }
        }

        // 投稿時期
        let relativeTime = "";
        for (const selector of SELECTORS.reviewTime) {
          const timeEl = await item.$(selector);
          if (timeEl) {
            relativeTime = (await timeEl.textContent())?.trim() || "";
            if (relativeTime) break;
          }
        }

        // 口コミ本文を取得（「もっと見る」展開込み）
        let text = await expandAndGetReviewText(item, page);

        // ユニークIDを生成
        const id = generateReviewId(authorName, relativeTime, rating);

        reviews.push({
          id,
          rating,
          text,
          authorName,
          publishedAt: parseRelativeTime(relativeTime),
          relativeTime,
        });
      } catch (e) {
        console.log(`口コミ${i + 1}の解析でエラー:`, e);
      }
    }

    // スクロール
    if (reviews.length < maxReviews && scrollContainerSelector) {
      const scrollContainer = await page.$(scrollContainerSelector);
      if (scrollContainer) {
        await scrollContainer.evaluate((el) => {
          el.scrollBy(0, 500);
        });
        await page.waitForTimeout(1000);
      }
    }
  }

  return reviews;
}

/**
 * 「もっと見る」ボタンを展開して口コミ本文を取得
 */
async function expandAndGetReviewText(
  item: Awaited<ReturnType<Page["$"]>>,
  page: Page
): Promise<string> {
  if (!item) return "";

  let text = "";

  // まず「もっと見る」ボタンを探してクリック
  for (const selector of SELECTORS.moreButton) {
    try {
      const moreButton = await item.$(selector);
      if (moreButton) {
        // ボタンが表示されているか確認
        const isVisible = await moreButton.isVisible();
        if (isVisible) {
          await moreButton.click();
          // クリック後にテキストが展開されるまで待機
          await page.waitForTimeout(500);
        }
        break;
      }
    } catch {
      // ボタンがない場合は無視
    }
  }

  // 展開後のテキストを取得
  for (const selector of SELECTORS.reviewText) {
    try {
      const textEl = await item.$(selector);
      if (textEl) {
        text = (await textEl.textContent())?.trim() || "";
        if (text) break;
      }
    } catch {
      continue;
    }
  }

  return text;
}

/**
 * 口コミIDを生成
 */
function generateReviewId(author: string, time: string, rating: number): string {
  const str = `${author}-${time}-${rating}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}

/**
 * 相対時間をDateに変換
 */
function parseRelativeTime(relativeTime: string): Date | null {
  const now = new Date();

  const patterns = [
    { regex: /(\d+)\s*分前/, unit: 60 * 1000 },
    { regex: /(\d+)\s*時間前/, unit: 60 * 60 * 1000 },
    { regex: /(\d+)\s*日前/, unit: 24 * 60 * 60 * 1000 },
    { regex: /(\d+)\s*週間前/, unit: 7 * 24 * 60 * 60 * 1000 },
    { regex: /(\d+)\s*か月前/, unit: 30 * 24 * 60 * 60 * 1000 },
    { regex: /(\d+)\s*年前/, unit: 365 * 24 * 60 * 60 * 1000 },
  ];

  for (const { regex, unit } of patterns) {
    const match = relativeTime.match(regex);
    if (match) {
      const value = parseInt(match[1]);
      return new Date(now.getTime() - value * unit);
    }
  }

  return null;
}

/**
 * 新着口コミを検出
 */
export function detectNewReviews(
  currentReviews: Review[],
  previousReviewIds: string[]
): Review[] {
  return currentReviews.filter((review) => !previousReviewIds.includes(review.id));
}

// cleanup is exported from browser-pool.ts
export { cleanup } from "./browser-pool";

// CLI実行用
if (process.argv[1].includes("maps-reviews")) {
  const placeName = process.argv[2] || "一蘭 新宿中央東口店";

  console.log(`\n=== Googleマップ口コミ取得 ===`);
  console.log(`店舗: ${placeName}`);
  console.log(`Headless: ${HEADLESS_DEFAULT}\n`);

  fetchReviews({
    placeName,
    maxReviews: 10,
  })
    .then((result) => {
      console.log("\n=== 結果 ===");
      if (result.error) {
        console.log(`エラー: ${result.error}`);
      } else {
        console.log(`店舗名: ${result.placeName}`);
        console.log(`平均評価: ${result.averageRating}`);
        console.log(`総口コミ数: ${result.totalReviews}`);
        console.log(`\n最新${result.reviews.length}件の口コミ:`);
        result.reviews.forEach((r, i) => {
          console.log(
            `\n${i + 1}. ${"★".repeat(r.rating)}${"☆".repeat(5 - r.rating)} (${r.relativeTime})`
          );
          console.log(`   ${r.authorName}`);
          console.log(`   ${r.text.slice(0, 100)}${r.text.length > 100 ? "..." : ""}`);
        });
      }
    })
    .catch(console.error)
    .finally(cleanup);
}
