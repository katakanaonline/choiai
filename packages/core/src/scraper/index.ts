/**
 * Scraper モジュール - エクスポート
 */

export { default as BrowserPool } from "./browser-pool";
export {
  BrowserPoolOptions,
  trySelectors,
  findElement,
  getTextContent,
  scrollToBottom,
} from "./browser-pool";

export { default as WebScraper } from "./web-scraper";
export {
  ScrapeResult,
  ScrapeOptions,
} from "./web-scraper";

export { default as FeedParser } from "./feed-parser";
export {
  Product,
  FeedParseResult,
  parseGoogleShoppingFeed,
  parseRssFeed,
  parseJsonFeed,
  parseCsvFeed,
} from "./feed-parser";
