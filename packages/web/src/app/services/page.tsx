"use client";

import { useState } from "react";

type Category = "all" | "meo" | "sales" | "report" | "communication";

interface Tool {
  id: string;
  name: string;
  tagline: string;
  description: string;
  features: string[];
  price: number;
  priceNote?: string;
  category: Category;
  icon: string;
  popular?: boolean;
  aiFeature: string;
}

const tools: Tool[] = [
  {
    id: "rank-watcher",
    name: "競合順位ウォッチャー",
    tagline: "Googleマップの順位変動を毎日自動チェック",
    description: "指定キーワードでの検索順位を毎日自動取得。順位が変動したらSlack/LINEに即通知。競合店舗の順位も同時監視できます。",
    features: ["毎日自動チェック", "順位変動アラート", "競合5店舗まで監視", "週次レポート自動生成"],
    price: 50000,
    category: "meo",
    icon: "🗺️",
    popular: true,
    aiFeature: "AIが順位変動の原因を分析・提案",
  },
  {
    id: "review-monitor",
    name: "口コミ監視くん",
    tagline: "新着口コミを即検知、AI返信案を自動生成",
    description: "Googleマップの口コミを24時間監視。新着口コミを検知したら即通知し、AIが最適な返信案を自動生成します。",
    features: ["新着口コミ即時通知", "AI返信案自動生成", "返信テンプレート管理", "評価推移グラフ"],
    price: 30000,
    category: "meo",
    icon: "⭐",
    popular: true,
    aiFeature: "AIが店舗のトーンに合わせた返信文を生成",
  },
  {
    id: "sns-to-gbp",
    name: "SNS→GBP自動リライト",
    tagline: "SNS投稿をGoogleビジネスプロフィールに自動変換",
    description: "X(Twitter)やInstagramの投稿を自動取得し、GBPに最適な形にAIがリライト。承認ボタン一つで投稿準備完了。",
    features: ["X/Instagram自動取得", "AIリライト", "画像自動リサイズ", "承認ワークフロー"],
    price: 80000,
    category: "meo",
    icon: "📱",
    aiFeature: "AIがプラットフォームに最適な文体に変換",
  },
  {
    id: "aeo-checker",
    name: "AEOスコアチェッカー",
    tagline: "ChatGPT・Perplexityでの言及度を数値化",
    description: "AI検索エンジンで御社がどれだけ言及されているかをスコア化。競合との比較や改善提案も自動生成します。",
    features: ["AI検索言及チェック", "競合比較スコア", "改善提案レポート", "月次トレンド分析"],
    price: 50000,
    category: "meo",
    icon: "🤖",
    aiFeature: "AIが言及されやすくなる施策を提案",
  },
  {
    id: "price-watcher",
    name: "競合価格ウォッチャー",
    tagline: "ECサイトの価格変動を毎日自動監視",
    description: "競合ECサイトの商品価格を毎日自動チェック。価格変更があれば即通知。価格推移グラフで傾向分析も可能。",
    features: ["毎日価格チェック", "変動アラート", "価格推移グラフ", "Excel自動出力"],
    price: 50000,
    category: "sales",
    icon: "💰",
    aiFeature: "AIが最適な価格帯を提案",
  },
  {
    id: "lead-collector",
    name: "営業リスト自動収集",
    tagline: "業種×地域で見込み客リストを自動生成",
    description: "指定した業種・地域の企業情報を自動収集。会社名、住所、電話番号、メールアドレスをリスト化します。",
    features: ["業種・地域指定", "連絡先自動取得", "CSV/Excel出力", "重複自動排除"],
    price: 30000,
    category: "sales",
    icon: "📋",
    aiFeature: "AIがアプローチ優先度をスコアリング",
  },
  {
    id: "form-sender",
    name: "問い合わせフォーム自動送信",
    tagline: "リストに沿って自動でアプローチ",
    description: "営業リストの企業に対して、問い合わせフォームから自動でメッセージ送信。送信結果もログ管理できます。",
    features: ["フォーム自動検出", "テンプレート管理", "送信ログ管理", "エラー自動リトライ"],
    price: 80000,
    category: "sales",
    icon: "📧",
    aiFeature: "AIが企業ごとにメッセージをパーソナライズ",
  },
  {
    id: "weekly-report",
    name: "週次レポート自動生成",
    tagline: "GA4+MEO+SNSをPDFにまとめて自動配信",
    description: "複数のデータソースから情報を自動収集し、見やすいPDFレポートを毎週自動生成・メール配信します。",
    features: ["GA4連携", "MEOデータ統合", "PDF自動生成", "メール自動配信"],
    price: 50000,
    category: "report",
    icon: "📊",
    popular: true,
    aiFeature: "AIが数値の変化を解説・改善提案",
  },
  {
    id: "notion-dashboard",
    name: "Notionダッシュボード構築",
    tagline: "社内データを見える化、チームで共有",
    description: "Notionに御社専用のダッシュボードを構築。売上、タスク、顧客情報などを一元管理できます。",
    features: ["カスタムDB設計", "自動データ連携", "チーム共有設定", "モバイル対応"],
    price: 30000,
    category: "report",
    icon: "📈",
    aiFeature: "AIがデータから気づきを自動抽出",
  },
  {
    id: "line-bot",
    name: "LINE自動応答ボット",
    tagline: "よくある質問にAIが自動返信",
    description: "LINE公式アカウントにAIボットを導入。営業時間外でも顧客対応が可能になり、スタッフの負担を軽減します。",
    features: ["24時間自動応答", "FAQ学習機能", "有人切り替え", "対応履歴管理"],
    price: 80000,
    category: "communication",
    icon: "💬",
    aiFeature: "AIが自然な会話で顧客対応",
  },
  {
    id: "review-request",
    name: "口コミ依頼自動化",
    tagline: "来店後に自動でレビュー依頼を送信",
    description: "来店・購入後のお客様に自動でレビュー依頼メール/SMSを送信。口コミ数アップを支援します。",
    features: ["自動送信設定", "テンプレート管理", "送信タイミング調整", "効果測定"],
    price: 50000,
    category: "communication",
    icon: "✉️",
    aiFeature: "AIが最適な依頼タイミングを学習",
  },
  {
    id: "custom-scraper",
    name: "カスタム情報収集ツール",
    tagline: "御社専用のデータ収集ツールを構築",
    description: "「このサイトのこの情報を毎日取得したい」にお応えします。完全カスタムで御社専用ツールを開発。",
    features: ["完全カスタム開発", "任意のサイト対応", "任意の形式で出力", "保守サポート"],
    price: 100000,
    priceNote: "要件により変動",
    category: "sales",
    icon: "🔧",
    aiFeature: "AIがデータを自動分類・整理",
  },
];

const categories = [
  { id: "all", name: "すべて", icon: "🎯" },
  { id: "meo", name: "MEO・集客", icon: "🗺️" },
  { id: "sales", name: "営業・リスト", icon: "📋" },
  { id: "report", name: "レポート・分析", icon: "📊" },
  { id: "communication", name: "顧客対応", icon: "💬" },
];

const customOptions = [
  { name: "監視対象追加", price: "+¥5,000/サイト", description: "競合サイトや監視キーワードを追加" },
  { name: "通知先追加", price: "+¥10,000", description: "Slack、LINE、メール等の通知先を追加" },
  { name: "レポートフォーマット変更", price: "+¥10,000", description: "御社フォーマットに合わせてカスタム" },
  { name: "月次保守サポート", price: "+¥10,000/月", description: "障害対応、軽微な修正、相談対応" },
];

export default function ServicesPage() {
  const [selectedCategory, setSelectedCategory] = useState<Category>("all");
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);

  const filteredTools = selectedCategory === "all"
    ? tools
    : tools.filter((t) => t.category === selectedCategory);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🛠️</span>
            <span className="font-bold text-xl">ちょいAIツール</span>
          </div>
          <a
            href="#contact"
            className="bg-blue-600 text-white px-6 py-2 rounded-full text-sm font-medium hover:bg-blue-700 transition"
          >
            無料相談
          </a>
        </div>
      </header>

      {/* ヒーロー */}
      <section className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="inline-block bg-yellow-400 text-yellow-900 text-sm font-bold px-4 py-1 rounded-full mb-6">
            1ヶ月無料でお試し → 気に入ったらカスタマイズ
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
            業務効率化AIツール
            <br />
            <span className="text-yellow-300">まず1ヶ月、無料で試せます</span>
          </h1>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            口コミ監視、競合チェック、レポート自動化...
            <br />
            使って価値を感じてから、カスタマイズをご検討ください
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <div className="bg-white/20 backdrop-blur px-4 py-2 rounded-full">
              ✅ 1ヶ月無料トライアル
            </div>
            <div className="bg-white/20 backdrop-blur px-4 py-2 rounded-full">
              ✅ 基本機能はずっと無料
            </div>
            <div className="bg-white/20 backdrop-blur px-4 py-2 rounded-full">
              ✅ カスタムは¥30,000〜
            </div>
          </div>
        </div>
      </section>

      {/* こんな課題ありませんか？ */}
      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-center mb-10">
            こんな課題、ありませんか？
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              { problem: "競合の価格変更に気づくのが遅い", solution: "毎日自動チェック、変更があれば即通知" },
              { problem: "口コミ返信に時間がかかる", solution: "AIが返信案を自動生成、コピペで完了" },
              { problem: "週次レポート作成が面倒", solution: "データ収集からPDF作成まで全自動" },
              { problem: "SaaSツールは高すぎる", solution: "買い切り型で月額費用なし" },
            ].map((item, i) => (
              <div key={i} className="flex gap-4 p-6 bg-gray-50 rounded-xl">
                <div className="text-3xl">😰</div>
                <div>
                  <p className="font-medium text-gray-900 mb-2">{item.problem}</p>
                  <p className="text-sm text-blue-600">→ {item.solution}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ツールメニュー */}
      <section className="py-16" id="menu">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold mb-4">ツールメニュー</h2>
            <p className="text-gray-600">
              必要なツールを選んでください。御社に合わせてカスタマイズします。
            </p>
          </div>

          {/* カテゴリフィルター */}
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id as Category)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                  selectedCategory === cat.id
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-600 hover:bg-gray-100"
                }`}
              >
                {cat.icon} {cat.name}
              </button>
            ))}
          </div>

          {/* ツールカード */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTools.map((tool) => (
              <div
                key={tool.id}
                className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition cursor-pointer"
                onClick={() => setSelectedTool(tool)}
              >
                {tool.popular && (
                  <div className="bg-orange-500 text-white text-xs font-bold text-center py-1">
                    人気
                  </div>
                )}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <span className="text-3xl">{tool.icon}</span>
                      <h3 className="font-bold text-lg mt-2">{tool.name}</h3>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-green-600">
                        1ヶ月無料
                      </div>
                      <div className="text-xs text-gray-500">
                        カスタム¥{(tool.price).toLocaleString()}〜
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">{tool.tagline}</p>
                  <div className="bg-purple-50 rounded-lg p-3 mb-4">
                    <div className="flex items-center gap-2 text-sm text-purple-700">
                      <span>🤖</span>
                      <span className="font-medium">AI機能:</span>
                    </div>
                    <p className="text-xs text-purple-600 mt-1">{tool.aiFeature}</p>
                  </div>
                  <button className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm hover:bg-blue-700 transition">
                    無料で試す →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* カスタマイズオプション */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-center mb-10">
            カスタマイズオプション
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {customOptions.map((opt, i) => (
              <div key={i} className="border border-gray-200 rounded-lg p-5 hover:border-blue-300 transition">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold">{opt.name}</h3>
                  <span className="text-blue-600 font-bold text-sm">{opt.price}</span>
                </div>
                <p className="text-sm text-gray-600">{opt.description}</p>
              </div>
            ))}
          </div>
          <p className="text-center text-sm text-gray-500 mt-6">
            ※ 上記以外のカスタマイズも対応可能です。お気軽にご相談ください。
          </p>
        </div>
      </section>

      {/* 料金体系 */}
      <section className="py-16 bg-gradient-to-br from-gray-900 to-gray-800 text-white">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-center mb-4">
            料金体系
          </h2>
          <p className="text-center text-gray-300 mb-10">
            まず無料で試す → 価値を感じたらカスタマイズ
          </p>

          <div className="grid md:grid-cols-4 gap-4 mb-12">
            {[
              {
                phase: "お試し",
                price: "¥0",
                description: "1ヶ月間、全機能を無料でお試し",
                highlight: true,
              },
              {
                phase: "継続利用",
                price: "¥0",
                description: "基本機能はそのまま無料で継続OK",
                note: "※API実費のみ",
              },
              {
                phase: "カスタマイズ",
                price: "¥30,000〜",
                description: "御社専用に機能・デザインを調整",
              },
              {
                phase: "保守サポート",
                price: "¥10,000/月",
                description: "障害対応・修正・ご相談対応",
              },
            ].map((item, i) => (
              <div
                key={i}
                className={`rounded-xl p-6 text-center ${
                  item.highlight
                    ? "bg-yellow-400 text-gray-900"
                    : "bg-white/10"
                }`}
              >
                <div className="text-sm font-medium mb-2 opacity-80">{item.phase}</div>
                <div className="text-3xl font-bold mb-2">{item.price}</div>
                <p className="text-sm opacity-80">{item.description}</p>
                {item.note && (
                  <p className="text-xs mt-2 opacity-60">{item.note}</p>
                )}
              </div>
            ))}
          </div>

          <div className="bg-white/10 rounded-xl p-6">
            <h3 className="font-bold text-center mb-4">なぜ無料で提供できるのか？</h3>
            <div className="grid md:grid-cols-3 gap-6 text-sm">
              <div className="text-center">
                <div className="text-2xl mb-2">🧩</div>
                <p className="text-gray-300">モジュール化済みで<br/>開発コストが低い</p>
              </div>
              <div className="text-center">
                <div className="text-2xl mb-2">📈</div>
                <p className="text-gray-300">無料ユーザーも<br/>実績・事例になる</p>
              </div>
              <div className="text-center">
                <div className="text-2xl mb-2">🤝</div>
                <p className="text-gray-300">カスタムや保守で<br/>長期的な関係構築</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 導入の流れ */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-center mb-10">導入の流れ</h2>
          <div className="flex flex-col md:flex-row gap-4">
            {[
              { step: "1", title: "無料相談", description: "課題をヒアリング、最適なツールをご提案", time: "30分" },
              { step: "2", title: "お見積り", description: "カスタマイズ内容を確定、正式見積もり", time: "1-2日" },
              { step: "3", title: "開発", description: "御社専用ツールを開発・テスト", time: "1-2週間" },
              { step: "4", title: "納品", description: "使い方レクチャー、運用開始", time: "1日" },
            ].map((item, i) => (
              <div key={i} className="flex-1 relative">
                <div className="bg-blue-50 rounded-xl p-6 text-center h-full">
                  <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold mx-auto mb-4">
                    {item.step}
                  </div>
                  <h3 className="font-bold mb-2">{item.title}</h3>
                  <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                  <span className="text-xs text-blue-600 font-medium">{item.time}</span>
                </div>
                {i < 3 && (
                  <div className="hidden md:block absolute top-1/2 -right-2 transform -translate-y-1/2 text-gray-300">
                    →
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-center mb-10">よくある質問</h2>
          <div className="space-y-4">
            {[
              {
                q: "本当に無料で使えますか？",
                a: "はい。1ヶ月間は完全無料でお試しいただけます。その後も基本機能はそのまま無料でお使いいただけます。カスタマイズや保守サポートをご希望の場合のみ有料となります。",
              },
              {
                q: "無料トライアル後、自動で課金されますか？",
                a: "いいえ。自動課金は一切ありません。カスタマイズ等をご希望の場合のみ、お見積りの上でご依頼いただく形です。",
              },
              {
                q: "プログラミングの知識がなくても使えますか？",
                a: "はい。セットアップはこちらで行い、操作はボタン操作だけで完結するようにします。",
              },
              {
                q: "API費用ってどれくらいかかりますか？",
                a: "ツールや使用量によりますが、月数百円〜数千円程度です。例えば口コミ監視くんでAI返信生成を月100回使っても約500円程度です。",
              },
              {
                q: "合わなかったらどうすればいいですか？",
                a: "そのままフェードアウトでOKです。解約手続きも不要、営業連絡も一切しません。",
              },
            ].map((item, i) => (
              <details key={i} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <summary className="p-5 cursor-pointer font-medium hover:bg-gray-50">
                  {item.q}
                </summary>
                <div className="px-5 pb-5 text-gray-600 text-sm">{item.a}</div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-br from-blue-600 to-indigo-700 text-white" id="contact">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">
            まず1ヶ月、無料で試してみませんか？
          </h2>
          <p className="text-blue-100 mb-8">
            「口コミ監視くん」「競合順位ウォッチャー」など<br />
            お好きなツールを1ヶ月無料でお試しいただけます
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="https://forms.gle/xxxxx"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-yellow-400 text-gray-900 px-8 py-4 rounded-full font-bold hover:bg-yellow-300 transition inline-flex items-center justify-center gap-2"
            >
              🚀 無料トライアルを始める
            </a>
            <a
              href="mailto:contact@example.com"
              className="bg-transparent border-2 border-white text-white px-8 py-4 rounded-full font-bold hover:bg-white/10 transition inline-flex items-center justify-center gap-2"
            >
              💬 まず相談してみる
            </a>
          </div>
          <p className="text-sm text-blue-200 mt-6">
            営業は一切しません。合わなければそのままフェードアウトでOKです。
          </p>
        </div>
      </section>

      {/* フッター */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🛠️</span>
              <span className="font-bold text-white">ちょいAIツール</span>
            </div>
            <div className="text-sm text-center md:text-right">
              <p>御社専用の業務効率化ツールを、AI搭載で安価に提供</p>
              <p className="mt-2">© 2026 All rights reserved.</p>
            </div>
          </div>
        </div>
      </footer>

      {/* ツール詳細モーダル */}
      {selectedTool && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedTool(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-4xl">{selectedTool.icon}</span>
                  <div>
                    <h3 className="font-bold text-xl">{selectedTool.name}</h3>
                    <p className="text-sm text-gray-500">{selectedTool.tagline}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedTool(null)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="mb-6 flex gap-4">
                <div className="flex-1 bg-green-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">無料</div>
                  <p className="text-xs text-gray-500">1ヶ月トライアル</p>
                </div>
                <div className="flex-1 bg-gray-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-gray-700">¥{selectedTool.price.toLocaleString()}〜</div>
                  <p className="text-xs text-gray-500">カスタマイズ時</p>
                </div>
              </div>

              <p className="text-gray-700 mb-6">{selectedTool.description}</p>

              <div className="mb-6">
                <h4 className="font-bold mb-3">主な機能</h4>
                <ul className="space-y-2">
                  {selectedTool.features.map((f, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <span className="text-green-500">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-purple-50 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-2 font-bold text-purple-700 mb-2">
                  <span>🤖</span>
                  AI機能
                </div>
                <p className="text-sm text-purple-600">{selectedTool.aiFeature}</p>
              </div>

              <a
                href="#contact"
                onClick={() => setSelectedTool(null)}
                className="block w-full bg-green-600 text-white text-center py-3 rounded-lg font-bold hover:bg-green-700 transition"
              >
                🚀 無料で試してみる
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
