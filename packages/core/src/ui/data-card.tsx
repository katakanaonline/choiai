"use client";

import React, { ReactNode } from "react";

/**
 * DataCard - データ表示カード
 *
 * 機能:
 * - 指標表示（数値、変化率）
 * - アイコン対応
 * - トレンド表示
 */

export interface DataCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  trend?: {
    value: number;
    label?: string;
    isPositive?: boolean;
  };
  className?: string;
  onClick?: () => void;
}

export function DataCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  className = "",
  onClick,
}: DataCardProps) {
  return (
    <div
      className={`
        rounded-xl border bg-white p-6 shadow-sm
        ${onClick ? "cursor-pointer hover:shadow-md transition-shadow" : ""}
        ${className}
      `}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
          {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
        </div>
        {icon && (
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            {icon}
          </div>
        )}
      </div>

      {trend && (
        <div className="mt-4 flex items-center gap-2">
          <span
            className={`
              inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium
              ${
                trend.isPositive ?? trend.value >= 0
                  ? "bg-green-50 text-green-700"
                  : "bg-red-50 text-red-700"
              }
            `}
          >
            {trend.isPositive ?? trend.value >= 0 ? (
              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            ) : (
              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            )}
            {trend.value > 0 ? "+" : ""}{trend.value}%
          </span>
          {trend.label && <span className="text-xs text-gray-500">{trend.label}</span>}
        </div>
      )}
    </div>
  );
}

/**
 * DataCardGrid - カードグリッド
 */
export function DataCardGrid({
  children,
  columns = 4,
}: {
  children: ReactNode;
  columns?: 2 | 3 | 4;
}) {
  const gridCols = {
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
  };

  return <div className={`grid gap-4 ${gridCols[columns]}`}>{children}</div>;
}

export default DataCard;
