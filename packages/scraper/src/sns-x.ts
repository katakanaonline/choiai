/**
 * X（Twitter）投稿取得スクレイパー
 *
 * 公開アカウントの投稿を取得する
 * API不要でコスト削減
 */

import { Page } from "playwright";
import { BrowserPool, HEADLESS_DEFAULT } from "./browser-pool";

export interface XPost {
  id: string;
  content: string;
  mediaUrls: string[];
  postedAt: Date;
  likes: number;
  retweets: number;
  replies: number;
}

export interface FetchXPostsOptions {
  username: string;
  maxPosts?: number;
  headless?: boolean;
}

export interface FetchXPostsResult {
  username: string;
  posts: XPost[];
  fetchedAt: Date;
  error?: string;
}

// セレクタ（X/Twitterの構造変更に対応）
const SELECTORS = {
  tweet: [
    'article[data-testid="tweet"]',
    'article[role="article"]',
  ],
  tweetText: [
    '[data-testid="tweetText"]',
    'div[lang]',
  ],
  tweetTime: [
    'time',
    'a time',
  ],
  tweetLink: [
    'a[href*="/status/"]',
  ],
  mediaImage: [
    '[data-testid="tweetPhoto"] img',
    'img[src*="pbs.twimg.com/media"]',
  ],
  mediaVideo: [
    '[data-testid="videoPlayer"]',
    'video',
  ],
  likeCount: [
    '[data-testid="like"] span',
  ],
  retweetCount: [
    '[data-testid="retweet"] span',
  ],
  replyCount: [
    '[data-testid="reply"] span',
  ],
};

/**
 * X（Twitter）の投稿を取得
 */
export async function fetchXPosts(
  options: FetchXPostsOptions
): Promise<FetchXPostsResult> {
  const { username, maxPosts = 10, headless = HEADLESS_DEFAULT } = options;

  const pool = await BrowserPool.getInstance();
  let page: Page | null = null;

  try {
    const context = await pool.getContext({ headless });
    page = await context.newPage();

    // ユーザーページを開く
    const profileUrl = `https://x.com/${username}`;
    await page.goto(profileUrl, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForTimeout(3000);

    // ログイン要求ポップアップを閉じる（あれば）
    try {
      const closeButton = await page.$('[data-testid="app-bar-close"]');
      if (closeButton) await closeButton.click();
    } catch {
      // 無視
    }

    // 投稿を取得
    const posts = await extractPosts(page, maxPosts);

    return {
      username,
      posts,
      fetchedAt: new Date(),
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("X fetch error:", errorMessage);

    return {
      username,
      posts: [],
      fetchedAt: new Date(),
      error: errorMessage,
    };
  } finally {
    if (page) {
      await page.close();
    }
  }
}

/**
 * 投稿を抽出
 */
async function extractPosts(page: Page, maxPosts: number): Promise<XPost[]> {
  const posts: XPost[] = [];
  const seenIds = new Set<string>();

  // 投稿セレクタを探す
  let tweetSelector: string | null = null;
  for (const selector of SELECTORS.tweet) {
    try {
      await page.waitForSelector(selector, { timeout: 10000 });
      tweetSelector = selector;
      break;
    } catch {
      continue;
    }
  }

  if (!tweetSelector) {
    console.log("投稿が見つかりません");
    return posts;
  }

  // スクロールして投稿を読み込む
  for (let scroll = 0; scroll < 5 && posts.length < maxPosts; scroll++) {
    const tweets = await page.$$(tweetSelector);

    for (const tweet of tweets) {
      if (posts.length >= maxPosts) break;

      try {
        // 投稿IDを取得
        let postId: string | null = null;
        const linkEl = await tweet.$('a[href*="/status/"]');
        if (linkEl) {
          const href = await linkEl.getAttribute("href");
          const match = href?.match(/\/status\/(\d+)/);
          if (match) {
            postId = match[1];
          }
        }

        if (!postId || seenIds.has(postId)) continue;
        seenIds.add(postId);

        // テキストを取得
        let content = "";
        for (const selector of SELECTORS.tweetText) {
          const textEl = await tweet.$(selector);
          if (textEl) {
            content = (await textEl.textContent())?.trim() || "";
            if (content) break;
          }
        }

        // リツイートや引用ツイートは除外
        const isRetweet = content.startsWith("RT @");
        if (isRetweet) continue;

        // 投稿日時を取得
        let postedAt = new Date();
        const timeEl = await tweet.$("time");
        if (timeEl) {
          const datetime = await timeEl.getAttribute("datetime");
          if (datetime) {
            postedAt = new Date(datetime);
          }
        }

        // メディアURLを取得
        const mediaUrls: string[] = [];
        const images = await tweet.$$('[data-testid="tweetPhoto"] img');
        for (const img of images) {
          const src = await img.getAttribute("src");
          if (src && src.includes("pbs.twimg.com/media")) {
            // 高画質版のURLに変換
            const highQualitySrc = src.replace(/&name=\w+/, "&name=large");
            mediaUrls.push(highQualitySrc);
          }
        }

        // エンゲージメント数を取得
        const likes = await getCount(tweet, SELECTORS.likeCount);
        const retweets = await getCount(tweet, SELECTORS.retweetCount);
        const replies = await getCount(tweet, SELECTORS.replyCount);

        posts.push({
          id: postId,
          content,
          mediaUrls,
          postedAt,
          likes,
          retweets,
          replies,
        });
      } catch (e) {
        console.log("投稿の解析でエラー:", e);
      }
    }

    // スクロール
    if (posts.length < maxPosts) {
      await page.evaluate(() => window.scrollBy(0, 1000));
      await page.waitForTimeout(2000);
    }
  }

  return posts;
}

/**
 * カウント数を取得
 */
async function getCount(
  tweet: Awaited<ReturnType<Page["$"]>>,
  selectors: string[]
): Promise<number> {
  if (!tweet) return 0;

  for (const selector of selectors) {
    try {
      const el = await tweet.$(selector);
      if (el) {
        const text = await el.textContent();
        if (text) {
          // "1.2K" -> 1200, "5M" -> 5000000 のような変換
          const num = parseEngagementNumber(text.trim());
          if (num > 0) return num;
        }
      }
    } catch {
      continue;
    }
  }
  return 0;
}

/**
 * エンゲージメント数をパース（1.2K -> 1200）
 */
function parseEngagementNumber(text: string): number {
  const match = text.match(/^([\d.]+)([KMB])?$/i);
  if (!match) return parseInt(text.replace(/,/g, "")) || 0;

  const num = parseFloat(match[1]);
  const suffix = match[2]?.toUpperCase();

  switch (suffix) {
    case "K":
      return Math.round(num * 1000);
    case "M":
      return Math.round(num * 1000000);
    case "B":
      return Math.round(num * 1000000000);
    default:
      return Math.round(num);
  }
}

/**
 * ブラウザプールをクリーンアップ
 */
export { cleanup } from "./browser-pool";

// CLI実行用
if (process.argv[1].includes("sns-x")) {
  const username = process.argv[2] || "Google";

  console.log(`\n=== X投稿取得 ===`);
  console.log(`ユーザー: @${username}`);
  console.log(`Headless: ${HEADLESS_DEFAULT}\n`);

  fetchXPosts({ username, maxPosts: 5 })
    .then((result) => {
      console.log("\n=== 結果 ===");
      if (result.error) {
        console.log(`エラー: ${result.error}`);
      } else {
        console.log(`取得件数: ${result.posts.length}`);
        result.posts.forEach((post, i) => {
          console.log(`\n${i + 1}. [${post.postedAt.toLocaleString()}]`);
          console.log(`   ${post.content.slice(0, 100)}${post.content.length > 100 ? "..." : ""}`);
          console.log(`   ♥${post.likes} 🔁${post.retweets} 💬${post.replies}`);
          if (post.mediaUrls.length > 0) {
            console.log(`   📷 ${post.mediaUrls.length}枚の画像`);
          }
        });
      }
    })
    .catch(console.error);
}
