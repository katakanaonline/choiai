"use client";

import { useState, useCallback } from "react";

interface ReviewData {
  id: string;
  rating: number;
  text: string;
  authorName: string;
  relativeTime: string;
  replied: boolean;
}

interface Props {
  reviews: ReviewData[];
  storeName?: string;
}

export function ReviewList({ reviews, storeName = "当店" }: Props) {
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [suggestedReply, setSuggestedReply] = useState<Record<string, string>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleGenerateReply = async (review: ReviewData) => {
    setGeneratingId(review.id);

    try {
      // APIを呼び出して返信案を生成
      const response = await fetch("/api/reviews/generate-reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reviewId: review.id,
          reviewText: review.text,
          rating: review.rating,
          authorName: review.authorName,
          storeName,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSuggestedReply((prev) => ({
          ...prev,
          [review.id]: data.suggestedReply,
        }));
      } else {
        // APIエラー時はフォールバックのテンプレートを使用
        const replies: Record<number, string> = {
          5: `${review.authorName}様、嬉しいお言葉をいただきありがとうございます！スタッフ一同、大変励みになります。またのご来店を心よりお待ちしております。`,
          4: `${review.authorName}様、ご来店ありがとうございます。ご満足いただけて嬉しいです。さらに良いサービスを提供できるよう努めてまいります。`,
          3: `${review.authorName}様、貴重なご意見をいただきありがとうございます。ご指摘いただいた点は真摯に受け止め、改善に努めてまいります。またの機会がございましたら、ぜひお越しください。`,
          2: `${review.authorName}様、ご期待に沿えず申し訳ございません。いただいたご意見をもとに、サービスの改善に取り組んでまいります。`,
          1: `${review.authorName}様、ご不快な思いをさせてしまい、誠に申し訳ございません。詳しいお話をお聞かせいただけますと幸いです。`,
        };
        setSuggestedReply((prev) => ({
          ...prev,
          [review.id]: replies[review.rating] || replies[3],
        }));
      }
    } catch {
      // ネットワークエラー時もフォールバック
      const fallbackReply = `${review.authorName}様、口コミをいただきありがとうございます。今後ともよろしくお願いいたします。`;
      setSuggestedReply((prev) => ({
        ...prev,
        [review.id]: fallbackReply,
      }));
    }

    setGeneratingId(null);
  };

  const handleCopyReply = useCallback(async (reviewId: string) => {
    const text = suggestedReply[reviewId];
    if (!text) return;

    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(reviewId);
      // 2秒後に「コピー済み」表示を解除
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
      // フォールバック: 古いブラウザ向け
      const textArea = document.createElement("textarea");
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopiedId(reviewId);
      setTimeout(() => setCopiedId(null), 2000);
    }
  }, [suggestedReply]);

  const renderStars = (rating: number) => {
    return (
      <span className="text-yellow-500">
        {"★".repeat(rating)}
        <span className="text-gray-300">{"★".repeat(5 - rating)}</span>
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <div
          key={review.id}
          className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              {renderStars(review.rating)}
              <span className="text-sm text-gray-500">{review.relativeTime}</span>
            </div>
            {review.replied && (
              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                返信済み
              </span>
            )}
          </div>

          <p className="text-sm text-gray-600 mb-2">{review.authorName}</p>
          <p className="text-gray-800 mb-4">{review.text}</p>

          {suggestedReply[review.id] && (
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 mb-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-blue-800 font-medium">
                  AIによる返信案:
                </p>
                <button
                  onClick={() => handleCopyReply(review.id)}
                  className={`text-xs px-3 py-1 rounded-full transition-all ${
                    copiedId === review.id
                      ? "bg-green-500 text-white"
                      : "bg-blue-100 hover:bg-blue-200 text-blue-700"
                  }`}
                >
                  {copiedId === review.id ? "コピー済み" : "コピー"}
                </button>
              </div>
              <p className="text-sm text-blue-700">{suggestedReply[review.id]}</p>
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={() => handleGenerateReply(review)}
              disabled={generatingId === review.id}
              className="text-sm bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg transition-colors"
            >
              {generatingId === review.id ? "生成中..." : "返信案を生成"}
            </button>
            <a
              href="https://business.google.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors"
            >
              Googleで返信
            </a>
          </div>
        </div>
      ))}
    </div>
  );
}
