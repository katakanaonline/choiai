import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

interface CompetitorRequest {
  companyName: string;
  competitors: string[];
  industry: string;
}

interface Activity {
  date: string;
  type: "sns" | "news" | "pr" | "product";
  source: string;
  title: string;
  summary: string;
  impact: "high" | "medium" | "low";
}

interface CompetitorData {
  name: string;
  activities: Activity[];
  sentiment: { positive: number; neutral: number; negative: number };
  mentions: number;
}

interface CompetitorResponse {
  companyName: string;
  industry: string;
  analyzedAt: string;
  competitors: CompetitorData[];
  insights: string[];
  recommendations: string[];
}

async function analyzeCompetitors(
  companyName: string,
  competitors: string[],
  industry: string,
  apiKey: string
): Promise<CompetitorResponse> {
  const prompt = `あなたは競合分析AIです。以下の情報をもとに、競合他社の動向分析をシミュレートしてください。

【自社】${companyName}
【業界】${industry}
【競合他社】${competitors.join("、")}

以下のJSON形式で回答してください：
{
  "competitors": [
    {
      "name": "競合名",
      "activities": [
        {"date": "2024/01/15", "type": "sns/news/pr/product", "source": "情報源", "title": "タイトル", "summary": "概要（50文字）", "impact": "high/medium/low"},
        {"date": "2024/01/10", "type": "sns", "source": "X", "title": "タイトル", "summary": "概要", "impact": "medium"}
      ],
      "sentiment": {"positive": 60, "neutral": 30, "negative": 10},
      "mentions": 234
    }
  ],
  "insights": [
    "業界全体のインサイト1",
    "業界全体のインサイト2"
  ],
  "recommendations": [
    "自社への提案1",
    "自社への提案2"
  ]
}

重要：
- 各競合につき3〜4件のアクティビティを生成
- 業界に合ったリアルな内容にする
- insightsは3件、recommendationsは3件
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
          content: "あなたは競合分析の専門家です。JSON形式のみで回答してください。",
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

  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Invalid response format");
  }

  const parsed = JSON.parse(jsonMatch[0]);

  return {
    companyName,
    industry,
    analyzedAt: new Date().toISOString(),
    ...parsed,
  };
}

export async function POST(req: NextRequest) {
  try {
    const body: CompetitorRequest = await req.json();
    const { companyName, competitors, industry } = body;

    if (!companyName || !competitors?.length || !industry) {
      return NextResponse.json(
        { error: "必要な情報を入力してください" },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "API設定エラー" }, { status: 500 });
    }

    const result = await analyzeCompetitors(companyName, competitors, industry, apiKey);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Competitor analysis error:", error);
    return NextResponse.json(
      { error: "分析中にエラーが発生しました" },
      { status: 500 }
    );
  }
}
