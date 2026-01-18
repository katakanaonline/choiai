/**
 * SNS投稿をGBP向けにリライトする機能
 *
 * Claude APIを使用してSNS投稿をGoogleビジネスプロフィール向けに最適化
 */

import "server-only";

export interface RewriteOptions {
  platform: "x" | "instagram";
  originalContent: string;
  storeName: string;
  storeType?: string; // 業種（ラーメン店、美容院など）
}

export interface RewriteResult {
  rewrittenContent: string;
  success: boolean;
  error?: string;
}

const REWRITE_PROMPT = `あなたはGoogleビジネスプロフィール（GBP）の投稿を最適化するエキスパートです。

以下のSNS投稿をGBP向けにリライトしてください。

【店舗情報】
店舗名: {storeName}
業種: {storeType}

【元の投稿（{platform}）】
{originalContent}

【リライト要件】
- 1500文字以内（必須）
- ハッシュタグは除去
- 絵文字は控えめに（最大2個まで）
- 店舗への来店を促すCTA（行動喚起）を追加
- ですます調で丁寧に
- 具体的な商品名・サービス名があれば維持
- 元の投稿の意図や魅力を損なわない
- 地域のお客様に向けた親しみやすい文章

【出力形式】
リライトした文章のみを出力してください。説明や補足は不要です。`;

/**
 * SNS投稿をGBP向けにリライト
 */
export async function rewriteForGBP(
  options: RewriteOptions
): Promise<RewriteResult> {
  const {
    platform,
    originalContent,
    storeName,
    storeType = "店舗",
  } = options;

  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    // APIキーがない場合はテンプレートベースのリライト
    return templateBasedRewrite(options);
  }

  try {
    const prompt = REWRITE_PROMPT
      .replace("{storeName}", storeName)
      .replace("{storeType}", storeType)
      .replace("{platform}", platform === "x" ? "X（Twitter）" : "Instagram")
      .replace("{originalContent}", originalContent);

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-haiku-20240307",
        max_tokens: 2000,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      }),
    });

    const data = await response.json();

    if (data.content && data.content[0]?.text) {
      const rewrittenContent = data.content[0].text.trim();

      // 文字数チェック
      if (rewrittenContent.length > 1500) {
        // 長すぎる場合は切り詰め
        return {
          rewrittenContent: rewrittenContent.slice(0, 1497) + "...",
          success: true,
        };
      }

      return {
        rewrittenContent,
        success: true,
      };
    }

    return templateBasedRewrite(options);
  } catch (error) {
    console.error("Rewrite API error:", error);
    return templateBasedRewrite(options);
  }
}

/**
 * テンプレートベースのリライト（フォールバック）
 */
function templateBasedRewrite(options: RewriteOptions): RewriteResult {
  const { originalContent, storeName } = options;

  // ハッシュタグを除去
  let content = originalContent.replace(/#[^\s#]+/g, "").trim();

  // 絵文字を最大2個に制限
  const emojiRegex = /\p{Emoji}/gu;
  const emojis = content.match(emojiRegex) || [];
  if (emojis.length > 2) {
    let emojiCount = 0;
    content = content.replace(emojiRegex, (match) => {
      emojiCount++;
      return emojiCount <= 2 ? match : "";
    });
  }

  // 改行を整理
  content = content.replace(/\n{3,}/g, "\n\n").trim();

  // CTAを追加
  const cta = `\n\n${storeName}へのご来店をお待ちしております。`;

  const rewrittenContent = content + cta;

  // 文字数チェック
  if (rewrittenContent.length > 1500) {
    return {
      rewrittenContent: content.slice(0, 1450) + "..." + cta,
      success: true,
    };
  }

  return {
    rewrittenContent,
    success: true,
  };
}

/**
 * 複数の投稿を一括リライト
 */
export async function batchRewriteForGBP(
  posts: Array<{
    id: string;
    platform: "x" | "instagram";
    content: string;
  }>,
  storeName: string,
  storeType?: string
): Promise<Map<string, RewriteResult>> {
  const results = new Map<string, RewriteResult>();

  for (const post of posts) {
    const result = await rewriteForGBP({
      platform: post.platform,
      originalContent: post.content,
      storeName,
      storeType,
    });
    results.set(post.id, result);

    // レート制限を避けるため間隔を空ける
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  return results;
}
