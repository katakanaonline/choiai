import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface MinutesRequest {
  transcript: string;
  meetingType: string;
}

interface MinutesResponse {
  summary: string;
  decisions: string[];
  actionItems: { task: string; assignee: string; deadline: string }[];
  nextMeeting: string;
  rawMinutes: string;
}

const MEETING_TYPE_PROMPTS: Record<string, string> = {
  general: "一般的な会議の議事録として整理してください。",
  standup: "デイリースタンドアップの形式（昨日やったこと、今日やること、困っていること）で整理してください。",
  review: "振り返り会議（KPT: Keep, Problem, Try）の形式で整理してください。",
  planning: "企画・計画会議として、目標・スコープ・マイルストーンを明確にしてください。",
  "1on1": "1on1ミーティングとして、相談事項・フィードバック・次のアクションを整理してください。",
};

export async function POST(req: NextRequest) {
  try {
    const body: MinutesRequest = await req.json();
    const { transcript, meetingType = "general" } = body;

    if (!transcript?.trim()) {
      return NextResponse.json(
        { error: "会議内容を入力してください" },
        { status: 400 }
      );
    }

    if (transcript.length > 50000) {
      return NextResponse.json(
        { error: "テキストが長すぎます（最大50,000文字）" },
        { status: 400 }
      );
    }

    const systemPrompt = `あなたは優秀なビジネスアシスタントです。
会議の文字起こしや発言記録から、構造化された議事録を生成します。

出力形式（JSON）:
{
  "summary": "会議の概要（2-3文で簡潔に）",
  "decisions": ["決定事項1", "決定事項2", ...],
  "actionItems": [
    {"task": "タスク内容", "assignee": "担当者名", "deadline": "期限（なければ「未定」）"},
    ...
  ],
  "nextMeeting": "次回会議の日時・議題（言及がなければ「未定」）",
  "rawMinutes": "整形された議事録テキスト（Markdown形式）"
}

注意事項:
- 発言から決定事項とアクションアイテムを確実に抽出してください
- 担当者名は発言者名から推測してください（不明なら「未定」）
- 期限は明示がなければ「未定」としてください
- rawMinutesは読みやすく整形されたMarkdown形式の議事録です
- 必ず有効なJSONで出力してください`;

    const userPrompt = `以下の会議記録を議事録に整理してください。

${MEETING_TYPE_PROMPTS[meetingType] || MEETING_TYPE_PROMPTS.general}

---
${transcript}
---

JSONで出力してください:`;

    const response = await anthropic.messages.create({
      model: "claude-3-5-haiku-latest",
      max_tokens: 4000,
      messages: [
        {
          role: "user",
          content: userPrompt,
        },
      ],
      system: systemPrompt,
    });

    const textBlock = response.content.find((block) => block.type === "text");
    const responseText = textBlock?.text || "";

    // JSONを抽出（コードブロックで囲まれている場合も対応）
    let jsonStr = responseText;
    const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1];
    }

    let result: MinutesResponse;
    try {
      result = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error("JSON parse error:", parseError, "Response:", responseText);
      // フォールバック: テキストをそのまま返す
      result = {
        summary: "議事録の生成中にエラーが発生しました。",
        decisions: [],
        actionItems: [],
        nextMeeting: "未定",
        rawMinutes: responseText,
      };
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Minutes generation error:", error);
    return NextResponse.json(
      { error: "議事録の生成に失敗しました" },
      { status: 500 }
    );
  }
}
