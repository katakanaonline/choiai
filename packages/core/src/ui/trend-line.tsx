"use client";

import React from "react";

/**
 * TrendLine - トレンドライン
 * 7日間の推移をシンプルな折れ線で表示
 */

interface TrendLineProps {
  data: number[];
  label: string;
  unit?: string;
  height?: number;
}

export function TrendLine({ data, label, unit = "", height = 120 }: TrendLineProps) {
  if (data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const width = 300;
  const padding = 20;

  // データポイントを座標に変換
  const points = data.map((value, i) => {
    const x = padding + (i / (data.length - 1)) * (width - padding * 2);
    const y = height - padding - ((value - min) / range) * (height - padding * 2);
    return { x, y, value };
  });

  // パスを生成
  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");

  // トレンド判定
  const lastValue = data[data.length - 1];
  const firstValue = data[0];
  const trend = lastValue > firstValue ? "up" : lastValue < firstValue ? "down" : "flat";
  const trendColor = trend === "up" ? "#22c55e" : trend === "down" ? "#ef4444" : "#6b7280";

  return (
    <div className="flex flex-col items-center">
      <svg width={width} height={height} className="overflow-visible">
        {/* グラデーション塗りつぶし */}
        <defs>
          <linearGradient id={`gradient-${label}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={trendColor} stopOpacity="0.3" />
            <stop offset="100%" stopColor={trendColor} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* 塗りつぶしエリア */}
        <path
          d={`${linePath} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`}
          fill={`url(#gradient-${label})`}
        />

        {/* ライン */}
        <path
          d={linePath}
          fill="none"
          stroke={trendColor}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* 最新ポイント */}
        <circle
          cx={points[points.length - 1].x}
          cy={points[points.length - 1].y}
          r="6"
          fill="white"
          stroke={trendColor}
          strokeWidth="3"
        />
      </svg>

      {/* 最新値 */}
      <div className="mt-2 text-center">
        <span className="text-3xl font-bold" style={{ color: trendColor }}>
          {lastValue.toLocaleString()}
        </span>
        {unit && <span className="ml-1 text-gray-500">{unit}</span>}
      </div>
      <p className="text-sm text-gray-600">{label}</p>
    </div>
  );
}
