"use client";

import { useState } from "react";
import Link from "next/link";

const tools = [
  {
    id: "aeo",
    name: "AEOチェッカー",
    tagline: "AIに自社が出てるか確認",
    description: "ChatGPT、Claudeで御社が言及されてるかチェック。",
    icon: "🤖",
    color: "from-cyan-500 to-blue-600",
    visual: "multiline",
    href: "/aeo",
    ready: true,
  },
  {
    id: "ai-review",
    name: "100人AIレビュー",
    tagline: "AIモニター100人が御社を評価",
    description: "LP、商品ページ、広告を100人のAIペルソナがレビュー。多角的なフィードバックを即座に。",
    icon: "👥",
    color: "from-indigo-500 to-violet-600",
    visual: "crowd",
    href: "/ai-review",
    ready: false,
  },
  {
    id: "site-check",
    name: "サイト校正",
    tagline: "誤字脱字・リンク切れを自動検出",
    description: "サイト全体をクロールして問題箇所を定期チェック。修正漏れゼロに。",
    icon: "✍️",
    color: "from-teal-500 to-cyan-600",
    visual: "checker",
    href: "/site-check",
    ready: false,
  },
  {
    id: "meo",
    name: "MEO・口コミ",
    tagline: "Googleマップの評判を育てる",
    description: "レビュー促進QRコード発行。口コミ数・評価の推移が一目でわかる。",
    icon: "⭐",
    color: "from-amber-500 to-orange-600",
    visual: "stars",
    ready: false,
  },
  {
    id: "chatbot",
    name: "AIチャット",
    tagline: "御社専用のChatGPT",
    description: "FAQと商品情報を覚えた、あなたのお店専用AIアシスタント。",
    icon: "💬",
    color: "from-emerald-500 to-green-600",
    visual: "chat",
    ready: false,
  },
  {
    id: "competitor",
    name: "競合ウォッチ",
    tagline: "ライバルの動きを自動追跡",
    description: "SNS、PR、ニュースから競合の動向を毎週レポート。",
    icon: "👁️",
    color: "from-rose-500 to-pink-600",
    visual: "timeline",
    ready: false,
  },
];

export default function Home() {
  const [hoveredTool, setHoveredTool] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Hero */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-purple-600/10 to-transparent" />
        <div className="relative mx-auto max-w-5xl px-6 py-20 text-center">
          <h1 className="text-5xl font-black tracking-tight sm:text-6xl">
            ちょい
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              AI
            </span>
          </h1>
          <p className="mt-4 text-xl text-gray-400">
            ちょっとだけAIが入った、シンプルな業務ツール
          </p>
          <p className="mt-2 text-gray-500">
            1ヶ月無料で試せます
          </p>
        </div>
      </header>

      {/* Tools Grid */}
      <main className="mx-auto max-w-6xl px-6 pb-20">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {tools.map((tool) => (
            <ToolCard
              key={tool.id}
              tool={tool}
              isHovered={hoveredTool === tool.id}
              onHover={() => setHoveredTool(tool.id)}
              onLeave={() => setHoveredTool(null)}
            />
          ))}
        </div>
      </main>

      {/* CTA */}
      <section className="border-t border-gray-800 bg-gray-900/50">
        <div className="mx-auto max-w-3xl px-6 py-16 text-center">
          <h2 className="text-2xl font-bold">興味のあるツールはありますか？</h2>
          <p className="mt-2 text-gray-400">
            開発優先度の参考にさせてください
          </p>
          <a
            href="https://forms.gle/xxxxx"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-block rounded-full bg-white px-8 py-3 font-semibold text-gray-900 transition hover:bg-gray-200"
          >
            リクエストを送る
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-8 text-center text-sm text-gray-500">
        <p>© 2025 ちょいAI</p>
      </footer>
    </div>
  );
}

/** ツールごとのビジュアル表現 */
function ToolVisual({ type, active }: { type: string; active: boolean }) {
  switch (type) {
    case "versus":
      return (
        <div className="flex items-center gap-4">
          <div className={`flex h-16 w-16 items-center justify-center rounded-xl bg-white/20 text-2xl font-black transition-transform ${active ? "scale-110" : ""}`}>
            A
          </div>
          <span className="text-3xl font-bold text-white/60">vs</span>
          <div className={`flex h-16 w-16 items-center justify-center rounded-xl bg-white/20 text-2xl font-black transition-transform ${active ? "scale-110" : ""}`}>
            B
          </div>
        </div>
      );

    case "multiline":
      return (
        <div className="flex gap-3">
          {["GPT", "Gem", "Pplx"].map((ai, i) => (
            <div key={ai} className="flex flex-col items-center gap-2">
              <div
                className="w-3 rounded-full bg-white/80 transition-all duration-500"
                style={{ height: active ? `${60 + i * 20}px` : "40px" }}
              />
              <span className="text-xs text-white/60">{ai}</span>
            </div>
          ))}
        </div>
      );

    case "stars":
      return (
        <div className="flex flex-col items-center">
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <span
                key={n}
                className={`text-3xl transition-all duration-300 ${active && n <= 4 ? "scale-125" : ""}`}
                style={{ opacity: n <= 4 ? 1 : 0.3 }}
              >
                ★
              </span>
            ))}
          </div>
          <span className="mt-2 text-4xl font-black">4.2</span>
        </div>
      );

    case "chat":
      return (
        <div className="flex flex-col gap-2">
          <div className={`rounded-2xl rounded-bl-none bg-white/20 px-4 py-2 text-sm transition-all duration-300 ${active ? "translate-x-1" : ""}`}>
            この商品の在庫は？
          </div>
          <div className={`self-end rounded-2xl rounded-br-none bg-white/40 px-4 py-2 text-sm transition-all duration-300 ${active ? "-translate-x-1" : ""}`}>
            はい、3点ございます
          </div>
        </div>
      );

    case "timeline":
      return (
        <div className="flex items-end gap-2">
          {[40, 65, 45, 80, 55, 70, 90].map((h, i) => (
            <div
              key={i}
              className="w-6 rounded-t bg-white/30 transition-all duration-500"
              style={{ height: active ? `${h}px` : "30px" }}
            />
          ))}
        </div>
      );

    case "progress":
      return (
        <div className="w-48">
          <div className="h-4 overflow-hidden rounded-full bg-white/20">
            <div
              className="h-full rounded-full bg-white/80 transition-all duration-700"
              style={{ width: active ? "75%" : "30%" }}
            />
          </div>
          <p className="mt-2 text-center text-sm text-white/60">
            {active ? "247件 収集中..." : "リスト生成"}
          </p>
        </div>
      );

    case "checker":
      return (
        <div className="flex flex-col items-center gap-3">
          <div className="flex gap-2 text-sm font-mono">
            <span className="rounded bg-white/20 px-2 py-1">お問い合せ</span>
            <span className={`rounded px-2 py-1 transition-all ${active ? "bg-red-400/80 line-through" : "bg-white/20"}`}>
              お問い合わせ
            </span>
          </div>
          <div className="flex items-center gap-2 text-white/60">
            <span className={`text-2xl transition-all ${active ? "text-green-400" : ""}`}>
              {active ? "✓" : "○"}
            </span>
            <span className="text-sm">{active ? "修正済み" : "チェック中..."}</span>
          </div>
        </div>
      );

    case "crowd":
      return (
        <div className="flex flex-col items-center">
          <div className="flex flex-wrap justify-center gap-1 w-40">
            {Array.from({ length: 20 }).map((_, i) => (
              <div
                key={i}
                className={`h-6 w-6 rounded-full transition-all duration-300 ${
                  active
                    ? i < 15 ? "bg-green-400/80" : i < 18 ? "bg-yellow-400/80" : "bg-red-400/80"
                    : "bg-white/30"
                }`}
                style={{ transitionDelay: active ? `${i * 30}ms` : "0ms" }}
              />
            ))}
          </div>
          <p className="mt-3 text-sm text-white/80">
            {active ? "👍 75人が好評価" : "100人が評価中..."}
          </p>
        </div>
      );

    default:
      return null;
  }
}

interface Tool {
  id: string;
  name: string;
  tagline: string;
  description: string;
  icon: string;
  color: string;
  visual: string;
  href?: string;
  ready: boolean;
}

/** ツールカード */
function ToolCard({
  tool,
  isHovered,
  onHover,
  onLeave,
}: {
  tool: Tool;
  isHovered: boolean;
  onHover: () => void;
  onLeave: () => void;
}) {
  const cardContent = (
    <>
      {/* バッジ */}
      <div
        className={`absolute right-4 top-4 z-10 rounded-full px-3 py-1 text-xs font-medium backdrop-blur ${
          tool.ready ? "bg-green-500/20 text-green-400" : "bg-white/10 text-white"
        }`}
      >
        {tool.ready ? "利用可能" : "準備中"}
      </div>

      {/* ビジュアルゾーン */}
      <div
        className={`flex h-48 items-center justify-center bg-gradient-to-br ${tool.color}`}
      >
        <ToolVisual type={tool.visual} active={isHovered} />
      </div>

      {/* コンテンツ */}
      <div className="p-6">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{tool.icon}</span>
          <h2 className="text-xl font-bold">{tool.name}</h2>
        </div>
        <p className="mt-1 text-sm font-medium text-gray-400">{tool.tagline}</p>
        <p className="mt-3 text-sm text-gray-500">{tool.description}</p>
        {tool.ready && (
          <p className="mt-4 text-sm font-medium text-cyan-400">今すぐ試す →</p>
        )}
      </div>
    </>
  );

  const className =
    "group relative overflow-hidden rounded-2xl bg-gray-900 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl block";

  if (tool.ready && tool.href) {
    return (
      <Link
        href={tool.href}
        className={className}
        onMouseEnter={onHover}
        onMouseLeave={onLeave}
      >
        {cardContent}
      </Link>
    );
  }

  return (
    <div className={className} onMouseEnter={onHover} onMouseLeave={onLeave}>
      {cardContent}
    </div>
  );
}
