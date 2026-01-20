import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

interface PostRequest {
  content: string;
  imageUrl?: string;
  platforms: string[];
}

interface PostResponse {
  success: boolean;
  postId: string;
  distributedTo: string[];
  message: string;
}

interface ReportResponse {
  date: string;
  discoveryCount: number;
  totalViews: number;
  topPost?: {
    content: string;
    views: number;
  };
  sentiment: number;
  tips: string[];
}

export async function POST(req: NextRequest) {
  try {
    const body: PostRequest = await req.json();
    const { content, platforms } = body;

    if (!content?.trim()) {
      return NextResponse.json(
        { error: "投稿内容を入力してください" },
        { status: 400 }
      );
    }

    if (!platforms || platforms.length === 0) {
      return NextResponse.json(
        { error: "配信先を1つ以上選択してください" },
        { status: 400 }
      );
    }

    // TODO: 実際の投稿処理を実装
    // - GBP投稿 (Google Business Profile API)
    // - X投稿 (Twitter API)
    // - Instagram投稿 (Graph API)

    // For now, simulate successful posting
    const postId = `post_${Date.now()}`;
    const distributedTo: string[] = [];

    for (const platform of platforms) {
      // Simulate posting to each platform
      distributedTo.push(platform);
    }

    const response: PostResponse = {
      success: true,
      postId,
      distributedTo,
      message: `${distributedTo.length}つのプラットフォームに配信しました`,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Shukyaku-bot post error:", error);
    return NextResponse.json(
      { error: "投稿中にエラーが発生しました" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    // TODO: 実際のデータを取得
    // - Supabaseから投稿履歴を取得
    // - 各プラットフォームのインサイトを集計
    // - AIで分析・フィードバック生成

    // For now, return sample data
    const report: ReportResponse = {
      date: new Date().toISOString().split("T")[0],
      discoveryCount: Math.floor(Math.random() * 30) + 5,
      totalViews: Math.floor(Math.random() * 300) + 50,
      topPost: {
        content: "週末限定デザート始まりました",
        views: Math.floor(Math.random() * 100) + 30,
      },
      sentiment: Math.floor(Math.random() * 20) + 75,
      tips: [
        "写真付き投稿は反応が2倍になる傾向があります",
        "14時〜16時の投稿がよく見られています",
        "口コミへの返信率が上がると検索順位も上がります",
      ],
    };

    return NextResponse.json(report);
  } catch (error) {
    console.error("Shukyaku-bot report error:", error);
    return NextResponse.json(
      { error: "レポート取得中にエラーが発生しました" },
      { status: 500 }
    );
  }
}
