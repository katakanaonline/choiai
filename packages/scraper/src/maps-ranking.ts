/**
 * Googleマップ順位チェッカー
 *
 * 指定キーワードでGoogleマップを検索し、対象店舗の順位を取得する
 *
 * 改善点 (2026/01/18 レビュー対応):
 * - 位置情報の設定可能化
 * - Place IDによる正確な順位特定
 * - 環境変数でheadless制御
 * - セレクタの堅牢化（複数パターン対応）
 * - ブラウザプール導入
 */

import { Page } from "playwright";
import {
  BrowserPool,
  GeoLocation,
  HEADLESS_DEFAULT,
  trySelectors,
  cleanup,
} from "./browser-pool";

export interface RankingResult {
  keyword: string;
  targetPlaceId: string;
  rank: number | null; // null = 圏外（20位以下）
  totalResults: number;
  topResults: PlaceResult[];
  checkedAt: Date;
  error?: string;
}

export interface PlaceResult {
  rank: number;
  name: string;
  placeId?: string; // URLから抽出したPlace ID
  rating?: number;
  reviewCount?: number;
  address?: string;
  url?: string;
}

// GeoLocation is imported from browser-pool.ts
export type { GeoLocation } from "./browser-pool";

export interface CheckRankingOptions {
  keyword: string;
  targetPlaceId?: string;
  targetName?: string; // Place IDがない場合、名前で検索
  location?: GeoLocation; // 検索地点（省略時は店舗住所から推定 or 東京）
  maxResults?: number; // デフォルト20
  headless?: boolean; // 省略時は環境変数 or true
}

// セレクタ候補（Googleマップの構造変更に対応）
const SELECTORS = {
  feed: [
    'div[role="feed"]',
    'div[role="main"] div[role="feed"]',
    'div.m6QErb[role="feed"]',
  ],
  resultItem: [
    'div[role="feed"] > div > div[jsaction]',
    'div[role="feed"] > div > a',
    'div.Nv2PK',
  ],
  storeName: [
    'div.fontHeadlineSmall',
    'div.qBF1Pd',
    'a.hfpxzc',
    'span.fontHeadlineSmall',
  ],
  rating: [
    'span[role="img"][aria-label*="星"]',
    'span[role="img"][aria-label*="star"]',
    'span.MW4etd',
  ],
  reviewCount: [
    'span:has-text("件")',
    'span.UY7F9',
    'span:has-text("reviews")',
  ],
  address: [
    'div.fontBodyMedium span:not([role])',
    'span.W4Efsd:nth-child(2)',
  ],
};

// BrowserPool and trySelectors are imported from browser-pool.ts

/**
 * URLからPlace IDを抽出
 */
function extractPlaceIdFromUrl(url: string): string | null {
  // パターン1: /place/.../.../data=...!1s0x...!2s...
  const match1 = url.match(/!1s(0x[a-f0-9]+:[a-f0-9]+)/i);
  if (match1) return match1[1];

  // パターン2: place_id=...
  const match2 = url.match(/place_id=([^&]+)/);
  if (match2) return match2[1];

  // パターン3: /maps/place/.../@.../data=!3m1!4b1!4m...!3m...!1s...
  const match3 = url.match(/!3m\d+!1s([^!]+)/);
  if (match3) return decodeURIComponent(match3[1]);

  return null;
}

/**
 * 住所から緯度経度を取得（Nominatim API使用）
 */
export async function geocodeAddress(address: string): Promise<GeoLocation | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`;
    const response = await fetch(url, {
      headers: { "User-Agent": "choi-marketing/1.0" },
    });
    const data = (await response.json()) as Array<{ lat: string; lon: string }>;

    if (data && data.length > 0) {
      return {
        latitude: parseFloat(data[0].lat),
        longitude: parseFloat(data[0].lon),
      };
    }
  } catch (error) {
    console.error("Geocoding error:", error);
  }
  return null;
}

/**
 * Googleマップで順位をチェック
 */
export async function checkMapsRanking(
  options: CheckRankingOptions
): Promise<RankingResult> {
  const {
    keyword,
    targetPlaceId,
    targetName,
    location,
    maxResults = 20,
    headless = HEADLESS_DEFAULT,
  } = options;

  const pool = await BrowserPool.getInstance();
  let page: Page | null = null;

  try {
    const context = await pool.getContext({ headless, location });
    page = await context.newPage();

    // Googleマップを開く
    const searchUrl = `https://www.google.com/maps/search/${encodeURIComponent(keyword)}`;
    await page.goto(searchUrl, { waitUntil: "domcontentloaded", timeout: 30000 });

    // 検索結果が読み込まれるまで待機
    await page.waitForTimeout(2000);

    // 結果リストを取得
    const results = await extractSearchResults(page, maxResults);

    // 対象店舗の順位を特定
    let rank: number | null = null;

    for (let i = 0; i < results.length; i++) {
      const result = results[i];

      // Place IDで比較（最も正確）
      if (targetPlaceId && result.placeId) {
        if (result.placeId === targetPlaceId) {
          rank = i + 1;
          break;
        }
      }

      // 名前で部分一致（フォールバック）
      if (targetName && result.name) {
        const normalizedTarget = targetName.toLowerCase().replace(/\s+/g, "");
        const normalizedResult = result.name.toLowerCase().replace(/\s+/g, "");
        if (
          normalizedResult.includes(normalizedTarget) ||
          normalizedTarget.includes(normalizedResult)
        ) {
          rank = i + 1;
          break;
        }
      }
    }

    return {
      keyword,
      targetPlaceId: targetPlaceId || "",
      rank,
      totalResults: results.length,
      topResults: results,
      checkedAt: new Date(),
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Ranking check error:", errorMessage);

    return {
      keyword,
      targetPlaceId: targetPlaceId || "",
      rank: null,
      totalResults: 0,
      topResults: [],
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
 * 検索結果リストを抽出
 */
async function extractSearchResults(
  page: Page,
  maxResults: number
): Promise<PlaceResult[]> {
  const results: PlaceResult[] = [];

  // フィードセレクタを探す
  const feedSelector = await trySelectors(page, SELECTORS.feed, 10000);
  if (!feedSelector) {
    console.log("検索結果フィードが見つかりません");
    return results;
  }

  // 結果アイテムのセレクタを探す
  const itemSelector = await trySelectors(page, SELECTORS.resultItem, 5000);
  if (!itemSelector) {
    console.log("検索結果アイテムが見つかりません");
    return results;
  }

  // スクロールして結果を読み込む
  for (let scroll = 0; scroll < 5 && results.length < maxResults; scroll++) {
    const items = await page.$$(itemSelector);

    for (let i = results.length; i < items.length && results.length < maxResults; i++) {
      const item = items[i];

      try {
        // 店舗名を取得
        let name: string | null = null;
        for (const nameSelector of SELECTORS.storeName) {
          const nameEl = await item.$(nameSelector);
          if (nameEl) {
            name = await nameEl.textContent();
            if (name) break;
          }
        }

        if (!name) continue;

        // URLを取得してPlace IDを抽出
        let url: string | undefined;
        let placeId: string | undefined;

        const linkEl = await item.$("a");
        if (linkEl) {
          url = (await linkEl.getAttribute("href")) || undefined;
          if (url) {
            placeId = extractPlaceIdFromUrl(url) || undefined;
          }
        }

        // 評価を取得
        let rating: number | undefined;
        for (const ratingSelector of SELECTORS.rating) {
          const ratingEl = await item.$(ratingSelector);
          if (ratingEl) {
            const ratingText = await ratingEl.getAttribute("aria-label");
            const ratingMatch = ratingText?.match(/(\d+\.?\d*)/);
            if (ratingMatch) {
              rating = parseFloat(ratingMatch[1]);
              break;
            }
          }
        }

        // レビュー数を取得
        let reviewCount: number | undefined;
        for (const reviewSelector of SELECTORS.reviewCount) {
          const reviewEl = await item.$(reviewSelector);
          if (reviewEl) {
            const reviewText = await reviewEl.textContent();
            const reviewMatch = reviewText?.match(/\(?([\d,]+)\)?/);
            if (reviewMatch) {
              reviewCount = parseInt(reviewMatch[1].replace(/,/g, ""));
              break;
            }
          }
        }

        // 住所を取得
        let address: string | undefined;
        for (const addressSelector of SELECTORS.address) {
          const addressEl = await item.$(addressSelector);
          if (addressEl) {
            address = (await addressEl.textContent())?.trim();
            if (address) break;
          }
        }

        results.push({
          rank: results.length + 1,
          name: name.trim(),
          placeId,
          rating,
          reviewCount,
          address,
          url,
        });
      } catch (e) {
        // 個別のアイテムでエラーが出ても続行
        console.log(`結果${i + 1}の解析でエラー:`, e);
      }
    }

    // スクロールして次の結果を読み込む
    if (results.length < maxResults) {
      const feed = await page.$(feedSelector);
      if (feed) {
        await feed.evaluate((el) => {
          el.scrollBy(0, 500);
        });
        await page.waitForTimeout(1000);
      }
    }
  }

  return results;
}

/**
 * 複数キーワードの順位を一括チェック（ブラウザプール使用）
 */
export async function checkMultipleKeywords(
  keywords: string[],
  targetPlaceId: string,
  targetName: string,
  options?: {
    location?: GeoLocation;
    headless?: boolean;
  }
): Promise<RankingResult[]> {
  const results: RankingResult[] = [];
  const headless = options?.headless ?? HEADLESS_DEFAULT;

  for (const keyword of keywords) {
    console.log(`チェック中: ${keyword}`);

    const result = await checkMapsRanking({
      keyword,
      targetPlaceId,
      targetName,
      location: options?.location,
      headless,
    });

    results.push(result);

    // レート制限を避けるため間隔を空ける
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  return results;
}

// cleanup is exported from browser-pool.ts
export { cleanup } from "./browser-pool";

// CLI実行用
if (process.argv[1].includes("maps-ranking")) {
  const keyword = process.argv[2] || "新宿 ラーメン";
  const targetName = process.argv[3] || "一蘭";

  console.log(`\n=== Googleマップ順位チェック ===`);
  console.log(`キーワード: ${keyword}`);
  console.log(`対象店舗: ${targetName}`);
  console.log(`Headless: ${HEADLESS_DEFAULT}\n`);

  checkMapsRanking({
    keyword,
    targetPlaceId: "",
    targetName,
    maxResults: 10,
  })
    .then((result) => {
      console.log("\n=== 結果 ===");
      if (result.error) {
        console.log(`エラー: ${result.error}`);
      } else {
        console.log(`順位: ${result.rank ?? "圏外"}`);
        console.log(`取得件数: ${result.totalResults}`);
        console.log("\nトップ10:");
        result.topResults.slice(0, 10).forEach((r) => {
          const rating = r.rating ? `★${r.rating}` : "";
          const reviews = r.reviewCount ? `(${r.reviewCount}件)` : "";
          const pid = r.placeId ? `[${r.placeId.slice(0, 15)}...]` : "";
          console.log(`  ${r.rank}. ${r.name} ${rating} ${reviews} ${pid}`);
        });
      }
    })
    .catch(console.error)
    .finally(cleanup);
}
