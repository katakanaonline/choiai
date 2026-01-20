"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { trackToolUsage } from "@/lib/gtag";

interface Post {
  id: string;
  content: string;
  imageUrl?: string;
  platforms: string[];
  createdAt: Date;
  stats?: {
    views: number;
    reactions: number;
    clicks: number;
  };
}

interface DailyReport {
  date: string;
  discoveryCount: number;
  totalViews: number;
  topPost?: {
    content: string;
    views: number;
  };
  sentiment: number;
  tips: string[];
}

// Sample data
const SAMPLE_POSTS: Post[] = [
  {
    id: "1",
    content: "今日のランチは自家製ミートソースパスタ。トマトは地元農家から直送です",
    platforms: ["gbp", "x", "instagram"],
    createdAt: new Date(Date.now() - 86400000),
    stats: { views: 45, reactions: 12, clicks: 5 },
  },
  {
    id: "2",
    content: "週末限定デザート始まりました。チーズケーキ、売り切れ御免です！",
    platforms: ["gbp", "x"],
    createdAt: new Date(Date.now() - 172800000),
    stats: { views: 89, reactions: 23, clicks: 8 },
  },
];

const SAMPLE_REPORT: DailyReport = {
  date: new Date().toLocaleDateString("ja-JP"),
  discoveryCount: 15,
  totalViews: 234,
  topPost: {
    content: "週末限定デザート始まりました",
    views: 89,
  },
  sentiment: 85,
  tips: [
    "写真付き投稿は反応が2倍になる傾向があります",
    "14時〜16時の投稿がよく見られています",
  ],
};

const PLATFORM_ICONS: Record<string, { icon: string; name: string; color: string }> = {
  gbp: { icon: "📍", name: "Google", color: "text-blue-400" },
  x: { icon: "𝕏", name: "X", color: "text-gray-300" },
  instagram: { icon: "📸", name: "Instagram", color: "text-pink-400" },
};

export default function ShukyakuBotPage() {
  const [postContent, setPostContent] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(["gbp", "x"]);
  const [isPosting, setIsPosting] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [posts, setPosts] = useState<Post[]>(SAMPLE_POSTS);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePost = async () => {
    if (!postContent.trim()) return;

    setIsPosting(true);
    trackToolUsage("shukyaku_bot", "post_created");

    // Simulate posting
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const newPost: Post = {
      id: Date.now().toString(),
      content: postContent,
      imageUrl: selectedImage || undefined,
      platforms: selectedPlatforms,
      createdAt: new Date(),
    };

    setPosts([newPost, ...posts]);
    setPostContent("");
    setSelectedImage(null);
    setIsPosting(false);
  };

  const togglePlatform = (platform: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platform)
        ? prev.filter((p) => p !== platform)
        : [...prev, platform]
    );
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="border-b border-gray-800">
        <div className="mx-auto max-w-4xl px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold">
            ちょい<span className="text-purple-400">AI</span>
          </Link>
          <span className="text-sm text-gray-400">集客ボット</span>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-8 space-y-8">
        {/* Hero Section */}
        <section className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 mb-4">
            <span className="text-4xl">🚀</span>
          </div>
          <h1 className="text-3xl font-bold mb-2">集客ボット</h1>
          <p className="text-gray-400 max-w-lg mx-auto">
            1日1投稿するだけ。あとはAIが自動で各プラットフォームに配信し、
            夜には「今日何人に見つかったか」をレポートします。
          </p>
        </section>

        {/* Post Input Section */}
        <section className="bg-gray-900 rounded-2xl p-6">
          <h2 className="font-bold mb-4 flex items-center gap-2">
            <span className="text-xl">✍️</span>
            今日の投稿
          </h2>

          {/* Platform Selection */}
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="text-sm text-gray-400 mr-2">配信先:</span>
            {Object.entries(PLATFORM_ICONS).map(([key, { icon, name, color }]) => (
              <button
                key={key}
                onClick={() => togglePlatform(key)}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                  selectedPlatforms.includes(key)
                    ? `bg-gray-700 ${color}`
                    : "bg-gray-800 text-gray-500"
                }`}
              >
                {icon} {name}
              </button>
            ))}
          </div>

          {/* Text Input */}
          <textarea
            value={postContent}
            onChange={(e) => setPostContent(e.target.value)}
            placeholder="写真でも、ひとことでもOK。今日のおすすめ、お知らせ、何でも投稿してみましょう"
            rows={4}
            className="w-full rounded-lg bg-gray-800 border border-gray-700 px-4 py-3 text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none resize-none mb-4"
            maxLength={500}
          />

          {/* Image Preview */}
          {selectedImage && (
            <div className="relative mb-4">
              <img
                src={selectedImage}
                alt="Selected"
                className="w-full max-h-64 object-cover rounded-lg"
              />
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute top-2 right-2 bg-gray-900/80 rounded-full p-2 hover:bg-gray-800"
              >
                ✕
              </button>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
              >
                📷 写真を追加
              </button>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500">{postContent.length}/500</span>
              <button
                onClick={handlePost}
                disabled={!postContent.trim() || isPosting || selectedPlatforms.length === 0}
                className="px-6 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 font-bold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
              >
                {isPosting ? "投稿中..." : "投稿する"}
              </button>
            </div>
          </div>
        </section>

        {/* Daily Report Section */}
        <section className="bg-gray-900 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-bold flex items-center gap-2">
              <span className="text-xl">📊</span>
              今日のレポート
            </h2>
            <button
              onClick={() => setShowReport(!showReport)}
              className="text-sm text-purple-400 hover:underline"
            >
              {showReport ? "閉じる" : "詳細を見る"}
            </button>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-800 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-purple-400">{SAMPLE_REPORT.discoveryCount}</div>
              <div className="text-sm text-gray-400 mt-1">人に見つかりました</div>
            </div>
            <div className="bg-gray-800 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-blue-400">{SAMPLE_REPORT.totalViews}</div>
              <div className="text-sm text-gray-400 mt-1">表示回数</div>
            </div>
            <div className="bg-gray-800 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-emerald-400">{SAMPLE_REPORT.sentiment}%</div>
              <div className="text-sm text-gray-400 mt-1">好感度</div>
            </div>
            <div className="bg-gray-800 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-amber-400">{posts.length}</div>
              <div className="text-sm text-gray-400 mt-1">投稿数</div>
            </div>
          </div>

          {showReport && (
            <div className="space-y-4">
              {/* Top Performing Post */}
              {SAMPLE_REPORT.topPost && (
                <div className="bg-gray-800/50 rounded-xl p-4">
                  <div className="text-sm text-gray-400 mb-2">一番反応がよかった投稿</div>
                  <p className="text-sm">{SAMPLE_REPORT.topPost.content}</p>
                  <div className="mt-2 text-xs text-purple-400">{SAMPLE_REPORT.topPost.views}回表示</div>
                </div>
              )}

              {/* Tips */}
              <div className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 rounded-xl p-4 border border-purple-500/20">
                <div className="text-sm font-bold text-purple-300 mb-2">💡 今週のヒント</div>
                <ul className="space-y-1">
                  {SAMPLE_REPORT.tips.map((tip, i) => (
                    <li key={i} className="text-sm text-gray-300">・{tip}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </section>

        {/* Recent Posts Section */}
        <section className="bg-gray-900 rounded-2xl p-6">
          <h2 className="font-bold mb-4 flex items-center gap-2">
            <span className="text-xl">📋</span>
            最近の投稿
          </h2>

          <div className="space-y-4">
            {posts.map((post) => (
              <div key={post.id} className="bg-gray-800 rounded-xl p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm mb-2">{post.content}</p>
                    <div className="flex flex-wrap gap-1">
                      {post.platforms.map((p) => (
                        <span key={p} className={`text-xs ${PLATFORM_ICONS[p]?.color || 'text-gray-400'}`}>
                          {PLATFORM_ICONS[p]?.icon} {PLATFORM_ICONS[p]?.name}
                        </span>
                      ))}
                    </div>
                  </div>
                  {post.stats && (
                    <div className="text-right text-xs text-gray-400">
                      <div>{post.stats.views}回表示</div>
                      <div>{post.stats.reactions}反応</div>
                    </div>
                  )}
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  {post.createdAt.toLocaleDateString("ja-JP", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            ))}

            {posts.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                まだ投稿がありません。上のフォームから投稿してみましょう！
              </div>
            )}
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 rounded-2xl p-8 text-center border border-purple-500/20">
          <h2 className="text-xl font-bold mb-2">本番運用を始める</h2>
          <p className="text-gray-400 mb-6">
            月額¥5,000で、投稿の自動配信・毎日レポート・口コミ返信サポートが使い放題
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/"
              className="px-6 py-3 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
            >
              ← ツール一覧に戻る
            </Link>
            <a
              href="https://forms.google.com/contact"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 font-bold hover:opacity-90 transition-opacity"
            >
              無料相談する
            </a>
          </div>
        </section>

        {/* Footer */}
        <footer className="text-center py-8 text-sm text-gray-500">
          <div className="flex justify-center gap-6 mb-4">
            <Link href="/" className="hover:text-gray-400">ホーム</Link>
            <Link href="/privacy" className="hover:text-gray-400">プライバシーポリシー</Link>
          </div>
          <p>2026 ちょいAI</p>
        </footer>
      </main>
    </div>
  );
}
