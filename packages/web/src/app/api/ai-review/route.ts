import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";
export const maxDuration = 60;

interface ReviewRequest {
  url: string;
  description?: string;
  pageContent?: string;
}

interface PersonaReview {
  persona: string;
  age: string;
  sentiment: "positive" | "neutral" | "negative";
  score: number;
  comment: string;
}

interface ReviewResponse {
  url: string;
  totalReviews: number;
  summary: {
    positive: number;
    neutral: number;
    negative: number;
    averageScore: number;
  };
  reviews: PersonaReview[];
  keyInsights: string[];
  improvements: string[];
}

const PERSONA_GROUPS = [
  { name: "20代男性会社員", age: "20代", count: 10 },
  { name: "20代女性会社員", age: "20代", count: 10 },
  { name: "30代男性（子持ち）", age: "30代", count: 10 },
  { name: "30代女性（子持ち）", age: "30代", count: 10 },
  { name: "40代男性管理職", age: "40代", count: 10 },
  { name: "40代女性（主婦）", age: "40代", count: 10 },
  { name: "50代男性経営者", age: "50代", count: 10 },
  { name: "50代女性（パート）", age: "50代", count: 10 },
  { name: "60代男性（退職）", age: "60代", count: 10 },
  { name: "60代女性（趣味多め）", age: "60代", count: 10 },
];

async function fetchPageContent(url: string): Promise<string> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; ChoiAI/1.0)",
      },
    });
    if (!response.ok) {
      return "";
    }
    const html = await response.text();
    // Remove scripts, styles, and extract text
    const textOnly = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 5000); // Limit to 5000 chars
    return textOnly;
  } catch {
    return "";
  }
}

async function generateReviews(
  url: string,
  pageContent: string,
  description: string,
  apiKey: string
): Promise<{ reviews: PersonaReview[]; insights: string[]; improvements: string[] }> {
  const prompt = `あなたは100人のモニターをシミュレートするAIです。
以下のウェブページ/広告について、10種類のペルソナ（各10人、計100人）としてレビューしてください。

【URL】${url}
【ページ内容の要約】${pageContent.slice(0, 2000)}
${description ? `【追加情報】${description}` : ""}

【ペルソナ一覧】
${PERSONA_GROUPS.map((p) => `- ${p.name}`).join("\n")}

以下のJSON形式で回答してください：
{
  "reviews": [
    {"persona": "ペルソナ名", "age": "年代", "sentiment": "positive/neutral/negative", "score": 1-10, "comment": "一言コメント（20文字以内）"},
    ...（全10件、各ペルソナ1件）
  ],
  "insights": ["良い点1", "良い点2", "良い点3"],
  "improvements": ["改善点1", "改善点2", "改善点3"]
}

重要：
- sentimentはscore 7以上でpositive、4-6でneutral、3以下でnegative
- 各ペルソナの視点で具体的にコメント
- コメントは短く、その人らしい言葉遣いで
- JSONのみ出力、説明文は不要`;

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
          content: "あなたはマーケティングリサーチの専門家です。JSON形式のみで回答してください。",
        },
        { role: "user", content: prompt },
      ],
      max_tokens: 2000,
      temperature: 0.8,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content || "";

  // Parse JSON from response
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Invalid response format");
  }

  const parsed = JSON.parse(jsonMatch[0]);

  // Expand 10 reviews to simulate 100
  const expandedReviews: PersonaReview[] = [];
  for (const review of parsed.reviews) {
    // Each review represents 10 people
    for (let i = 0; i < 10; i++) {
      expandedReviews.push({
        ...review,
        score: review.score + (Math.random() - 0.5) * 2, // Add some variance
      });
    }
  }

  return {
    reviews: expandedReviews.map((r) => ({
      ...r,
      score: Math.max(1, Math.min(10, Math.round(r.score))),
      sentiment:
        r.score >= 7 ? "positive" : r.score >= 4 ? "neutral" : "negative",
    })),
    insights: parsed.insights || [],
    improvements: parsed.improvements || [],
  };
}

export async function POST(req: NextRequest) {
  try {
    const body: ReviewRequest = await req.json();
    const { url, description = "", pageContent: providedContent } = body;

    if (!url) {
      return NextResponse.json({ error: "URLを入力してください" }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "API設定エラー" }, { status: 500 });
    }

    // Fetch page content if not provided
    const pageContent = providedContent || (await fetchPageContent(url));

    // Generate reviews
    const { reviews, insights, improvements } = await generateReviews(
      url,
      pageContent,
      description,
      apiKey
    );

    // Calculate summary
    const positive = reviews.filter((r) => r.sentiment === "positive").length;
    const neutral = reviews.filter((r) => r.sentiment === "neutral").length;
    const negative = reviews.filter((r) => r.sentiment === "negative").length;
    const averageScore =
      reviews.reduce((sum, r) => sum + r.score, 0) / reviews.length;

    // Get unique reviews for display (one per persona)
    const uniqueReviews = PERSONA_GROUPS.map((pg) => {
      const matching = reviews.find((r) => r.persona === pg.name);
      return matching || reviews[0];
    });

    const response: ReviewResponse = {
      url,
      totalReviews: 100,
      summary: {
        positive,
        neutral,
        negative,
        averageScore: Math.round(averageScore * 10) / 10,
      },
      reviews: uniqueReviews,
      keyInsights: insights,
      improvements,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("AI Review error:", error);
    return NextResponse.json(
      { error: "レビュー生成中にエラーが発生しました" },
      { status: 500 }
    );
  }
}
