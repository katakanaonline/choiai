import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

interface MeoRequest {
  businessName: string;
  location: string;
}

interface Review {
  author: string;
  rating: number;
  date: string;
  text: string;
  sentiment: "positive" | "neutral" | "negative";
}

interface MeoResponse {
  businessName: string;
  location: string;
  overallRating: number;
  totalReviews: number;
  ratingDistribution: { [key: number]: number };
  recentReviews: Review[];
  sentimentSummary: {
    positive: number;
    neutral: number;
    negative: number;
  };
  keywords: { word: string; count: number; sentiment: string }[];
  suggestions: string[];
}

async function analyzeBusiness(
  businessName: string,
  location: string,
  apiKey: string
): Promise<MeoResponse> {
  const prompt = `あなたはGoogleマップの口コミ分析AIです。
以下のビジネスについて、リアルな口コミ分析結果をシミュレートしてください。

【ビジネス名】${businessName}
【所在地】${location}

以下のJSON形式で回答してください：
{
  "overallRating": 4.2,
  "totalReviews": 127,
  "ratingDistribution": {"5": 45, "4": 38, "3": 25, "2": 12, "1": 7},
  "recentReviews": [
    {"author": "田中さん", "rating": 5, "date": "2日前", "text": "口コミ内容（30文字程度）", "sentiment": "positive"},
    {"author": "佐藤さん", "rating": 3, "date": "1週間前", "text": "口コミ内容", "sentiment": "neutral"},
    {"author": "鈴木さん", "rating": 2, "date": "2週間前", "text": "口コミ内容", "sentiment": "negative"}
  ],
  "sentimentSummary": {"positive": 65, "neutral": 25, "negative": 10},
  "keywords": [
    {"word": "キーワード1", "count": 23, "sentiment": "positive"},
    {"word": "キーワード2", "count": 15, "sentiment": "neutral"},
    {"word": "キーワード3", "count": 8, "sentiment": "negative"}
  ],
  "suggestions": [
    "改善提案1",
    "改善提案2",
    "改善提案3"
  ]
}

重要：
- 業種を推測してリアルな口コミを生成
- recentReviewsは5件生成
- keywordsは6件生成
- suggestionsは3件生成
- JSONのみ出力`;

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
          content: "あなたはGoogleマップの口コミ分析の専門家です。JSON形式のみで回答してください。",
        },
        { role: "user", content: prompt },
      ],
      max_tokens: 1500,
      temperature: 0.8,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content || "";

  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Invalid response format");
  }

  const parsed = JSON.parse(jsonMatch[0]);

  return {
    businessName,
    location,
    ...parsed,
  };
}

export async function POST(req: NextRequest) {
  try {
    const body: MeoRequest = await req.json();
    const { businessName, location } = body;

    if (!businessName || !location) {
      return NextResponse.json(
        { error: "ビジネス名と所在地を入力してください" },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "API設定エラー" }, { status: 500 });
    }

    const result = await analyzeBusiness(businessName, location, apiKey);
    return NextResponse.json(result);
  } catch (error) {
    console.error("MEO analysis error:", error);
    return NextResponse.json(
      { error: "分析中にエラーが発生しました" },
      { status: 500 }
    );
  }
}
