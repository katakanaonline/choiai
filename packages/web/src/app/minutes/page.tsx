"use client";

import { useState } from "react";
import Link from "next/link";
import { trackToolUsage } from "@/lib/gtag";

interface MinutesResult {
  summary: string;
  decisions: string[];
  actionItems: { task: string; assignee: string; deadline: string }[];
  nextMeeting: string;
  rawMinutes: string;
}

export default function MinutesPage() {
  const [transcript, setTranscript] = useState("");
  const [meetingType, setMeetingType] = useState("general");
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<MinutesResult | null>(null);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!transcript.trim()) return;

    setIsGenerating(true);
    trackToolUsage("minutes", "start");

    try {
      const res = await fetch("/api/minutes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript, meetingType }),
      });

      if (res.ok) {
        const data = await res.json();
        setResult(data);
        trackToolUsage("minutes", "complete");
      } else {
        const error = await res.json();
        alert(error.error || "生成に失敗しました");
        trackToolUsage("minutes", "error");
      }
    } catch (error) {
      console.error("Generation error:", error);
      alert("生成に失敗しました");
      trackToolUsage("minutes", "error");
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async (text: string, section: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedSection(section);
      setTimeout(() => setCopiedSection(null), 2000);
    } catch (error) {
      console.error("Copy error:", error);
    }
  };

  const copyFullMinutes = () => {
    if (!result) return;
    const fullText = `# 議事録

## 概要
${result.summary}

## 決定事項
${result.decisions.map((d, i) => `${i + 1}. ${d}`).join("\n")}

## アクションアイテム
${result.actionItems.map((a) => `- [ ] ${a.task} (@${a.assignee}) - ${a.deadline}`).join("\n")}

## 次回会議
${result.nextMeeting}

---
${result.rawMinutes}`;

    copyToClipboard(fullText, "full");
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="border-b border-gray-800">
        <div className="mx-auto max-w-4xl px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold">
            ちょい<span className="text-purple-400">AI</span>
          </Link>
          <span className="text-sm text-gray-400">議事録自動生成</span>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-8 space-y-8">
        {/* Hero Section */}
        <section className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 mb-4">
            <span className="text-4xl">📝</span>
          </div>
          <h1 className="text-3xl font-bold mb-2">議事録自動生成</h1>
          <p className="text-gray-400 max-w-lg mx-auto">
            会議の文字起こしを貼り付けるだけ。AIが要点整理・決定事項・TODO抽出まで一括で。
          </p>
        </section>

        {/* Input Section */}
        <section className="bg-gray-900 rounded-2xl p-6">
          <h2 className="font-bold mb-4 flex items-center gap-2">
            <span className="text-xl">🎙️</span>
            会議内容を入力
          </h2>

          {/* Meeting Type Selection */}
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="text-sm text-gray-400 mr-2">会議タイプ:</span>
            {[
              { value: "general", label: "一般" },
              { value: "standup", label: "朝会" },
              { value: "review", label: "振り返り" },
              { value: "planning", label: "企画" },
              { value: "1on1", label: "1on1" },
            ].map((type) => (
              <button
                key={type.value}
                onClick={() => setMeetingType(type.value)}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                  meetingType === type.value
                    ? "bg-blue-600 text-white"
                    : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>

          {/* Text Input */}
          <textarea
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder={`会議の文字起こしや、メモを貼り付けてください。

例:
田中: 今日は来月のキャンペーンについて話し合いましょう
佐藤: 予算は50万円で決まりました
田中: では鈴木さんが来週金曜までにバナー作成をお願いします
鈴木: 了解です
...`}
            rows={12}
            className="w-full rounded-lg bg-gray-800 border border-gray-700 px-4 py-3 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none resize-none mb-4 font-mono text-sm"
          />

          {/* Actions */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">{transcript.length}文字</span>
            <button
              onClick={handleGenerate}
              disabled={!transcript.trim() || isGenerating}
              className="px-6 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 font-bold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
            >
              {isGenerating ? "AIが整理中..." : "議事録を生成"}
            </button>
          </div>
        </section>

        {/* Result Section */}
        {result && (
          <section className="space-y-6">
            {/* Summary */}
            <div className="bg-gray-900 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold flex items-center gap-2">
                  <span className="text-xl">📋</span>
                  概要
                </h2>
                <button
                  onClick={() => copyToClipboard(result.summary, "summary")}
                  className="px-3 py-1 rounded-lg bg-gray-800 hover:bg-gray-700 text-sm"
                >
                  {copiedSection === "summary" ? "コピーしました!" : "コピー"}
                </button>
              </div>
              <p className="text-gray-300 whitespace-pre-wrap">{result.summary}</p>
            </div>

            {/* Decisions */}
            {result.decisions.length > 0 && (
              <div className="bg-gray-900 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-bold flex items-center gap-2">
                    <span className="text-xl">✅</span>
                    決定事項
                  </h2>
                  <button
                    onClick={() =>
                      copyToClipboard(result.decisions.join("\n"), "decisions")
                    }
                    className="px-3 py-1 rounded-lg bg-gray-800 hover:bg-gray-700 text-sm"
                  >
                    {copiedSection === "decisions" ? "コピーしました!" : "コピー"}
                  </button>
                </div>
                <ul className="space-y-2">
                  {result.decisions.map((decision, i) => (
                    <li key={i} className="flex items-start gap-2 text-gray-300">
                      <span className="text-emerald-400 mt-1">•</span>
                      {decision}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Action Items */}
            {result.actionItems.length > 0 && (
              <div className="bg-gradient-to-r from-blue-900/30 to-indigo-900/30 rounded-2xl p-6 border border-blue-500/20">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-bold flex items-center gap-2">
                    <span className="text-xl">📌</span>
                    アクションアイテム
                  </h2>
                  <button
                    onClick={() =>
                      copyToClipboard(
                        result.actionItems
                          .map((a) => `- [ ] ${a.task} (@${a.assignee}) - ${a.deadline}`)
                          .join("\n"),
                        "actions"
                      )
                    }
                    className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-sm"
                  >
                    {copiedSection === "actions" ? "コピーしました!" : "コピー"}
                  </button>
                </div>
                <div className="space-y-3">
                  {result.actionItems.map((item, i) => (
                    <div
                      key={i}
                      className="bg-gray-800/50 rounded-lg p-3 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <input type="checkbox" className="w-4 h-4 rounded" />
                        <span className="text-gray-300">{item.task}</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-blue-400">@{item.assignee}</span>
                        <span className="text-gray-500">{item.deadline}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Next Meeting */}
            {result.nextMeeting && (
              <div className="bg-gray-900 rounded-2xl p-6">
                <h2 className="font-bold flex items-center gap-2 mb-2">
                  <span className="text-xl">📅</span>
                  次回会議
                </h2>
                <p className="text-gray-300">{result.nextMeeting}</p>
              </div>
            )}

            {/* Full Minutes */}
            <div className="bg-gray-900 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold flex items-center gap-2">
                  <span className="text-xl">📄</span>
                  整形済み議事録
                </h2>
                <button
                  onClick={copyFullMinutes}
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 font-bold hover:opacity-90"
                >
                  {copiedSection === "full" ? "コピーしました!" : "全文コピー"}
                </button>
              </div>
              <pre className="text-sm text-gray-400 whitespace-pre-wrap font-mono bg-gray-800 rounded-lg p-4 max-h-96 overflow-y-auto">
                {result.rawMinutes}
              </pre>
            </div>
          </section>
        )}

        {/* Tips Section */}
        {!result && (
          <section className="bg-gray-900/50 rounded-2xl p-6 border border-gray-800">
            <h2 className="font-bold flex items-center gap-2 mb-4">
              <span className="text-xl">💡</span>
              使い方のヒント
            </h2>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>• Zoom、Google Meet、Teamsなどの文字起こしをそのまま貼り付けられます</li>
              <li>• 発言者名が含まれていると、担当者の自動割り当てが正確になります</li>
              <li>• 音声入力でリアルタイムに入力してもOKです</li>
              <li>• 会議タイプを選ぶと、それに合った形式で整理されます</li>
            </ul>
          </section>
        )}

        {/* CTA Section */}
        <section className="bg-gradient-to-r from-blue-900/30 to-indigo-900/30 rounded-2xl p-8 text-center border border-blue-500/20">
          <h2 className="text-xl font-bold mb-2">本番運用を始める</h2>
          <p className="text-gray-400 mb-6">
            月額¥3,000で、無制限の議事録生成・テンプレートカスタマイズ・チーム共有機能
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/"
              className="px-6 py-3 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
            >
              ← ツール一覧に戻る
            </Link>
            <a
              href="https://forms.google.com/contact"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 font-bold hover:opacity-90 transition-opacity"
            >
              無料相談する
            </a>
          </div>
        </section>

        {/* Footer */}
        <footer className="text-center py-8 text-sm text-gray-500">
          <div className="flex justify-center gap-6 mb-4">
            <Link href="/" className="hover:text-gray-400">ホーム</Link>
            <Link href="/privacy" className="hover:text-gray-400">プライバシーポリシー</Link>
          </div>
          <p>2026 ちょいAI</p>
        </footer>
      </main>
    </div>
  );
}
