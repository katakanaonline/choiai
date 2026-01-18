"use client";

import { useState } from "react";

interface AeoData {
  storeName: string;
  overallScore: number;
  platformScores: {
    chatgpt: number;
    perplexity: number;
    gemini: number;
  };
  queries: Array<{
    platform: string;
    query: string;
    mentioned: boolean;
    mentionType: string;
    context?: string;
    competitors: string[];
  }>;
  recommendations: string[];
  checkedAt: string;
}

interface AeoScoreCardProps {
  data?: AeoData;
  onCheck?: (storeName: string, storeType: string, location: string) => void;
  loading?: boolean;
}

function getScoreColor(score: number): string {
  if (score >= 70) return "text-green-600";
  if (score >= 40) return "text-yellow-600";
  return "text-red-600";
}

function getScoreBgColor(score: number): string {
  if (score >= 70) return "bg-green-100";
  if (score >= 40) return "bg-yellow-100";
  return "bg-red-100";
}

function ScoreGauge({ score, label }: { score: number; label: string }) {
  return (
    <div className="text-center">
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div
        className={`text-2xl font-bold ${getScoreColor(score)}`}
      >
        {score}
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
        <div
          className={`h-2 rounded-full ${score >= 70 ? "bg-green-500" : score >= 40 ? "bg-yellow-500" : "bg-red-500"}`}
          style={{ width: `${Math.min(100, score)}%` }}
        />
      </div>
    </div>
  );
}

export function AeoScoreCard({ data, onCheck, loading }: AeoScoreCardProps) {
  const [storeName, setStoreName] = useState("");
  const [storeType, setStoreType] = useState("ラーメン");
  const [location, setLocation] = useState("渋谷");

  const handleCheck = () => {
    if (onCheck && storeName) {
      onCheck(storeName, storeType, location);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* ヘッダー */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4">
        <h2 className="text-white font-bold text-lg flex items-center gap-2">
          <span>🤖</span>
          AEO（AI検索言及）スコア
        </h2>
        <p className="text-purple-100 text-sm">
          ChatGPT・Perplexity等でのお店の言及度を分析
        </p>
      </div>

      {/* チェックフォーム */}
      {!data && (
        <div className="p-6 border-b">
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">店舗名</label>
              <input
                type="text"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                placeholder="〇〇ラーメン"
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">業種</label>
              <select
                value={storeType}
                onChange={(e) => setStoreType(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              >
                <option value="ラーメン">ラーメン</option>
                <option value="居酒屋">居酒屋</option>
                <option value="カフェ">カフェ</option>
                <option value="美容院">美容院</option>
                <option value="クリニック">クリニック</option>
                <option value="不動産">不動産</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">エリア</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="渋谷"
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>
          </div>
          <button
            onClick={handleCheck}
            disabled={loading || !storeName}
            className="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "チェック中..." : "AEOスコアをチェック"}
          </button>
        </div>
      )}

      {/* スコア表示 */}
      {data && (
        <>
          <div className="p-6">
            {/* 総合スコア */}
            <div className="text-center mb-6">
              <div className="text-sm text-gray-500 mb-2">総合スコア</div>
              <div
                className={`inline-flex items-center justify-center w-24 h-24 rounded-full ${getScoreBgColor(data.overallScore)}`}
              >
                <span className={`text-4xl font-bold ${getScoreColor(data.overallScore)}`}>
                  {data.overallScore}
                </span>
              </div>
              <div className="text-xs text-gray-400 mt-2">/100</div>
            </div>

            {/* プラットフォーム別スコア */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <ScoreGauge score={data.platformScores.chatgpt} label="ChatGPT" />
              <ScoreGauge score={data.platformScores.perplexity} label="Perplexity" />
              <ScoreGauge score={data.platformScores.gemini} label="Google AI" />
            </div>

            {/* クエリ結果 */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">
                チェック結果
              </h3>
              <div className="space-y-2">
                {data.queries.map((q, i) => (
                  <div
                    key={i}
                    className={`p-3 rounded-lg text-sm ${
                      q.mentioned ? "bg-green-50" : "bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-gray-600">{q.query}</span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded ${
                          q.mentioned
                            ? "bg-green-200 text-green-800"
                            : "bg-gray-200 text-gray-600"
                        }`}
                      >
                        {q.mentioned ? "言及あり" : "言及なし"}
                      </span>
                    </div>
                    {q.context && (
                      <p className="text-xs text-gray-500 truncate">
                        「{q.context}」
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* 競合 */}
            {data.queries.some((q) => q.competitors.length > 0) && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">
                  AIに言及されている競合
                </h3>
                <div className="flex flex-wrap gap-2">
                  {[...new Set(data.queries.flatMap((q) => q.competitors))]
                    .slice(0, 8)
                    .map((comp, i) => (
                      <span
                        key={i}
                        className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded"
                      >
                        {comp}
                      </span>
                    ))}
                </div>
              </div>
            )}

            {/* 改善提案 */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">
                改善提案
              </h3>
              <div className="bg-purple-50 rounded-lg p-4">
                <ul className="space-y-2">
                  {data.recommendations.map((rec, i) => (
                    <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                      <span className="text-purple-500">•</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* フッター */}
          <div className="px-6 py-3 bg-gray-50 text-xs text-gray-400 flex justify-between">
            <span>最終チェック: {new Date(data.checkedAt).toLocaleString("ja-JP")}</span>
            <button
              onClick={() => window.location.reload()}
              className="text-purple-600 hover:underline"
            >
              再チェック
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default AeoScoreCard;
