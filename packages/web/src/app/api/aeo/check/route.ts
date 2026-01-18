import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

interface AeoCheckRequest {
  companyName: string;
  industry: string;
  location: string;
}

interface PlatformResult {
  platform: string;
  query: string;
  mentioned: boolean;
  context?: string;
  competitors: string[];
}

interface AeoCheckResponse {
  companyName: string;
  score: number;
  results: PlatformResult[];
  recommendations: string[];
}

// クエリ生成
function generateQueries(companyName: string, industry: string, location: string): string[] {
  const queries = [
    `${location}で${industry}を探しています。おすすめを教えてください。`,
    `${location}の${industry}ランキングを教えてください。`,
    `${companyName}について教えてください。`,
  ];
  return queries;
}

// OpenAI API呼び出し
async function askChatGPT(query: string, apiKey: string): Promise<string> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "あなたは日本のローカルビジネスに詳しいアシスタントです。具体的な店名や会社名を挙げて回答してください。",
        },
        { role: "user", content: query },
      ],
      max_tokens: 500,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || "";
}

// Anthropic API呼び出し
async function askClaude(query: string, apiKey: string): Promise<string> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-3-5-haiku-20241022",
      max_tokens: 500,
      messages: [
        {
          role: "user",
          content: `あなたは日本のローカルビジネスに詳しいアシスタントです。具体的な店名や会社名を挙げて回答してください。\n\n質問: ${query}`,
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Anthropic API error: ${response.status}`);
  }

  const data = await response.json();
  return data.content[0]?.text || "";
}

// 会社名の言及チェック
function checkMention(
  response: string,
  companyName: string
): { mentioned: boolean; context?: string; competitors: string[] } {
  const responseLower = response.toLowerCase();
  const companyLower = companyName.toLowerCase();

  // 完全一致または部分一致
  const mentioned = responseLower.includes(companyLower);

  let context: string | undefined;
  if (mentioned) {
    const idx = responseLower.indexOf(companyLower);
    const start = Math.max(0, idx - 50);
    const end = Math.min(response.length, idx + companyName.length + 100);
    context = response.slice(start, end);
  }

  // 競合抽出（「」で囲まれた名前）
  const competitors: string[] = [];
  const patterns = [/「([^」]+)」/g, /『([^』]+)』/g, /\d+\.\s*\*\*([^*]+)\*\*/g];

  for (const pattern of patterns) {
    const matches = response.matchAll(pattern);
    for (const match of matches) {
      if (match[1] && match[1].length < 30 && match[1] !== companyName) {
        competitors.push(match[1].trim());
      }
    }
  }

  return { mentioned, context, competitors: [...new Set(competitors)].slice(0, 5) };
}

// スコア計算
function calculateScore(results: PlatformResult[]): number {
  let score = 0;
  for (const result of results) {
    if (result.mentioned) {
      score += 33; // 各プラットフォーム33点
    }
  }
  return Math.min(100, score);
}

// レコメンデーション生成
function generateRecommendations(score: number, results: PlatformResult[]): string[] {
  const recs: string[] = [];

  if (score === 0) {
    recs.push("AIに認識されていません。Googleビジネスプロフィールの充実と、自社サイトのコンテンツ強化を推奨します。");
    recs.push("業界メディアへの掲載やプレスリリースでオンライン上の露出を増やしましょう。");
  } else if (score < 50) {
    recs.push("一部のAIには認識されていますが、露出が不十分です。口コミ数の増加を検討してください。");
  } else if (score < 100) {
    recs.push("良好なAEOスコアです。継続的な情報発信で認知度を維持しましょう。");
  } else {
    recs.push("すべてのAIに認識されています。現状の施策を継続してください。");
  }

  const allCompetitors = [...new Set(results.flatMap((r) => r.competitors))];
  if (allCompetitors.length > 0) {
    recs.push(`AIが言及している競合: ${allCompetitors.slice(0, 5).join("、")}`);
  }

  return recs;
}

export async function POST(req: NextRequest) {
  try {
    const body: AeoCheckRequest = await req.json();
    const { companyName, industry, location } = body;

    if (!companyName || !industry || !location) {
      return NextResponse.json({ error: "必須項目が不足しています" }, { status: 400 });
    }

    const openaiKey = process.env.OPENAI_API_KEY;
    const anthropicKey = process.env.ANTHROPIC_API_KEY;

    if (!openaiKey && !anthropicKey) {
      return NextResponse.json({ error: "API設定エラー" }, { status: 500 });
    }

    const queries = generateQueries(companyName, industry, location);
    const results: PlatformResult[] = [];

    // ChatGPTチェック
    if (openaiKey) {
      for (const query of queries.slice(0, 2)) {
        try {
          const response = await askChatGPT(query, openaiKey);
          const { mentioned, context, competitors } = checkMention(response, companyName);
          results.push({
            platform: "ChatGPT",
            query,
            mentioned,
            context,
            competitors,
          });
        } catch (e) {
          console.error("ChatGPT error:", e);
        }
      }
    }

    // Claudeチェック
    if (anthropicKey) {
      try {
        const response = await askClaude(queries[0], anthropicKey);
        const { mentioned, context, competitors } = checkMention(response, companyName);
        results.push({
          platform: "Claude",
          query: queries[0],
          mentioned,
          context,
          competitors,
        });
      } catch (e) {
        console.error("Claude error:", e);
      }
    }

    const score = calculateScore(results);
    const recommendations = generateRecommendations(score, results);

    const responseData: AeoCheckResponse = {
      companyName,
      score,
      results,
      recommendations,
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("AEO check error:", error);
    return NextResponse.json({ error: "チェック中にエラーが発生しました" }, { status: 500 });
  }
}
