"use client";

import React from "react";

/**
 * ScoreGauge - スコアゲージ
 * AEOスコア、品質スコアなど100点満点の指標をビジュアル表示
 */

interface ScoreGaugeProps {
  score: number; // 0-100
  label: string;
  size?: number;
}

export function ScoreGauge({ score, label, size = 200 }: ScoreGaugeProps) {
  const clampedScore = Math.max(0, Math.min(100, score));
  const strokeWidth = size * 0.08;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * Math.PI; // 半円
  const offset = circumference - (clampedScore / 100) * circumference;

  // スコアに応じた色
  const getColor = (s: number) => {
    if (s >= 70) return "#22c55e"; // 緑
    if (s >= 40) return "#f59e0b"; // 黄
    return "#ef4444"; // 赤
  };

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size * 0.6} viewBox={`0 0 ${size} ${size * 0.6}`}>
        {/* 背景円弧 */}
        <path
          d={`M ${strokeWidth / 2} ${size * 0.55} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size * 0.55}`}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        {/* スコア円弧 */}
        <path
          d={`M ${strokeWidth / 2} ${size * 0.55} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size * 0.55}`}
          fill="none"
          stroke={getColor(clampedScore)}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1s ease-out" }}
        />
        {/* スコア数値 */}
        <text
          x={size / 2}
          y={size * 0.45}
          textAnchor="middle"
          className="font-bold"
          style={{ fontSize: size * 0.25, fill: getColor(clampedScore) }}
        >
          {Math.round(clampedScore)}
        </text>
      </svg>
      <p className="mt-2 text-sm font-medium text-gray-600">{label}</p>
    </div>
  );
}
