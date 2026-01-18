import { NextRequest, NextResponse } from "next/server";
import { generateReviewReply } from "@/lib/google-maps-server";

/**
 * 口コミへの返信案を AI で生成する API
 *
 * Claude API を使用（サーバーサイドのみ）
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { reviewText, rating, authorName, storeName } = body;

    if (!reviewText || !rating) {
      return NextResponse.json(
        { error: "reviewText and rating are required" },
        { status: 400 }
      );
    }

    // AI による返信生成を試みる
    const aiReply = await generateReviewReply(
      reviewText,
      rating,
      storeName || "当店"
    );

    if (aiReply) {
      return NextResponse.json({ suggestedReply: aiReply });
    }

    // AI が利用できない場合はテンプレートを使用
    const templates: Record<number, string> = {
      5: `${authorName || "お客"}様、嬉しいお言葉をいただきありがとうございます！スタッフ一同、大変励みになります。またのご来店を心よりお待ちしております。`,
      4: `${authorName || "お客"}様、ご来店ありがとうございます。ご満足いただけて嬉しいです。さらに良いサービスを提供できるよう努めてまいります。`,
      3: `${authorName || "お客"}様、貴重なご意見をいただきありがとうございます。ご指摘いただいた点は真摯に受け止め、改善に努めてまいります。またの機会がございましたら、ぜひお越しください。`,
      2: `${authorName || "お客"}様、ご期待に沿えず申し訳ございません。いただいたご意見をもとに、サービスの改善に取り組んでまいります。`,
      1: `${authorName || "お客"}様、ご不快な思いをさせてしまい、誠に申し訳ございません。詳しいお話をお聞かせいただけますと幸いです。`,
    };

    const suggestedReply = templates[rating] || templates[3];

    return NextResponse.json({ suggestedReply });
  } catch (error) {
    console.error("Generate reply error:", error);
    return NextResponse.json(
      { error: "Failed to generate reply" },
      { status: 500 }
    );
  }
}
