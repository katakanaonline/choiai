"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { RankingTable } from "@/components/RankingTable";
import { RankingChart } from "@/components/RankingChart";
import { ReviewList } from "@/components/ReviewList";

// デモデータ
const DEMO_RANKINGS = [
  { keyword: "新宿 ラーメン", currentRank: 3, previousRank: 3, weekAgoRank: 5 },
  { keyword: "新宿 つけ麺", currentRank: 5, previousRank: 4, weekAgoRank: 5 },
  { keyword: "西新宿 ラーメン", currentRank: 2, previousRank: 3, weekAgoRank: 5 },
];

const DEMO_HISTORY = [
  { date: "1/12", rank: 5 },
  { date: "1/13", rank: 4 },
  { date: "1/14", rank: 4 },
  { date: "1/15", rank: 3 },
  { date: "1/16", rank: 3 },
  { date: "1/17", rank: 3 },
  { date: "1/18", rank: 3 },
];

const DEMO_REVIEWS = [
  {
    id: "1",
    rating: 5,
    text: "スープが最高でした！麺のコシも絶妙で、また絶対に来ます。",
    authorName: "田中太郎",
    relativeTime: "2日前",
    replied: false,
  },
  {
    id: "2",
    rating: 3,
    text: "量が少なかった。味は良かったけど、もう少しボリュームが欲しい。",
    authorName: "佐藤花子",
    relativeTime: "1週間前",
    replied: true,
  },
  {
    id: "3",
    rating: 5,
    text: "深夜営業してるのが助かります。接客も丁寧でした。",
    authorName: "鈴木一郎",
    relativeTime: "2週間前",
    replied: true,
  },
];

export default function DashboardPage() {
  const [storeName, setStoreName] = useState("麺屋 カタカナ（デモ）");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // デモモード：すぐに表示
    setTimeout(() => setIsLoading(false), 500);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold text-gray-900">ちょいマーケ</h1>
              <span className="text-sm text-gray-500">|</span>
              <span className="text-sm text-gray-700">{storeName}</span>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/settings"
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                設定
              </Link>
              <button className="text-gray-600 hover:text-gray-900 transition-colors">
                ログアウト
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* デモバナー */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <p className="text-yellow-800 text-sm">
            <strong>デモモード:</strong> 実際のデータを表示するには、
            <Link href="/settings" className="text-blue-600 hover:underline">
              設定
            </Link>
            から店舗情報を登録してください。
          </p>
        </div>

        {/* 順位サマリー */}
        <section className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span>📊</span> MEO順位サマリー
          </h2>
          <RankingTable rankings={DEMO_RANKINGS} />
        </section>

        {/* 順位推移グラフ */}
        <section className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span>📈</span> 順位推移グラフ
            <span className="text-sm font-normal text-gray-500">
              （新宿 ラーメン）
            </span>
          </h2>
          <RankingChart history={DEMO_HISTORY} />
        </section>

        {/* 最新の口コミ */}
        <section className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span>💬</span> 最新の口コミ
          </h2>
          <ReviewList reviews={DEMO_REVIEWS} />
        </section>
      </main>
    </div>
  );
}
