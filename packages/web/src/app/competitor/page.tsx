"use client";

import { useState } from "react";
import Link from "next/link";
import { ShareButton } from "@/components/ShareButton";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import { trackToolUsage } from "@/lib/gtag";

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

interface CompetitorResult {
  companyName: string;
  industry: string;
  analyzedAt: string;
  competitors: CompetitorData[];
  insights: string[];
  recommendations: string[];
}

export default function CompetitorPage() {
  const [companyName, setCompanyName] = useState("");
  const [industry, setIndustry] = useState("");
  const [competitorInput, setCompetitorInput] = useState("");
  const [competitors, setCompetitors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CompetitorResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const addCompetitor = () => {
    if (competitorInput.trim() && competitors.length < 5) {
      setCompetitors([...competitors, competitorInput.trim()]);
      setCompetitorInput("");
    }
  };

  const removeCompetitor = (index: number) => {
    setCompetitors(competitors.filter((_, i) => i !== index));
  };

  const [loadingStep, setLoadingStep] = useState(0);
  const loadingSteps = ["競合情報を収集中", "SNS・ニュースを分析中", "レポート生成中"];

  const handleAnalyze = async () => {
    if (!companyName || !industry || competitors.length === 0) {
      setError("自社名、業界、競合を入力してください");
      return;
    }

    setLoading(true);
    setLoadingStep(0);
    setError(null);
    setResult(null);
    trackToolUsage("competitor", "start");

    const stepInterval = setInterval(() => {
      setLoadingStep((s) => Math.min(s + 1, loadingSteps.length - 1));
    }, 4000);

    try {
      const res = await fetch("/api/competitor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyName, competitors, industry }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "エラーが発生しました");
      }

      const data: CompetitorResult = await res.json();
      setResult(data);
      trackToolUsage("competitor", "complete");
    } catch (e) {
      setError(e instanceof Error ? e.message : "エラーが発生しました");
      trackToolUsage("competitor", "error");
    } finally {
      clearInterval(stepInterval);
      setLoading(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "sns": return "📱";
      case "news": return "📰";
      case "pr": return "📢";
      case "product": return "🎁";
      default: return "📌";
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case "high": return "bg-red-500/20 text-red-400 border-red-500/30";
      case "medium": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "low": return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      default: return "bg-gray-500/20 text-gray-400";
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <LoadingOverlay isLoading={loading} steps={loadingSteps} currentStep={loadingStep} />

      {/* Header */}
      <header className="border-b border-gray-800">
        <div className="mx-auto max-w-4xl px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold">
            ちょい<span className="text-rose-400">AI</span>
          </Link>
          <span className="text-sm text-gray-400">競合ウォッチ</span>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-12">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="text-5xl mb-4">👁️</div>
          <h1 className="text-3xl font-bold mb-2">競合ウォッチ</h1>
          <p className="text-gray-400">
            競合のSNS、ニュース、PRを自動追跡
          </p>
        </div>

        {/* Input Form */}
        <div className="bg-gray-900 rounded-2xl p-8 mb-8">
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                自社名
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="例: 株式会社〇〇"
                className="w-full rounded-lg bg-gray-800 border border-gray-700 px-4 py-3 text-white placeholder-gray-500 focus:border-rose-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                業界
              </label>
              <input
                type="text"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                placeholder="例: 飲食、SaaS、EC"
                className="w-full rounded-lg bg-gray-800 border border-gray-700 px-4 py-3 text-white placeholder-gray-500 focus:border-rose-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-400 mb-2">
              競合他社（最大5社）
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={competitorInput}
                onChange={(e) => setCompetitorInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && addCompetitor()}
                placeholder="競合名を入力してEnter"
                className="flex-1 rounded-lg bg-gray-800 border border-gray-700 px-4 py-3 text-white placeholder-gray-500 focus:border-rose-500 focus:outline-none"
              />
              <button
                onClick={addCompetitor}
                disabled={competitors.length >= 5}
                className="px-4 py-3 rounded-lg bg-gray-700 hover:bg-gray-600 transition disabled:opacity-50"
              >
                追加
              </button>
            </div>
            {competitors.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {competitors.map((c, i) => (
                  <span
                    key={i}
                    className="flex items-center gap-2 px-3 py-1 bg-rose-500/20 text-rose-400 rounded-full text-sm"
                  >
                    {c}
                    <button
                      onClick={() => removeCompetitor(i)}
                      className="hover:text-white"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={handleAnalyze}
            disabled={loading}
            className="mt-6 w-full rounded-lg bg-gradient-to-r from-rose-500 to-pink-600 px-6 py-4 font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
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
              "競合を分析する"
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
            {/* Insights */}
            <div className="bg-gray-900 rounded-2xl p-8">
              <h3 className="text-lg font-bold mb-4">業界インサイト</h3>
              <ul className="space-y-3">
                {result.insights.map((insight, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="text-rose-400">📊</span>
                    <span className="text-gray-300">{insight}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Competitor Cards */}
            {result.competitors.map((comp, i) => (
              <div key={i} className="bg-gray-900 rounded-2xl p-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold">{comp.name}</h3>
                  <span className="text-sm text-gray-500">
                    {comp.mentions}件の言及
                  </span>
                </div>

                {/* Sentiment */}
                <div className="flex gap-2 mb-6">
                  <div className="flex-1 h-2 rounded-full bg-gray-800 overflow-hidden flex">
                    <div
                      className="h-full bg-green-500"
                      style={{ width: `${comp.sentiment.positive}%` }}
                    />
                    <div
                      className="h-full bg-yellow-500"
                      style={{ width: `${comp.sentiment.neutral}%` }}
                    />
                    <div
                      className="h-full bg-red-500"
                      style={{ width: `${comp.sentiment.negative}%` }}
                    />
                  </div>
                </div>
                <div className="flex gap-4 text-xs text-gray-500 mb-6">
                  <span>🟢 ポジティブ {comp.sentiment.positive}%</span>
                  <span>🟡 中立 {comp.sentiment.neutral}%</span>
                  <span>🔴 ネガティブ {comp.sentiment.negative}%</span>
                </div>

                {/* Activities */}
                <div className="space-y-3">
                  {comp.activities.map((activity, j) => (
                    <div
                      key={j}
                      className={`border rounded-lg p-4 ${getImpactColor(activity.impact)}`}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-xl">{getTypeIcon(activity.type)}</span>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium">{activity.title}</span>
                            <span className="text-xs opacity-70">{activity.date}</span>
                          </div>
                          <p className="text-sm opacity-80">{activity.summary}</p>
                          <span className="text-xs opacity-60">{activity.source}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Recommendations */}
            <div className="bg-gray-900 rounded-2xl p-8">
              <h3 className="text-lg font-bold mb-4">自社への提案</h3>
              <ul className="space-y-3">
                {result.recommendations.map((rec, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="text-rose-400">💡</span>
                    <span className="text-gray-300">{rec}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* CTA */}
            <div className="bg-gradient-to-r from-rose-500/10 to-pink-500/10 border border-rose-500/30 rounded-2xl p-8 text-center">
              <h3 className="text-xl font-bold mb-2">週次で競合をモニタリングしませんか？</h3>
              <p className="text-gray-400 mb-4">
                重要な動きがあればSlack/メールで即座に通知します
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
            <h3 className="text-lg font-bold mb-6 text-center">監視対象</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="flex items-start gap-4">
                <span className="text-2xl">📱</span>
                <div>
                  <h4 className="font-medium">SNS投稿</h4>
                  <p className="text-sm text-gray-500">X、Instagram、Facebookの投稿</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <span className="text-2xl">📰</span>
                <div>
                  <h4 className="font-medium">ニュース記事</h4>
                  <p className="text-sm text-gray-500">メディア掲載、業界ニュース</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <span className="text-2xl">📢</span>
                <div>
                  <h4 className="font-medium">プレスリリース</h4>
                  <p className="text-sm text-gray-500">PR TIMES等での発表</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <span className="text-2xl">🎁</span>
                <div>
                  <h4 className="font-medium">新商品・サービス</h4>
                  <p className="text-sm text-gray-500">新規リリース、価格変更</p>
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
