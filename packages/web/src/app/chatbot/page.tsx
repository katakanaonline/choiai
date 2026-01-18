"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const SAMPLE_FAQ = `【店舗情報】
- 店名: サンプルカフェ
- 営業時間: 10:00〜20:00（L.O. 19:30）
- 定休日: 毎週水曜日
- 住所: 東京都渋谷区〇〇1-2-3
- 電話: 03-1234-5678
- 駐車場: 近隣コインパーキングをご利用ください

【メニュー】
- コーヒー: 450円〜
- 紅茶: 400円〜
- ケーキセット: 850円
- ランチ（11:00〜14:00）: 980円〜

【よくある質問】
Q: 予約はできますか？
A: お席のご予約は4名様以上で承っております。お電話でご連絡ください。

Q: Wi-Fiはありますか？
A: はい、無料Wi-Fiをご利用いただけます。パスワードはスタッフにお尋ねください。

Q: ペット同伴は可能ですか？
A: テラス席のみペット同伴可能です。

Q: クレジットカードは使えますか？
A: VISA、Mastercard、JCBがご利用いただけます。`;

export default function ChatbotPage() {
  const [context, setContext] = useState(SAMPLE_FAQ);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setLoading(true);
    setShowSettings(false);

    try {
      const res = await fetch("/api/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          context,
          history: messages,
        }),
      });

      if (!res.ok) {
        throw new Error("エラーが発生しました");
      }

      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.reply },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "申し訳ありません、エラーが発生しました。" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const resetChat = () => {
    setMessages([]);
    setShowSettings(true);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-800 flex-shrink-0">
        <div className="mx-auto max-w-4xl px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold">
            ちょい<span className="text-emerald-400">AI</span>
          </Link>
          <span className="text-sm text-gray-400">AIチャット</span>
        </div>
      </header>

      <main className="flex-1 flex flex-col mx-auto w-full max-w-4xl px-6 py-6 overflow-hidden">
        {/* Settings Panel */}
        {showSettings && (
          <div className="bg-gray-900 rounded-2xl p-6 mb-6 flex-shrink-0">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold">ビジネス情報・FAQ設定</h3>
              <button
                onClick={() => setContext(SAMPLE_FAQ)}
                className="text-sm text-emerald-400 hover:underline"
              >
                サンプルを読み込む
              </button>
            </div>
            <textarea
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="店舗情報、FAQ、商品情報などを入力してください"
              rows={8}
              className="w-full rounded-lg bg-gray-800 border border-gray-700 px-4 py-3 text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none resize-none text-sm"
            />
            <p className="mt-2 text-xs text-gray-500">
              ここに入力した情報をもとにAIが回答します
            </p>
          </div>
        )}

        {/* Chat Area */}
        <div className="flex-1 bg-gray-900 rounded-2xl flex flex-col overflow-hidden">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-5xl mb-4">💬</div>
                <h2 className="text-xl font-bold mb-2">AIチャットデモ</h2>
                <p className="text-gray-400 mb-6">
                  設定したFAQ情報をもとにAIが回答します
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {["営業時間は？", "予約できる？", "Wi-Fiある？"].map((q) => (
                    <button
                      key={q}
                      onClick={() => {
                        setInput(q);
                        setShowSettings(false);
                      }}
                      className="px-4 py-2 bg-gray-800 rounded-full text-sm hover:bg-gray-700 transition"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                      msg.role === "user"
                        ? "bg-emerald-600 rounded-br-none"
                        : "bg-gray-800 rounded-bl-none"
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))
            )}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-800 rounded-2xl rounded-bl-none px-4 py-3">
                  <span className="flex gap-1">
                    <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-gray-800 p-4">
            <div className="flex gap-3">
              <button
                onClick={resetChat}
                className="px-4 py-3 rounded-lg bg-gray-800 text-gray-400 hover:bg-gray-700 transition"
                title="リセット"
              >
                🔄
              </button>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="メッセージを入力..."
                className="flex-1 rounded-lg bg-gray-800 border border-gray-700 px-4 py-3 text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none"
              />
              <button
                onClick={handleSend}
                disabled={loading || !input.trim()}
                className="px-6 py-3 rounded-lg bg-emerald-600 font-semibold transition hover:bg-emerald-700 disabled:opacity-50"
              >
                送信
              </button>
            </div>
          </div>
        </div>

        {/* CTA */}
        {messages.length > 0 && (
          <div className="mt-6 bg-gradient-to-r from-emerald-500/10 to-green-500/10 border border-emerald-500/30 rounded-2xl p-6 text-center flex-shrink-0">
            <h3 className="font-bold mb-2">このチャットボットを御社サイトに導入しませんか？</h3>
            <p className="text-sm text-gray-400 mb-4">
              FAQ学習、デザインカスタマイズ、多言語対応も可能です
            </p>
            <button className="rounded-full bg-white px-6 py-2 font-semibold text-gray-900 transition hover:bg-gray-200 text-sm">
              導入相談（準備中）
            </button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-6 text-center text-sm text-gray-500 flex-shrink-0">
        <Link href="/" className="hover:text-gray-300">
          ← ちょいAI トップに戻る
        </Link>
      </footer>
    </div>
  );
}
