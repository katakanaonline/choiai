/**
 * Instagram投稿取得スクレイパー
 *
 * 公開アカウントの投稿を取得する
 * API不要でコスト削減
 */

import { Page } from "playwright";
import { BrowserPool, HEADLESS_DEFAULT } from "./browser-pool";

export interface InstagramPost {
  id: string;
  shortcode: string;
  content: string;
  mediaUrls: string[];
  mediaType: "image" | "video" | "carousel";
  postedAt: Date;
  likes: number;
  comments: number;
}

export interface FetchInstagramPostsOptions {
  username: string;
  maxPosts?: number;
  headless?: boolean;
}

export interface FetchInstagramPostsResult {
  username: string;
  posts: InstagramPost[];
  fetchedAt: Date;
  error?: string;
}

/**
 * Instagram投稿を取得
 */
export async function fetchInstagramPosts(
  options: FetchInstagramPostsOptions
): Promise<FetchInstagramPostsResult> {
  const { username, maxPosts = 10, headless = HEADLESS_DEFAULT } = options;

  const pool = await BrowserPool.getInstance();
  let page: Page | null = null;

  try {
    const context = await pool.getContext({ headless });
    page = await context.newPage();

    // プロフィールページを開く
    const profileUrl = `https://www.instagram.com/${username}/`;
    await page.goto(profileUrl, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForTimeout(3000);

    // ログインポップアップを閉じる（あれば）
    try {
      const closeButton = await page.$('[aria-label="Close"]');
      if (closeButton) await closeButton.click();
    } catch {
      // 無視
    }

    // 投稿リンクを取得
    const postLinks = await extractPostLinks(page, maxPosts);

    // 各投稿の詳細を取得
    const posts: InstagramPost[] = [];
    for (const link of postLinks) {
      try {
        const post = await fetchPostDetails(page, link);
        if (post) {
          posts.push(post);
        }
        // レート制限を避けるため間隔を空ける
        await page.waitForTimeout(1000);
      } catch (e) {
        console.log("投稿取得エラー:", e);
      }
    }

    return {
      username,
      posts,
      fetchedAt: new Date(),
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Instagram fetch error:", errorMessage);

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
 * プロフィールページから投稿リンクを抽出
 */
async function extractPostLinks(page: Page, maxPosts: number): Promise<string[]> {
  const links: string[] = [];
  const seenShortcodes = new Set<string>();

  // 投稿リンクを探す
  for (let scroll = 0; scroll < 3 && links.length < maxPosts; scroll++) {
    const anchors = await page.$$('a[href*="/p/"]');

    for (const anchor of anchors) {
      if (links.length >= maxPosts) break;

      const href = await anchor.getAttribute("href");
      if (!href) continue;

      const match = href.match(/\/p\/([A-Za-z0-9_-]+)/);
      if (match && !seenShortcodes.has(match[1])) {
        seenShortcodes.add(match[1]);
        links.push(`https://www.instagram.com${href}`);
      }
    }

    // スクロール
    if (links.length < maxPosts) {
      await page.evaluate(() => window.scrollBy(0, 1000));
      await page.waitForTimeout(2000);
    }
  }

  return links;
}

/**
 * 投稿詳細を取得
 */
async function fetchPostDetails(
  page: Page,
  postUrl: string
): Promise<InstagramPost | null> {
  await page.goto(postUrl, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForTimeout(2000);

  try {
    // shortcodeを抽出
    const match = postUrl.match(/\/p\/([A-Za-z0-9_-]+)/);
    if (!match) return null;
    const shortcode = match[1];

    // キャプションを取得
    let content = "";
    const captionEl = await page.$('h1');
    if (captionEl) {
      content = (await captionEl.textContent())?.trim() || "";
    }

    // 代替セレクタ
    if (!content) {
      const metaDesc = await page.$('meta[name="description"]');
      if (metaDesc) {
        const descContent = await metaDesc.getAttribute("content");
        if (descContent) {
          // "username: caption text" の形式から抽出
          const captionMatch = descContent.match(/^[^:]+:\s*"?(.+)"?$/);
          content = captionMatch ? captionMatch[1] : descContent;
        }
      }
    }

    // メディアURLを取得
    const mediaUrls: string[] = [];
    let mediaType: "image" | "video" | "carousel" = "image";

    // 画像
    const images = await page.$$('article img[src*="instagram"]');
    for (const img of images) {
      const src = await img.getAttribute("src");
      if (src && src.includes("instagram") && !src.includes("profile")) {
        mediaUrls.push(src);
      }
    }

    // 動画
    const videos = await page.$$("video");
    if (videos.length > 0) {
      mediaType = "video";
      for (const video of videos) {
        const src = await video.getAttribute("src");
        if (src) {
          mediaUrls.push(src);
        }
      }
    }

    // カルーセル判定
    const carouselIndicator = await page.$('[aria-label*="次"]');
    if (carouselIndicator || mediaUrls.length > 1) {
      mediaType = "carousel";
    }

    // 投稿日時を取得
    let postedAt = new Date();
    const timeEl = await page.$("time");
    if (timeEl) {
      const datetime = await timeEl.getAttribute("datetime");
      if (datetime) {
        postedAt = new Date(datetime);
      }
    }

    // いいね数を取得（概算）
    let likes = 0;
    const likeSection = await page.$('section:has-text("いいね")');
    if (likeSection) {
      const text = await likeSection.textContent();
      const likeMatch = text?.match(/(\d+[,\d]*)/);
      if (likeMatch) {
        likes = parseInt(likeMatch[1].replace(/,/g, ""));
      }
    }

    // コメント数を取得
    let comments = 0;
    const commentLink = await page.$('a[href*="/comments/"]');
    if (commentLink) {
      const text = await commentLink.textContent();
      const commentMatch = text?.match(/(\d+)/);
      if (commentMatch) {
        comments = parseInt(commentMatch[1]);
      }
    }

    return {
      id: shortcode,
      shortcode,
      content,
      mediaUrls,
      mediaType,
      postedAt,
      likes,
      comments,
    };
  } catch (e) {
    console.log("投稿詳細の解析でエラー:", e);
    return null;
  }
}

/**
 * ブラウザプールをクリーンアップ
 */
export { cleanup } from "./browser-pool";

// CLI実行用
if (process.argv[1].includes("sns-instagram")) {
  const username = process.argv[2] || "instagram";

  console.log(`\n=== Instagram投稿取得 ===`);
  console.log(`ユーザー: @${username}`);
  console.log(`Headless: ${HEADLESS_DEFAULT}\n`);

  fetchInstagramPosts({ username, maxPosts: 5 })
    .then((result) => {
      console.log("\n=== 結果 ===");
      if (result.error) {
        console.log(`エラー: ${result.error}`);
      } else {
        console.log(`取得件数: ${result.posts.length}`);
        result.posts.forEach((post, i) => {
          console.log(`\n${i + 1}. [${post.postedAt.toLocaleString()}] ${post.mediaType}`);
          console.log(`   ${post.content.slice(0, 100)}${post.content.length > 100 ? "..." : ""}`);
          console.log(`   ♥${post.likes} 💬${post.comments}`);
          if (post.mediaUrls.length > 0) {
            console.log(`   📷 ${post.mediaUrls.length}件のメディア`);
          }
        });
      }
    })
    .catch(console.error);
}
