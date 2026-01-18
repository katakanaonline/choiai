"use client";

import React from "react";

/**
 * Loading - ローディングインジケーター
 */

export interface LoadingProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeStyles = {
  sm: "h-4 w-4 border-2",
  md: "h-8 w-8 border-2",
  lg: "h-12 w-12 border-3",
};

export function Loading({ size = "md", className = "" }: LoadingProps) {
  return (
    <div
      className={`
        animate-spin rounded-full border-blue-600 border-t-transparent
        ${sizeStyles[size]}
        ${className}
      `}
    />
  );
}

/**
 * LoadingOverlay - オーバーレイ付きローディング
 */
export function LoadingOverlay({
  message = "読み込み中...",
}: {
  message?: string;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white bg-opacity-80">
      <div className="flex flex-col items-center gap-4">
        <Loading size="lg" />
        <p className="text-sm text-gray-600">{message}</p>
      </div>
    </div>
  );
}

/**
 * LoadingCard - カード型ローディング
 */
export function LoadingCard({
  lines = 3,
}: {
  lines?: number;
}) {
  return (
    <div className="animate-pulse rounded-xl border bg-white p-6 shadow-sm">
      <div className="h-4 w-1/3 rounded bg-gray-200" />
      <div className="mt-4 space-y-3">
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className="h-3 rounded bg-gray-200"
            style={{ width: `${100 - i * 15}%` }}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * LoadingTable - テーブル型ローディング
 */
export function LoadingTable({
  rows = 5,
  cols = 4,
}: {
  rows?: number;
  cols?: number;
}) {
  return (
    <div className="animate-pulse rounded-xl border bg-white shadow-sm">
      <div className="border-b bg-gray-50 p-4">
        <div className="h-4 w-1/4 rounded bg-gray-200" />
      </div>
      <div className="divide-y">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex gap-4 p-4">
            {Array.from({ length: cols }).map((_, j) => (
              <div
                key={j}
                className="h-4 flex-1 rounded bg-gray-200"
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default Loading;
