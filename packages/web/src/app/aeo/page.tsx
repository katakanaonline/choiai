"use client";

import { useState } from "react";
import Link from "next/link";
import { ShareButton } from "@/components/ShareButton";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import { trackToolUsage } from "@/lib/gtag";

interface PlatformResult {
  platform: string;
  query: string;
  mentioned: boolean;
  context?: string;
  competitors: string[];
}

interface AeoResult {
  companyName: string;
  score: number;
  results: PlatformResult[];
  recommendations: string[];
}

export default function AeoChecker() {
  const [companyName, setCompanyName] = useState("");
  const [industry, setIndustry] = useState("");
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [result, setResult] = useState<AeoResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadingSteps = [
    "ChatGPTに問い合わせ中",
    "Claudeに問い合わせ中",
    "結果を分析中",
  ];

  const handleCheck = async () => {
    if (!companyName || !industry || !location) {
      setError("すべての項目を入力してください");
      return;
    }

    setLoading(true);
    setLoadingStep(0);
    setError(null);
    setResult(null);
    trackToolUsage("aeo_checker", "start");

    // Simulate progress
    const stepInterval = setInterval(() => {
      setLoadingStep((s) => Math.min(s + 1, loadingSteps.length - 1));
    }, 3000);

    try {
      const res = await fetch("/api/aeo/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyName, industry, location }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "エラーが発生しました");
      }

      const data: AeoResult = await res.json();
      setResult(data);
      trackToolUsage("aeo_checker", "complete");
    } catch (e) {
      setError(e instanceof Error ? e.message : "エラーが発生しました");
      trackToolUsage("aeo_checker", "error");
    } finally {
      clearInterval(stepInterval);
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return "text-green-400";
    if (score >= 40) return "text-yellow-400";
    return "text-red-400";
  };

  const getScoreRing = (score: number) => {
    const circumference = 2 * Math.PI * 45;
    const offset = circumference - (score / 100) * circumference;
    return { circumference, offset };
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <LoadingOverlay
        isLoading={loading}
        steps={loadingSteps}
        currentStep={loadingStep}
      />

      {/* Header */}
      <header className="border-b border-gray-800">
        <div className="mx-auto max-w-4xl px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold">
            ちょい<span className="text-cyan-400">AI</span>
          </Link>
          <span className="text-sm text-gray-400">AEOチェッカー</span>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-12">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 text-5xl mb-4">
            <span>🤖</span>
          </div>
          <h1 className="text-3xl font-bold mb-2">AEOチェッカー</h1>
          <p className="text-gray-400">
            ChatGPT・Claudeで御社が言及されているか確認
          </p>
        </div>

        {/* Input Form */}
        <div className="bg-gray-900 rounded-2xl p-8 mb-8">
          <div className="grid gap-6 md:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                会社名・店名
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="例: 丸亀製麺"
                className="w-full rounded-lg bg-gray-800 border border-gray-700 px-4 py-3 text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                業種
              </label>
              <input
                type="text"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                placeholder="例: うどん屋"
                className="w-full rounded-lg bg-gray-800 border border-gray-700 px-4 py-3 text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                地域
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="例: 渋谷"
                className="w-full rounded-lg bg-gray-800 border border-gray-700 px-4 py-3 text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none"
              />
            </div>
          </div>

          <button
            onClick={handleCheck}
            disabled={loading}
            className="mt-6 w-full rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-4 font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
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
                AIに問い合わせ中...
              </span>
            ) : (
              "チェックする"
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
            {/* Share Bar */}
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-400">チェック結果</h2>
              <ShareButton
                title={`${result.companyName}のAEOスコア: ${result.score}点`}
                text={`${result.companyName}のAI検索スコアは${result.score}点でした！ #ちょいAI #AEOチェッカー`}
              />
            </div>

            {/* Score Card */}
            <div className="bg-gray-900 rounded-2xl p-8">
              <div className="flex flex-col md:flex-row items-center gap-8">
                {/* Score Ring */}
                <div className="relative w-40 h-40">
                  <svg className="w-40 h-40 transform -rotate-90">
                    <circle
                      cx="80"
                      cy="80"
                      r="45"
                      stroke="currentColor"
                      strokeWidth="10"
                      fill="none"
                      className="text-gray-800"
                    />
                    <circle
                      cx="80"
                      cy="80"
                      r="45"
                      stroke="currentColor"
                      strokeWidth="10"
                      fill="none"
                      strokeLinecap="round"
                      className={getScoreColor(result.score)}
                      strokeDasharray={getScoreRing(result.score).circumference}
                      strokeDashoffset={getScoreRing(result.score).offset}
                      style={{ transition: "stroke-dashoffset 1s ease-in-out" }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={`text-4xl font-black ${getScoreColor(result.score)}`}>
                      {result.score}
                    </span>
                    <span className="text-sm text-gray-500">/ 100</span>
                  </div>
                </div>

                {/* Score Description */}
                <div className="flex-1 text-center md:text-left">
                  <h2 className="text-2xl font-bold mb-2">{result.companyName}</h2>
                  <p className="text-gray-400 mb-4">
                    {result.score >= 70
                      ? "AIに良く認識されています"
                      : result.score >= 40
                      ? "一部のAIに認識されています"
                      : "AIにほとんど認識されていません"}
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                    {result.results.map((r, i) => (
                      <span
                        key={i}
                        className={`px-3 py-1 rounded-full text-sm ${
                          r.mentioned
                            ? "bg-green-500/20 text-green-400"
                            : "bg-red-500/20 text-red-400"
                        }`}
                      >
                        {r.platform}: {r.mentioned ? "言及あり" : "言及なし"}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Detail Results */}
            <div className="bg-gray-900 rounded-2xl p-8">
              <h3 className="text-lg font-bold mb-6">詳細結果</h3>
              <div className="space-y-6">
                {result.results.map((r, i) => (
                  <div key={i} className="border-b border-gray-800 pb-6 last:border-0 last:pb-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span
                          className={`w-3 h-3 rounded-full ${
                            r.mentioned ? "bg-green-400" : "bg-red-400"
                          }`}
                        />
                        <span className="font-medium">{r.platform}</span>
                      </div>
                      <span
                        className={`text-sm ${
                          r.mentioned ? "text-green-400" : "text-red-400"
                        }`}
                      >
                        {r.mentioned ? "言及あり" : "言及なし"}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mb-2">
                      質問: {r.query}
                    </p>
                    {r.context && (
                      <div className="bg-gray-800 rounded-lg p-3 text-sm text-gray-300">
                        ...{r.context}...
                      </div>
                    )}
                    {r.competitors.length > 0 && (
                      <div className="mt-3">
                        <span className="text-xs text-gray-500">言及された競合:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {r.competitors.map((c, ci) => (
                            <span
                              key={ci}
                              className="px-2 py-0.5 bg-gray-800 rounded text-xs text-gray-400"
                            >
                              {c}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Recommendations */}
            <div className="bg-gray-900 rounded-2xl p-8">
              <h3 className="text-lg font-bold mb-4">改善提案</h3>
              <ul className="space-y-3">
                {result.recommendations.map((rec, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="text-cyan-400">💡</span>
                    <span className="text-gray-300">{rec}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* CTA */}
            <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 rounded-2xl p-8 text-center">
              <h3 className="text-xl font-bold mb-2">週次で自動チェックしませんか？</h3>
              <p className="text-gray-400 mb-4">
                毎週自動でAI検索をチェックし、変化があればSlack/メールで通知します
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
                <div className="w-12 h-12 rounded-full bg-cyan-500/20 flex items-center justify-center mx-auto mb-3">
                  <span className="text-xl">1</span>
                </div>
                <p className="text-gray-400">会社名・業種・地域を入力</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-cyan-500/20 flex items-center justify-center mx-auto mb-3">
                  <span className="text-xl">2</span>
                </div>
                <p className="text-gray-400">AIが自動でChatGPT等に問い合わせ</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-cyan-500/20 flex items-center justify-center mx-auto mb-3">
                  <span className="text-xl">3</span>
                </div>
                <p className="text-gray-400">言及の有無と改善提案を表示</p>
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
