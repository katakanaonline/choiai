import { chromium, Page, BrowserContext } from "playwright";

/**
 * AEO (AI Engine Optimization) チェッカー
 *
 * ChatGPT、Perplexity、Google AI Overviewでの言及をチェック
 */

export interface AeoCheckResult {
  platform: "chatgpt" | "perplexity" | "gemini";
  query: string;
  mentioned: boolean;
  mentionType: "direct" | "indirect" | "not_found";
  context?: string;
  competitors: string[];
  timestamp: string;
}

export interface AeoScoreResult {
  storeName: string;
  overallScore: number;
  platformScores: {
    chatgpt: number;
    perplexity: number;
    gemini: number;
  };
  queries: AeoCheckResult[];
  recommendations: string[];
}

/**
 * Perplexityで言及チェック
 */
export async function checkPerplexity(
  query: string,
  targetStoreName: string,
  page: Page
): Promise<AeoCheckResult> {
  const result: AeoCheckResult = {
    platform: "perplexity",
    query,
    mentioned: false,
    mentionType: "not_found",
    competitors: [],
    timestamp: new Date().toISOString(),
  };

  try {
    // Perplexityにアクセス
    await page.goto("https://www.perplexity.ai/", { waitUntil: "networkidle" });

    // 検索ボックスを探す
    const searchInput = await page.$('textarea[placeholder*="Ask"], input[type="text"]');
    if (!searchInput) {
      console.log("Perplexity: Search input not found");
      return result;
    }

    // クエリ入力
    await searchInput.fill(query);
    await page.keyboard.press("Enter");

    // 回答を待つ（最大30秒）
    await page.waitForTimeout(5000);

    // 回答テキストを取得
    const answerElements = await page.$$("div[class*='prose'], div[class*='answer']");
    let answerText = "";

    for (const el of answerElements) {
      const text = await el.textContent();
      if (text) {
        answerText += text + "\n";
      }
    }

    // 店名の言及をチェック
    const storeNameLower = targetStoreName.toLowerCase();
    const answerLower = answerText.toLowerCase();

    if (answerLower.includes(storeNameLower)) {
      result.mentioned = true;
      result.mentionType = "direct";

      // コンテキスト抽出（店名の前後100文字）
      const idx = answerLower.indexOf(storeNameLower);
      const start = Math.max(0, idx - 100);
      const end = Math.min(answerText.length, idx + targetStoreName.length + 100);
      result.context = answerText.slice(start, end);
    } else {
      // 間接的な言及（類似の店名やカテゴリ）をチェック
      const keywords = targetStoreName.split(/\s+/);
      const matchedKeywords = keywords.filter((kw) =>
        answerLower.includes(kw.toLowerCase())
      );
      if (matchedKeywords.length > 0) {
        result.mentionType = "indirect";
        result.context = `関連キーワード検出: ${matchedKeywords.join(", ")}`;
      }
    }

    // 競合店舗名を抽出（一般的なパターン）
    const competitorPatterns = [
      /「([^」]+)」/g,
      /『([^』]+)』/g,
      /\d\.\s*([^\n]+)/g, // リスト形式
    ];

    for (const pattern of competitorPatterns) {
      const matches = answerText.matchAll(pattern);
      for (const match of matches) {
        if (match[1] && match[1].length < 50) {
          result.competitors.push(match[1].trim());
        }
      }
    }

    // 重複除去
    result.competitors = [...new Set(result.competitors)].slice(0, 10);
  } catch (error) {
    console.error("Perplexity check error:", error);
  }

  return result;
}

/**
 * Google検索のAI Overview（SGE）チェック
 */
export async function checkGoogleAiOverview(
  query: string,
  targetStoreName: string,
  page: Page
): Promise<AeoCheckResult> {
  const result: AeoCheckResult = {
    platform: "gemini",
    query,
    mentioned: false,
    mentionType: "not_found",
    competitors: [],
    timestamp: new Date().toISOString(),
  };

  try {
    // Google検索
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
    await page.goto(searchUrl, { waitUntil: "networkidle" });

    // AI Overview セクションを探す
    const aiOverviewSelectors = [
      '[data-attrid*="ai"]',
      '[class*="ai-overview"]',
      'div[data-hveid] > div > div:first-child', // 上部のサマリー
    ];

    let aiOverviewText = "";

    for (const selector of aiOverviewSelectors) {
      const elements = await page.$$(selector);
      for (const el of elements) {
        const text = await el.textContent();
        if (text && text.length > 50) {
          aiOverviewText += text + "\n";
        }
      }
    }

    // 店名チェック
    const storeNameLower = targetStoreName.toLowerCase();
    const textLower = aiOverviewText.toLowerCase();

    if (textLower.includes(storeNameLower)) {
      result.mentioned = true;
      result.mentionType = "direct";

      const idx = textLower.indexOf(storeNameLower);
      const start = Math.max(0, idx - 100);
      const end = Math.min(aiOverviewText.length, idx + targetStoreName.length + 100);
      result.context = aiOverviewText.slice(start, end);
    }
  } catch (error) {
    console.error("Google AI Overview check error:", error);
  }

  return result;
}

/**
 * 複数クエリでAEOスコアを算出
 */
export async function calculateAeoScore(
  storeName: string,
  storeType: string,
  location: string
): Promise<AeoScoreResult> {
  // チェック用クエリを生成
  const queries = generateAeoQueries(storeName, storeType, location);

  const browser = await chromium.launch({
    headless: process.env.HEADLESS !== "false",
  });

  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    locale: "ja-JP",
  });

  const page = await context.newPage();
  const results: AeoCheckResult[] = [];

  try {
    // 各クエリでチェック
    for (const query of queries.slice(0, 5)) {
      // APIレート制限考慮
      const perplexityResult = await checkPerplexity(query, storeName, page);
      results.push(perplexityResult);

      await page.waitForTimeout(3000); // レート制限対策

      const googleResult = await checkGoogleAiOverview(query, storeName, page);
      results.push(googleResult);

      await page.waitForTimeout(2000);
    }
  } finally {
    await browser.close();
  }

  // スコア計算
  const perplexityResults = results.filter((r) => r.platform === "perplexity");
  const googleResults = results.filter((r) => r.platform === "gemini");

  const calcScore = (items: AeoCheckResult[]) => {
    if (items.length === 0) return 0;

    let score = 0;
    for (const item of items) {
      if (item.mentionType === "direct") score += 20;
      else if (item.mentionType === "indirect") score += 5;
    }
    return Math.min(100, score);
  };

  const perplexityScore = calcScore(perplexityResults);
  const googleScore = calcScore(googleResults);
  const overallScore = Math.round((perplexityScore + googleScore) / 2);

  // レコメンデーション生成
  const recommendations = generateAeoRecommendations(results, overallScore);

  return {
    storeName,
    overallScore,
    platformScores: {
      chatgpt: 0, // ChatGPT APIは別途実装
      perplexity: perplexityScore,
      gemini: googleScore,
    },
    queries: results,
    recommendations,
  };
}

/**
 * AEOチェック用のクエリを生成
 */
function generateAeoQueries(
  storeName: string,
  storeType: string,
  location: string
): string[] {
  const queries = [
    `${location} ${storeType} おすすめ`,
    `${location}で人気の${storeType}`,
    `${location} ${storeType} ランキング`,
    `${storeName} 口コミ`,
    `${storeName} 評判`,
    `${location} ${storeType} 美味しい`, // 飲食店向け
    `${location} ${storeType} 予約`,
  ];

  return queries;
}

/**
 * AEO改善レコメンデーションを生成
 */
function generateAeoRecommendations(
  results: AeoCheckResult[],
  score: number
): string[] {
  const recommendations: string[] = [];

  if (score < 20) {
    recommendations.push(
      "AIに認識されていません。Googleビジネスプロフィールの充実と、自社サイトのFAQ構造化を推奨します。"
    );
  }

  if (score < 50) {
    recommendations.push(
      "競合と比較して言及頻度が低いです。口コミ数の増加と、専門性を示すコンテンツ追加を検討してください。"
    );
  }

  const directMentions = results.filter((r) => r.mentionType === "direct").length;
  if (directMentions === 0) {
    recommendations.push(
      "店名での直接言及がありません。ブランド認知向上のためのPR活動を検討してください。"
    );
  }

  const competitors = [...new Set(results.flatMap((r) => r.competitors))];
  if (competitors.length > 0) {
    recommendations.push(
      `以下の競合がAIに言及されています: ${competitors.slice(0, 5).join("、")}`
    );
  }

  if (recommendations.length === 0) {
    recommendations.push("良好なAEOスコアです。現状の施策を継続してください。");
  }

  return recommendations;
}

// CLIテスト用
if (require.main === module) {
  (async () => {
    const storeName = process.argv[2] || "丸亀製麺";
    const storeType = process.argv[3] || "うどん";
    const location = process.argv[4] || "渋谷";

    console.log(`AEOチェック: ${storeName} (${location}の${storeType})`);

    const result = await calculateAeoScore(storeName, storeType, location);
    console.log(JSON.stringify(result, null, 2));
  })();
}
