"use client";

import { useState } from "react";
import Link from "next/link";

interface PersonaReview {
  persona: string;
  age: string;
  sentiment: "positive" | "neutral" | "negative";
  score: number;
  comment: string;
}

interface ReviewResult {
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

export default function AIReview() {
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ReviewResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleReview = async () => {
    if (!url) {
      setError("URLを入力してください");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/ai-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, description }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "エラーが発生しました");
      }

      const data: ReviewResult = await res.json();
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case "positive":
        return "bg-green-500";
      case "neutral":
        return "bg-yellow-500";
      case "negative":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="border-b border-gray-800">
        <div className="mx-auto max-w-4xl px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold">
            ちょい<span className="text-indigo-400">AI</span>
          </Link>
          <span className="text-sm text-gray-400">100人AIレビュー</span>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-12">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 text-5xl mb-4">
            <span>👥</span>
          </div>
          <h1 className="text-3xl font-bold mb-2">100人AIレビュー</h1>
          <p className="text-gray-400">
            100人のAIペルソナがLP・商品ページを多角的に評価
          </p>
        </div>

        {/* Input Form */}
        <div className="bg-gray-900 rounded-2xl p-8 mb-8">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                レビュー対象のURL
              </label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com/lp"
                className="w-full rounded-lg bg-gray-800 border border-gray-700 px-4 py-3 text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                追加情報（任意）
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="商品の特徴、ターゲット層、見てほしいポイントなど"
                rows={3}
                className="w-full rounded-lg bg-gray-800 border border-gray-700 px-4 py-3 text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none resize-none"
              />
            </div>
          </div>

          <button
            onClick={handleReview}
            disabled={loading}
            className="mt-6 w-full rounded-lg bg-gradient-to-r from-indigo-500 to-violet-600 px-6 py-4 font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                100人がレビュー中...
              </span>
            ) : (
              "100人にレビューしてもらう"
            )}
          </button>

          {error && (
            <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400">
              {error}
            </div>
          )}
        </div>

        {/* Results */}
        {result && (
          <div className="space-y-8">
            {/* Summary Card */}
            <div className="bg-gray-900 rounded-2xl p-8">
              <h3 className="text-lg font-bold mb-6 text-center">
                100人の評価サマリー
              </h3>

              {/* Score & Breakdown */}
              <div className="flex flex-col md:flex-row items-center gap-8 mb-8">
                {/* Average Score */}
                <div className="text-center">
                  <div className="text-6xl font-black text-indigo-400">
                    {result.summary.averageScore}
                  </div>
                  <div className="text-gray-500">平均スコア / 10</div>
                </div>

                {/* Sentiment Breakdown */}
                <div className="flex-1 w-full">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex-1">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-green-400">好評価</span>
                        <span>{result.summary.positive}人</span>
                      </div>
                      <div className="h-4 rounded-full bg-gray-800 overflow-hidden">
                        <div
                          className="h-full bg-green-500 transition-all duration-1000"
                          style={{ width: `${result.summary.positive}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex-1">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-yellow-400">中立</span>
                        <span>{result.summary.neutral}人</span>
                      </div>
                      <div className="h-4 rounded-full bg-gray-800 overflow-hidden">
                        <div
                          className="h-full bg-yellow-500 transition-all duration-1000"
                          style={{ width: `${result.summary.neutral}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-red-400">否定的</span>
                        <span>{result.summary.negative}人</span>
                      </div>
                      <div className="h-4 rounded-full bg-gray-800 overflow-hidden">
                        <div
                          className="h-full bg-red-500 transition-all duration-1000"
                          style={{ width: `${result.summary.negative}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Visual Crowd */}
              <div className="flex flex-wrap justify-center gap-1 max-w-lg mx-auto">
                {Array.from({ length: 100 }).map((_, i) => {
                  const isPositive = i < result.summary.positive;
                  const isNeutral =
                    i >= result.summary.positive &&
                    i < result.summary.positive + result.summary.neutral;
                  return (
                    <div
                      key={i}
                      className={`h-4 w-4 rounded-full transition-all duration-300 ${
                        isPositive
                          ? "bg-green-400"
                          : isNeutral
                          ? "bg-yellow-400"
                          : "bg-red-400"
                      }`}
                      style={{ transitionDelay: `${i * 10}ms` }}
                    />
                  );
                })}
              </div>
            </div>

            {/* Key Insights */}
            <div className="bg-gray-900 rounded-2xl p-8">
              <h3 className="text-lg font-bold mb-4">良い点</h3>
              <ul className="space-y-3">
                {result.keyInsights.map((insight, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="text-green-400">+</span>
                    <span className="text-gray-300">{insight}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Improvements */}
            <div className="bg-gray-900 rounded-2xl p-8">
              <h3 className="text-lg font-bold mb-4">改善提案</h3>
              <ul className="space-y-3">
                {result.improvements.map((improvement, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="text-yellow-400">!</span>
                    <span className="text-gray-300">{improvement}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Individual Reviews */}
            <div className="bg-gray-900 rounded-2xl p-8">
              <h3 className="text-lg font-bold mb-6">ペルソナ別レビュー</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                {result.reviews.map((review, i) => (
                  <div
                    key={i}
                    className="bg-gray-800 rounded-lg p-4 flex items-start gap-3"
                  >
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${getSentimentColor(
                        review.sentiment
                      )}`}
                    >
                      {review.sentiment === "positive"
                        ? "😊"
                        : review.sentiment === "neutral"
                        ? "😐"
                        : "😕"}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">
                          {review.persona}
                        </span>
                        <span className="text-xs text-gray-500">
                          {review.score}/10
                        </span>
                      </div>
                      <p className="text-sm text-gray-400 mt-1">
                        {review.comment}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA */}
            <div className="bg-gradient-to-r from-indigo-500/10 to-violet-500/10 border border-indigo-500/30 rounded-2xl p-8 text-center">
              <h3 className="text-xl font-bold mb-2">
                毎月定点チェックしませんか？
              </h3>
              <p className="text-gray-400 mb-4">
                LP改修のたびにレビューを取得。改善効果を定量的に測定できます。
              </p>
              <button className="rounded-full bg-white px-8 py-3 font-semibold text-gray-900 transition hover:bg-gray-200">
                無料で始める（準備中）
              </button>
            </div>
          </div>
        )}

        {/* How it works */}
        {!result && (
          <div className="bg-gray-900/50 rounded-2xl p-8">
            <h3 className="text-lg font-bold mb-6 text-center">使い方</h3>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-indigo-500/20 flex items-center justify-center mx-auto mb-3">
                  <span className="text-xl">1</span>
                </div>
                <p className="text-gray-400">レビュー対象のURLを入力</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-indigo-500/20 flex items-center justify-center mx-auto mb-3">
                  <span className="text-xl">2</span>
                </div>
                <p className="text-gray-400">100人のAIペルソナがレビュー</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-indigo-500/20 flex items-center justify-center mx-auto mb-3">
                  <span className="text-xl">3</span>
                </div>
                <p className="text-gray-400">多角的な評価と改善提案を表示</p>
              </div>
            </div>

            <div className="mt-8 pt-8 border-t border-gray-800">
              <h4 className="text-sm font-medium text-gray-400 mb-4 text-center">
                レビューするAIペルソナ
              </h4>
              <div className="flex flex-wrap justify-center gap-2">
                {[
                  "20代男性会社員",
                  "20代女性会社員",
                  "30代男性（子持ち）",
                  "30代女性（子持ち）",
                  "40代男性管理職",
                  "40代女性（主婦）",
                  "50代男性経営者",
                  "50代女性（パート）",
                  "60代男性（退職）",
                  "60代女性（趣味多め）",
                ].map((persona) => (
                  <span
                    key={persona}
                    className="px-3 py-1 bg-gray-800 rounded-full text-xs text-gray-400"
                  >
                    {persona}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-8 text-center text-sm text-gray-500">
        <Link href="/" className="hover:text-gray-300">
          ← ちょいAI トップに戻る
        </Link>
      </footer>
    </div>
  );
}
