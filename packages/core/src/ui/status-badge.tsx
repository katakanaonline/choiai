"use client";

import React from "react";

/**
 * StatusBadge - ステータス表示バッジ
 */

export type StatusType = "success" | "warning" | "error" | "info" | "neutral";

export interface StatusBadgeProps {
  status: StatusType;
  label: string;
  size?: "sm" | "md" | "lg";
  dot?: boolean;
}

const statusStyles: Record<StatusType, string> = {
  success: "bg-green-50 text-green-700 border-green-200",
  warning: "bg-yellow-50 text-yellow-700 border-yellow-200",
  error: "bg-red-50 text-red-700 border-red-200",
  info: "bg-blue-50 text-blue-700 border-blue-200",
  neutral: "bg-gray-50 text-gray-700 border-gray-200",
};

const dotStyles: Record<StatusType, string> = {
  success: "bg-green-500",
  warning: "bg-yellow-500",
  error: "bg-red-500",
  info: "bg-blue-500",
  neutral: "bg-gray-500",
};

const sizeStyles = {
  sm: "px-2 py-0.5 text-xs",
  md: "px-2.5 py-1 text-sm",
  lg: "px-3 py-1.5 text-sm",
};

export function StatusBadge({
  status,
  label,
  size = "md",
  dot = false,
}: StatusBadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center gap-1.5 rounded-full border font-medium
        ${statusStyles[status]}
        ${sizeStyles[size]}
      `}
    >
      {dot && (
        <span className={`h-1.5 w-1.5 rounded-full ${dotStyles[status]}`} />
      )}
      {label}
    </span>
  );
}

/**
 * 汎用的なステータス変換ユーティリティ
 */
export function getStatusFromValue(
  value: number,
  thresholds: { warning: number; error: number }
): StatusType {
  if (value >= thresholds.error) return "error";
  if (value >= thresholds.warning) return "warning";
  return "success";
}

export function getStatusFromBoolean(value: boolean): StatusType {
  return value ? "success" : "error";
}

export default StatusBadge;
