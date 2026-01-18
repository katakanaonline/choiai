import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

interface ChatRequest {
  message: string;
  context: string;
  history: { role: "user" | "assistant"; content: string }[];
}

interface ChatResponse {
  reply: string;
}

export async function POST(req: NextRequest) {
  try {
    const body: ChatRequest = await req.json();
    const { message, context, history } = body;

    if (!message) {
      return NextResponse.json(
        { error: "メッセージを入力してください" },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "API設定エラー" }, { status: 500 });
    }

    const systemPrompt = `あなたは以下の情報を持つカスタマーサポートAIです。
お客様からの質問に丁寧に回答してください。

【ビジネス情報・FAQ】
${context || "（情報が設定されていません）"}

重要なルール：
- 提供された情報の範囲内で回答
- わからないことは正直に「お問い合わせください」と案内
- 丁寧で親しみやすいトーンで
- 回答は簡潔に（100文字以内目安）`;

    const messages = [
      { role: "system" as const, content: systemPrompt },
      ...history.slice(-10).map((h) => ({
        role: h.role as "user" | "assistant",
        content: h.content,
      })),
      { role: "user" as const, content: message },
    ];

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages,
        max_tokens: 300,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const reply = data.choices[0]?.message?.content || "申し訳ありません、回答を生成できませんでした。";

    return NextResponse.json({ reply });
  } catch (error) {
    console.error("Chatbot error:", error);
    return NextResponse.json(
      { error: "エラーが発生しました" },
      { status: 500 }
    );
  }
}
