"use client";

import { useState } from "react";
import Link from "next/link";

interface Issue {
  type: "typo" | "broken_link" | "seo" | "accessibility";
  severity: "high" | "medium" | "low";
  location: string;
  original?: string;
  suggestion?: string;
  description: string;
}

interface CheckResult {
  url: string;
  checkedAt: string;
  summary: {
    totalIssues: number;
    typos: number;
    brokenLinks: number;
    seoIssues: number;
    accessibilityIssues: number;
  };
  issues: Issue[];
  score: number;
}

export default function SiteCheck() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CheckResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCheck = async () => {
    if (!url) {
      setError("URLを入力してください");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/site-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "エラーが発生しました");
      }

      const data: CheckResult = await res.json();
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-400";
    if (score >= 50) return "text-yellow-400";
    return "text-red-400";
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      case "medium":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "low":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "typo":
        return "✏️";
      case "broken_link":
        return "🔗";
      case "seo":
        return "🔍";
      case "accessibility":
        return "♿";
      default:
        return "⚠️";
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "typo":
        return "誤字脱字";
      case "broken_link":
        return "リンク切れ";
      case "seo":
        return "SEO";
      case "accessibility":
        return "アクセシビリティ";
      default:
        return type;
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="border-b border-gray-800">
        <div className="mx-auto max-w-4xl px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold">
            ちょい<span className="text-teal-400">AI</span>
          </Link>
          <span className="text-sm text-gray-400">サイト校正</span>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-12">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 text-5xl mb-4">
            <span>✍️</span>
          </div>
          <h1 className="text-3xl font-bold mb-2">サイト校正</h1>
          <p className="text-gray-400">
            誤字脱字・リンク切れ・SEO問題を自動検出
          </p>
        </div>

        {/* Input Form */}
        <div className="bg-gray-900 rounded-2xl p-8 mb-8">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              チェック対象のURL
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              className="w-full rounded-lg bg-gray-800 border border-gray-700 px-4 py-3 text-white placeholder-gray-500 focus:border-teal-500 focus:outline-none"
            />
          </div>

          <button
            onClick={handleCheck}
            disabled={loading}
            className="mt-6 w-full rounded-lg bg-gradient-to-r from-teal-500 to-cyan-600 px-6 py-4 font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
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
                チェック中...
              </span>
            ) : (
              "サイトをチェックする"
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
            {/* Score Card */}
            <div className="bg-gray-900 rounded-2xl p-8">
              <div className="flex flex-col md:flex-row items-center gap-8">
                {/* Score */}
                <div className="text-center">
                  <div
                    className={`text-7xl font-black ${getScoreColor(
                      result.score
                    )}`}
                  >
                    {result.score}
                  </div>
                  <div className="text-gray-500">スコア / 100</div>
                </div>

                {/* Summary */}
                <div className="flex-1 grid grid-cols-2 gap-4">
                  <div className="bg-gray-800 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold">{result.summary.typos}</div>
                    <div className="text-sm text-gray-500">誤字脱字</div>
                  </div>
                  <div className="bg-gray-800 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold">
                      {result.summary.brokenLinks}
                    </div>
                    <div className="text-sm text-gray-500">リンク切れ</div>
                  </div>
                  <div className="bg-gray-800 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold">
                      {result.summary.seoIssues}
                    </div>
                    <div className="text-sm text-gray-500">SEO問題</div>
                  </div>
                  <div className="bg-gray-800 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold">
                      {result.summary.accessibilityIssues}
                    </div>
                    <div className="text-sm text-gray-500">アクセシビリティ</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Issues List */}
            {result.issues.length > 0 ? (
              <div className="bg-gray-900 rounded-2xl p-8">
                <h3 className="text-lg font-bold mb-6">
                  検出された問題（{result.issues.length}件）
                </h3>
                <div className="space-y-4">
                  {result.issues.map((issue, i) => (
                    <div
                      key={i}
                      className={`border rounded-lg p-4 ${getSeverityColor(
                        issue.severity
                      )}`}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-xl">{getTypeIcon(issue.type)}</span>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">
                              {getTypeLabel(issue.type)}
                            </span>
                            <span
                              className={`text-xs px-2 py-0.5 rounded ${
                                issue.severity === "high"
                                  ? "bg-red-500"
                                  : issue.severity === "medium"
                                  ? "bg-yellow-500"
                                  : "bg-blue-500"
                              } text-white`}
                            >
                              {issue.severity === "high"
                                ? "重要"
                                : issue.severity === "medium"
                                ? "中"
                                : "軽微"}
                            </span>
                          </div>
                          <p className="text-sm opacity-90">{issue.description}</p>
                          {issue.location && (
                            <p className="text-xs mt-2 opacity-70">
                              場所: {issue.location.slice(0, 100)}
                              {issue.location.length > 100 ? "..." : ""}
                            </p>
                          )}
                          {issue.original && issue.suggestion && (
                            <div className="mt-2 flex items-center gap-2 text-sm">
                              <span className="line-through opacity-50">
                                {issue.original}
                              </span>
                              <span>→</span>
                              <span className="font-medium">
                                {issue.suggestion}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-gray-900 rounded-2xl p-8 text-center">
                <div className="text-5xl mb-4">🎉</div>
                <h3 className="text-xl font-bold text-green-400">
                  問題は見つかりませんでした
                </h3>
                <p className="text-gray-400 mt-2">
                  サイトは良好な状態です
                </p>
              </div>
            )}

            {/* CTA */}
            <div className="bg-gradient-to-r from-teal-500/10 to-cyan-500/10 border border-teal-500/30 rounded-2xl p-8 text-center">
              <h3 className="text-xl font-bold mb-2">定期チェックしませんか？</h3>
              <p className="text-gray-400 mb-4">
                週次/月次で自動チェックし、問題があればSlack/メールで通知します
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
            <h3 className="text-lg font-bold mb-6 text-center">チェック項目</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="flex items-start gap-4">
                <span className="text-2xl">✏️</span>
                <div>
                  <h4 className="font-medium">誤字脱字</h4>
                  <p className="text-sm text-gray-500">
                    漢字の誤り、送り仮名、表記ゆれを検出
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <span className="text-2xl">🔗</span>
                <div>
                  <h4 className="font-medium">リンク切れ</h4>
                  <p className="text-sm text-gray-500">
                    404エラー、接続できないリンクを検出
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <span className="text-2xl">🔍</span>
                <div>
                  <h4 className="font-medium">SEO</h4>
                  <p className="text-sm text-gray-500">
                    title、meta description、見出し構造をチェック
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <span className="text-2xl">♿</span>
                <div>
                  <h4 className="font-medium">アクセシビリティ</h4>
                  <p className="text-sm text-gray-500">
                    altテキスト、フォームラベルなどをチェック
                  </p>
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
