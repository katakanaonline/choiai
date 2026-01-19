"use client";

import { useEffect, useState } from "react";

interface LoadingOverlayProps {
  isLoading: boolean;
  steps?: string[];
  currentStep?: number;
}

export function LoadingOverlay({ isLoading, steps, currentStep = 0 }: LoadingOverlayProps) {
  const [dots, setDots] = useState("");

  useEffect(() => {
    if (!isLoading) return;
    const interval = setInterval(() => {
      setDots((d) => (d.length >= 3 ? "" : d + "."));
    }, 400);
    return () => clearInterval(interval);
  }, [isLoading]);

  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/80 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl bg-gray-900 p-8 text-center shadow-2xl">
        {/* Animated loader */}
        <div className="mb-6 flex justify-center">
          <div className="relative h-16 w-16">
            <div className="absolute inset-0 animate-ping rounded-full bg-cyan-500/30" />
            <div className="absolute inset-2 animate-pulse rounded-full bg-cyan-500/50" />
            <div className="absolute inset-4 rounded-full bg-cyan-500" />
          </div>
        </div>

        {/* Status text */}
        <p className="text-lg font-medium text-white">
          {steps && steps[currentStep] ? steps[currentStep] : "処理中"}
          {dots}
        </p>

        {/* Progress steps */}
        {steps && steps.length > 1 && (
          <div className="mt-6">
            <div className="flex justify-center gap-2">
              {steps.map((_, i) => (
                <div
                  key={i}
                  className={`h-2 w-8 rounded-full transition-all duration-300 ${
                    i < currentStep
                      ? "bg-green-500"
                      : i === currentStep
                      ? "bg-cyan-500 animate-pulse"
                      : "bg-gray-700"
                  }`}
                />
              ))}
            </div>
            <p className="mt-3 text-sm text-gray-500">
              {currentStep + 1} / {steps.length}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// シンプルなインラインローダー
export function InlineLoader({ text = "読み込み中" }: { text?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-8">
      <svg className="h-5 w-5 animate-spin text-cyan-500" viewBox="0 0 24 24">
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
          fill="none"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      <span className="text-gray-400">{text}</span>
    </div>
  );
}
