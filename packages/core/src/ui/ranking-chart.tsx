"use client";

import React from "react";

/**
 * RankingChart - 順位チャート
 * MEO順位の変動を直感的に表示。大きな矢印で上昇/下降がわかる。
 */

interface RankingChartProps {
  currentRank: number;
  previousRank: number;
  keyword: string;
  maxRank?: number;
}

export function RankingChart({
  currentRank,
  previousRank,
  keyword,
  maxRank = 20,
}: RankingChartProps) {
  const change = previousRank - currentRank; // 正=上昇, 負=下降
  const isUp = change > 0;
  const isDown = change < 0;
  const noChange = change === 0;

  // 順位バーの高さ（低い順位ほど短い）
  const barHeight = Math.max(10, 100 - (currentRank / maxRank) * 80);

  return (
    <div className="flex flex-col items-center p-6">
      {/* 順位表示 */}
      <div className="flex items-end gap-4">
        {/* 順位バー */}
        <div className="relative flex flex-col items-center">
          <div
            className="w-20 rounded-t-lg transition-all duration-700"
            style={{
              height: `${barHeight * 1.5}px`,
              background: isUp
                ? "linear-gradient(to top, #22c55e, #86efac)"
                : isDown
                  ? "linear-gradient(to top, #ef4444, #fca5a5)"
                  : "linear-gradient(to top, #6b7280, #9ca3af)",
            }}
          />
        </div>

        {/* 順位数値 */}
        <div className="text-center">
          <div
            className="text-7xl font-black"
            style={{
              color: isUp ? "#22c55e" : isDown ? "#ef4444" : "#6b7280",
            }}
          >
            {currentRank}
            <span className="text-2xl text-gray-400">位</span>
          </div>

          {/* 変動矢印 */}
          {!noChange && (
            <div
              className="mt-2 flex items-center justify-center gap-1 text-2xl font-bold"
              style={{ color: isUp ? "#22c55e" : "#ef4444" }}
            >
              {isUp ? (
                <>
                  <svg className="h-8 w-8" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                  {Math.abs(change)}
                </>
              ) : (
                <>
                  <svg className="h-8 w-8" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  {Math.abs(change)}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* キーワード */}
      <p className="mt-4 text-lg font-medium text-gray-700">「{keyword}」</p>
    </div>
  );
}
