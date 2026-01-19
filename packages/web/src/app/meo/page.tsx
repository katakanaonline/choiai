"use client";

import { useState } from "react";
import Link from "next/link";
import { ShareButton } from "@/components/ShareButton";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import { trackToolUsage } from "@/lib/gtag";

interface Review {
  author: string;
  rating: number;
  date: string;
  text: string;
  sentiment: "positive" | "neutral" | "negative";
}

interface MeoResult {
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

export default function MeoPage() {
  const [businessName, setBusinessName] = useState("");
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [result, setResult] = useState<MeoResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadingSteps = ["店舗情報を検索中", "口コミを分析中", "レポート生成中"];

  const handleAnalyze = async () => {
    if (!businessName || !location) {
      setError("ビジネス名と所在地を入力してください");
      return;
    }

    setLoading(true);
    setLoadingStep(0);
    setError(null);
    setResult(null);
    trackToolUsage("meo", "start");

    const stepInterval = setInterval(() => {
      setLoadingStep((s) => Math.min(s + 1, loadingSteps.length - 1));
    }, 3000);

    try {
      const res = await fetch("/api/meo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessName, location }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "エラーが発生しました");
      }

      const data: MeoResult = await res.json();
      setResult(data);
      trackToolUsage("meo", "complete");
    } catch (e) {
      setError(e instanceof Error ? e.message : "エラーが発生しました");
      trackToolUsage("meo", "error");
    } finally {
      clearInterval(stepInterval);
      setLoading(false);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <span
            key={n}
            className={`text-lg ${n <= rating ? "text-amber-400" : "text-gray-600"}`}
          >
            ★
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <LoadingOverlay isLoading={loading} steps={loadingSteps} currentStep={loadingStep} />

      {/* Header */}
      <header className="border-b border-gray-800">
        <div className="mx-auto max-w-4xl px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold">
            ちょい<span className="text-amber-400">AI</span>
          </Link>
          <span className="text-sm text-gray-400">MEO・口コミ</span>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-12">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="text-5xl mb-4">⭐</div>
          <h1 className="text-3xl font-bold mb-2">MEO・口コミ分析</h1>
          <p className="text-gray-400">
            Googleマップの口コミを分析し、改善点を提案
          </p>
        </div>

        {/* Input Form */}
        <div className="bg-gray-900 rounded-2xl p-8 mb-8">
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                ビジネス名
              </label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="例: 〇〇カフェ"
                className="w-full rounded-lg bg-gray-800 border border-gray-700 px-4 py-3 text-white placeholder-gray-500 focus:border-amber-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                所在地
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="例: 渋谷区"
                className="w-full rounded-lg bg-gray-800 border border-gray-700 px-4 py-3 text-white placeholder-gray-500 focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>

          <button
            onClick={handleAnalyze}
            disabled={loading}
            className="mt-6 w-full rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 px-6 py-4 font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                分析中...
              </span>
            ) : (
              "口コミを分析する"
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
            {/* Overview */}
            <div className="bg-gray-900 rounded-2xl p-8">
              <div className="flex flex-col md:flex-row items-center gap-8">
                {/* Rating */}
                <div className="text-center">
                  <div className="text-6xl font-black text-amber-400">
                    {result.overallRating}
                  </div>
                  <div className="flex justify-center mt-2">
                    {renderStars(Math.round(result.overallRating))}
                  </div>
                  <div className="text-gray-500 mt-1">
                    {result.totalReviews}件のレビュー
                  </div>
                </div>

                {/* Distribution */}
                <div className="flex-1 w-full space-y-2">
                  {[5, 4, 3, 2, 1].map((rating) => {
                    const count = result.ratingDistribution[rating] || 0;
                    const percentage = (count / result.totalReviews) * 100;
                    return (
                      <div key={rating} className="flex items-center gap-3">
                        <span className="w-8 text-sm text-gray-400">{rating}★</span>
                        <div className="flex-1 h-4 rounded-full bg-gray-800 overflow-hidden">
                          <div
                            className="h-full bg-amber-500 transition-all duration-1000"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="w-12 text-sm text-gray-500 text-right">
                          {count}件
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Sentiment */}
            <div className="bg-gray-900 rounded-2xl p-8">
              <h3 className="text-lg font-bold mb-6">感情分析</h3>
              <div className="flex gap-4">
                <div className="flex-1 bg-green-500/10 border border-green-500/30 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-green-400">
                    {result.sentimentSummary.positive}%
                  </div>
                  <div className="text-sm text-gray-400">ポジティブ</div>
                </div>
                <div className="flex-1 bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-yellow-400">
                    {result.sentimentSummary.neutral}%
                  </div>
                  <div className="text-sm text-gray-400">中立</div>
                </div>
                <div className="flex-1 bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-red-400">
                    {result.sentimentSummary.negative}%
                  </div>
                  <div className="text-sm text-gray-400">ネガティブ</div>
                </div>
              </div>
            </div>

            {/* Keywords */}
            <div className="bg-gray-900 rounded-2xl p-8">
              <h3 className="text-lg font-bold mb-4">よく使われるキーワード</h3>
              <div className="flex flex-wrap gap-2">
                {result.keywords.map((kw, i) => (
                  <span
                    key={i}
                    className={`px-4 py-2 rounded-full text-sm ${
                      kw.sentiment === "positive"
                        ? "bg-green-500/20 text-green-400"
                        : kw.sentiment === "negative"
                        ? "bg-red-500/20 text-red-400"
                        : "bg-gray-700 text-gray-300"
                    }`}
                  >
                    {kw.word}
                    <span className="ml-2 opacity-60">({kw.count})</span>
                  </span>
                ))}
              </div>
            </div>

            {/* Recent Reviews */}
            <div className="bg-gray-900 rounded-2xl p-8">
              <h3 className="text-lg font-bold mb-6">最近の口コミ</h3>
              <div className="space-y-4">
                {result.recentReviews.map((review, i) => (
                  <div key={i} className="bg-gray-800 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{review.author}</span>
                        {renderStars(review.rating)}
                      </div>
                      <span className="text-sm text-gray-500">{review.date}</span>
                    </div>
                    <p className="text-gray-300">{review.text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Suggestions */}
            <div className="bg-gray-900 rounded-2xl p-8">
              <h3 className="text-lg font-bold mb-4">改善提案</h3>
              <ul className="space-y-3">
                {result.suggestions.map((suggestion, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="text-amber-400">💡</span>
                    <span className="text-gray-300">{suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* CTA */}
            <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-2xl p-8 text-center">
              <h3 className="text-xl font-bold mb-2">週次で口コミを監視しませんか？</h3>
              <p className="text-gray-400 mb-4">
                新着口コミをSlack通知、返信文の自動生成も可能です
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
            <h3 className="text-lg font-bold mb-6 text-center">分析内容</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="flex items-start gap-4">
                <span className="text-2xl">📊</span>
                <div>
                  <h4 className="font-medium">評価分布</h4>
                  <p className="text-sm text-gray-500">星1〜5の分布を可視化</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <span className="text-2xl">💭</span>
                <div>
                  <h4 className="font-medium">感情分析</h4>
                  <p className="text-sm text-gray-500">ポジティブ/ネガティブの割合</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <span className="text-2xl">🔑</span>
                <div>
                  <h4 className="font-medium">キーワード抽出</h4>
                  <p className="text-sm text-gray-500">頻出ワードを分析</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <span className="text-2xl">💡</span>
                <div>
                  <h4 className="font-medium">改善提案</h4>
                  <p className="text-sm text-gray-500">AIが具体的な改善点を提案</p>
                </div>
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
