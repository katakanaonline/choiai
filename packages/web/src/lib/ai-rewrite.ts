import Anthropic from "@anthropic-ai/sdk";
import { generateWithOllama, isOllamaAvailable } from "./ollama";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

type Platform = "gbp" | "x" | "instagram";

interface RewriteResult {
  platform: Platform;
  original: string;
  rewritten: string;
}

const PLATFORM_PROMPTS: Record<Platform, string> = {
  gbp: `Googleビジネスプロフィール（GBP）向けに最適化してください。
- 地域の検索で見つかりやすい表現を使う
- 営業時間やサービス内容が伝わる形に
- 絵文字は控えめに（1-2個まで）
- 200文字以内`,

  x: `X（Twitter）向けに最適化してください。
- 140文字以内に収める
- ハッシュタグを1-2個追加（日本語OK）
- 絵文字を効果的に使用
- リツイートしたくなる表現`,

  instagram: `Instagram向けに最適化してください。
- キャプションとして自然な文章
- 改行を活用して読みやすく
- 関連ハッシュタグを5個程度追加
- 絵文字を積極的に使用
- 300文字程度`,
};

/**
 * 投稿内容を各プラットフォーム向けに最適化
 */
export async function rewriteForPlatforms(
  content: string,
  platforms: Platform[]
): Promise<RewriteResult[]> {
  const results: RewriteResult[] = [];

  for (const platform of platforms) {
    try {
      const rewritten = await rewriteForPlatform(content, platform);
      results.push({
        platform,
        original: content,
        rewritten,
      });
    } catch (error) {
      console.error(`Rewrite error for ${platform}:`, error);
      // エラー時は元のコンテンツをそのまま使用
      results.push({
        platform,
        original: content,
        rewritten: content,
      });
    }
  }

  return results;
}

/**
 * 単一プラットフォーム向けにリライト
 * Ollama (DeepSeek) 優先、Claudeフォールバック
 */
async function rewriteForPlatform(
  content: string,
  platform: Platform
): Promise<string> {
  const systemPrompt = `あなたは地域密着型店舗のSNSマーケティング担当です。
店舗の投稿を各プラットフォームに最適化します。
元の投稿の意図を保ちつつ、各プラットフォームの特性に合わせて書き換えてください。
出力は最適化後のテキストのみ。説明は不要です。`;

  const userPrompt = `元の投稿:
${content}

${PLATFORM_PROMPTS[platform]}`;

  const fullPrompt = `${systemPrompt}\n\n${userPrompt}`;

  // Ollama優先
  if (await isOllamaAvailable()) {
    try {
      console.log(`[AI-Rewrite] Using Ollama for ${platform}`);
      const result = await generateWithOllama(fullPrompt, 500);
      return result || content;
    } catch (error) {
      console.error(`[AI-Rewrite] Ollama error, fallback to Claude:`, error);
    }
  }

  // Claudeフォールバック
  console.log(`[AI-Rewrite] Using Claude for ${platform}`);
  const response = await anthropic.messages.create({
    model: "claude-3-5-haiku-latest",
    max_tokens: 500,
    messages: [
      {
        role: "user",
        content: userPrompt,
      },
    ],
    system: systemPrompt,
  });

  const textBlock = response.content.find((block) => block.type === "text");
  return textBlock?.text?.trim() || content;
}

/**
 * 投稿内容からデイリーレポート用のヒントを生成
 * Ollama (DeepSeek) 優先、Claudeフォールバック
 */
export async function generateDailyTips(
  recentPosts: { content: string; views: number; reactions: number }[]
): Promise<string[]> {
  const defaultTips = [
    "写真付き投稿は反応が2倍になる傾向があります",
    "14時〜16時の投稿がよく見られています",
    "まずは1日1投稿を続けてみましょう",
  ];

  if (recentPosts.length === 0) {
    return defaultTips;
  }

  const systemPrompt = `あなたは地域密着型店舗のマーケティングアドバイザーです。
最近の投稿データを分析し、具体的で実行可能なアドバイスを3つ提供してください。
各アドバイスは1文で、日本語で書いてください。`;

  const postsData = recentPosts
    .map((p, i) => `${i + 1}. "${p.content.slice(0, 50)}..." (${p.views}表示, ${p.reactions}反応)`)
    .join("\n");

  const userPrompt = `最近の投稿データ:\n${postsData}\n\n3つのアドバイスを箇条書きで（「・」で始める）:`;
  const fullPrompt = `${systemPrompt}\n\n${userPrompt}`;

  // Ollama優先
  if (await isOllamaAvailable()) {
    try {
      console.log("[Daily-Tips] Using Ollama");
      const text = await generateWithOllama(fullPrompt, 300);
      const tips = text
        .split("\n")
        .filter((line) => line.startsWith("・") || line.startsWith("-"))
        .map((line) => line.replace(/^[・-]\s*/, "").trim())
        .filter((tip) => tip.length > 0)
        .slice(0, 3);

      if (tips.length > 0) {
        return tips;
      }
    } catch (error) {
      console.error("[Daily-Tips] Ollama error, fallback to Claude:", error);
    }
  }

  // Claudeフォールバック
  try {
    console.log("[Daily-Tips] Using Claude");
    const response = await anthropic.messages.create({
      model: "claude-3-5-haiku-latest",
      max_tokens: 300,
      messages: [{ role: "user", content: userPrompt }],
      system: systemPrompt,
    });

    const textBlock = response.content.find((block) => block.type === "text");
    const text = textBlock?.text || "";

    const tips = text
      .split("\n")
      .filter((line) => line.startsWith("・") || line.startsWith("-"))
      .map((line) => line.replace(/^[・-]\s*/, "").trim())
      .filter((tip) => tip.length > 0)
      .slice(0, 3);

    if (tips.length > 0) {
      return tips;
    }
  } catch (error) {
    console.error("[Daily-Tips] Claude error:", error);
  }

  return defaultTips;
}
