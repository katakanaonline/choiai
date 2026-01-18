"use client";

import { useState } from "react";
import Link from "next/link";

export default function SettingsPage() {
  const [storeName, setStoreName] = useState("");
  const [placeId, setPlaceId] = useState("");
  const [address, setAddress] = useState("");
  const [keywords, setKeywords] = useState<string[]>(["", "", ""]);
  const [ntfyTopic, setNtfyTopic] = useState("");
  const [rankThreshold, setRankThreshold] = useState(3);
  const [notifyNewReview, setNotifyNewReview] = useState(true);
  const [notifyLowRating, setNotifyLowRating] = useState(true);
  const [saving, setSaving] = useState(false);

  const handleKeywordChange = (index: number, value: string) => {
    const newKeywords = [...keywords];
    newKeywords[index] = value;
    setKeywords(newKeywords);
  };

  const addKeyword = () => {
    if (keywords.length < 10) {
      setKeywords([...keywords, ""]);
    }
  };

  const removeKeyword = (index: number) => {
    if (keywords.length > 1) {
      setKeywords(keywords.filter((_, i) => i !== index));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    // TODO: Supabaseに保存
    await new Promise((resolve) => setTimeout(resolve, 1000));
    alert("設定を保存しました（デモ）");
    setSaving(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-4">
            <Link
              href="/dashboard"
              className="text-gray-600 hover:text-gray-900 mr-4"
            >
              ← 戻る
            </Link>
            <h1 className="text-xl font-bold text-gray-900">設定</h1>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 店舗情報 */}
        <section className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span>🏪</span> 店舗情報
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                店舗名
              </label>
              <input
                type="text"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                placeholder="例: 麺屋 カタカナ"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Google Place ID
                <span className="text-gray-400 font-normal ml-2">
                  （Googleマップの店舗URLから取得）
                </span>
              </label>
              <input
                type="text"
                value={placeId}
                onChange={(e) => setPlaceId(e.target.value)}
                placeholder="例: ChIJ..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none font-mono text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                住所
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="例: 東京都新宿区西新宿1-1-1"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
          </div>
        </section>

        {/* 監視キーワード */}
        <section className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span>🔍</span> 監視キーワード
          </h2>

          <div className="space-y-3">
            {keywords.map((keyword, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  value={keyword}
                  onChange={(e) => handleKeywordChange(index, e.target.value)}
                  placeholder={`キーワード ${index + 1}`}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
                {keywords.length > 1 && (
                  <button
                    onClick={() => removeKeyword(index)}
                    className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    削除
                  </button>
                )}
              </div>
            ))}
          </div>

          {keywords.length < 10 && (
            <button
              onClick={addKeyword}
              className="mt-3 text-sm text-blue-600 hover:text-blue-700"
            >
              + キーワードを追加
            </button>
          )}
        </section>

        {/* 通知設定 */}
        <section className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span>🔔</span> 通知設定
          </h2>

          <div className="space-y-4">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={notifyNewReview}
                onChange={(e) => setNotifyNewReview(e.target.checked)}
                className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-gray-700">新着口コミを通知</span>
            </label>

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={notifyLowRating}
                onChange={(e) => setNotifyLowRating(e.target.checked)}
                className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-gray-700">
                低評価（★3以下）口コミを即時通知
              </span>
            </label>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                順位変動アラート（何位以上変動で通知）
              </label>
              <select
                value={rankThreshold}
                onChange={(e) => setRankThreshold(Number(e.target.value))}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              >
                <option value={1}>1位以上</option>
                <option value={2}>2位以上</option>
                <option value={3}>3位以上</option>
                <option value={5}>5位以上</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ntfy.sh トピック
                <span className="text-gray-400 font-normal ml-2">
                  （通知を受け取るトピック名）
                </span>
              </label>
              <input
                type="text"
                value={ntfyTopic}
                onChange={(e) => setNtfyTopic(e.target.value)}
                placeholder="例: choimarke-your-store"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none font-mono text-sm"
              />
              <p className="mt-1 text-sm text-gray-500">
                ntfy.shアプリで購読すると、スマホにプッシュ通知が届きます
              </p>
            </div>
          </div>
        </section>

        {/* 保存ボタン */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-4 px-6 rounded-lg transition-colors"
        >
          {saving ? "保存中..." : "設定を保存"}
        </button>
      </main>
    </div>
  );
}
