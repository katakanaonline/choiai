"use client";

import React from "react";

/**
 * SentimentRing - 感情分析リング
 * 口コミのポジティブ/ネガティブ比率をドーナツチャートで表示
 */

interface SentimentRingProps {
  positive: number;
  neutral: number;
  negative: number;
  size?: number;
}

export function SentimentRing({
  positive,
  neutral,
  negative,
  size = 180,
}: SentimentRingProps) {
  const total = positive + neutral + negative || 1;
  const posPercent = (positive / total) * 100;
  const neuPercent = (neutral / total) * 100;
  const negPercent = (negative / total) * 100;

  const strokeWidth = size * 0.15;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // 各セグメントの開始位置を計算
  const posOffset = 0;
  const neuOffset = (posPercent / 100) * circumference;
  const negOffset = ((posPercent + neuPercent) / 100) * circumference;

  // 最大カテゴリを判定
  const dominant = posPercent >= neuPercent && posPercent >= negPercent
    ? "positive"
    : negPercent >= neuPercent
      ? "negative"
      : "neutral";

  const emoji = dominant === "positive" ? "😊" : dominant === "negative" ? "😟" : "😐";

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {/* ポジティブ（緑） */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#22c55e"
            strokeWidth={strokeWidth}
            strokeDasharray={`${(posPercent / 100) * circumference} ${circumference}`}
            strokeDashoffset={-posOffset}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            strokeLinecap="round"
          />
          {/* ニュートラル（グレー） */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#9ca3af"
            strokeWidth={strokeWidth}
            strokeDasharray={`${(neuPercent / 100) * circumference} ${circumference}`}
            strokeDashoffset={-neuOffset}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
          {/* ネガティブ（赤） */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#ef4444"
            strokeWidth={strokeWidth}
            strokeDasharray={`${(negPercent / 100) * circumference} ${circumference}`}
            strokeDashoffset={-negOffset}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </svg>

        {/* 中央の絵文字 */}
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ fontSize: size * 0.3 }}
        >
          {emoji}
        </div>
      </div>

      {/* 凡例 */}
      <div className="mt-4 flex gap-4 text-sm">
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded-full bg-green-500" />
          <span>{Math.round(posPercent)}%</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded-full bg-gray-400" />
          <span>{Math.round(neuPercent)}%</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded-full bg-red-500" />
          <span>{Math.round(negPercent)}%</span>
        </div>
      </div>
    </div>
  );
}
