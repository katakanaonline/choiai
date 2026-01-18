/**
 * @choi/core - ちょいAIツール共通基盤
 *
 * シンプル設計:
 * - scraper: Webスクレイピング
 * - ai: AI処理（テキスト生成、埋め込み）
 * - notify: 通知（Slack, LINE, Email）
 * - ui: ビジュアライズコンポーネント
 */

// Scraper
export { BrowserPool, WebScraper, FeedParser } from "./scraper";
export { parseGoogleShoppingFeed, parseRssFeed, parseJsonFeed, parseCsvFeed } from "./scraper";

// AI
export { TextGenerator, Embedder } from "./ai";

// Notify
export { Notifier, sendSlackAlert, sendLineNotify, sendEmail } from "./notify";

// UI（ビジュアライズ）
export { ScoreGauge, RankingChart, TrendLine, SentimentRing } from "./ui";
