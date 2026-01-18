import { chromium, Browser, BrowserContext, Page } from "playwright";

/**
 * ブラウザプール - 共通基盤
 * 複数のスクレイピングタスクでブラウザインスタンスを効率的に共有
 */

export interface BrowserPoolOptions {
  headless?: boolean;
  proxy?: string;
  userAgent?: string;
  locale?: string;
  geolocation?: { latitude: number; longitude: number };
}

const DEFAULT_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

export class BrowserPool {
  private static instance: BrowserPool | null = null;
  private browser: Browser | null = null;
  private contexts: Map<string, BrowserContext> = new Map();

  private constructor() {}

  static getInstance(): BrowserPool {
    if (!BrowserPool.instance) {
      BrowserPool.instance = new BrowserPool();
    }
    return BrowserPool.instance;
  }

  async getBrowser(): Promise<Browser> {
    if (!this.browser || !this.browser.isConnected()) {
      this.browser = await chromium.launch({
        headless: process.env.HEADLESS !== "false",
      });
    }
    return this.browser;
  }

  async getContext(
    contextId: string,
    options: BrowserPoolOptions = {}
  ): Promise<BrowserContext> {
    if (this.contexts.has(contextId)) {
      return this.contexts.get(contextId)!;
    }

    const browser = await this.getBrowser();
    const context = await browser.newContext({
      userAgent: options.userAgent || DEFAULT_USER_AGENT,
      locale: options.locale || "ja-JP",
      geolocation: options.geolocation,
      permissions: options.geolocation ? ["geolocation"] : [],
      proxy: options.proxy ? { server: options.proxy } : undefined,
    });

    this.contexts.set(contextId, context);
    return context;
  }

  async getPage(contextId: string, options?: BrowserPoolOptions): Promise<Page> {
    const context = await this.getContext(contextId, options);
    return context.newPage();
  }

  async closeContext(contextId: string): Promise<void> {
    const context = this.contexts.get(contextId);
    if (context) {
      await context.close();
      this.contexts.delete(contextId);
    }
  }

  async closeAll(): Promise<void> {
    for (const [id, context] of this.contexts) {
      await context.close();
    }
    this.contexts.clear();

    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}

/**
 * セレクタのフォールバック試行
 */
export async function trySelectors(
  page: Page,
  selectors: string[],
  timeout = 5000
): Promise<string | null> {
  for (const selector of selectors) {
    try {
      await page.waitForSelector(selector, { timeout });
      return selector;
    } catch {
      continue;
    }
  }
  return null;
}

/**
 * 要素を見つける（複数セレクタ対応）
 */
export async function findElement(
  page: Page,
  selectors: string[]
): Promise<ReturnType<Page["$"]>> {
  for (const selector of selectors) {
    const element = await page.$(selector);
    if (element) return element;
  }
  return null;
}

/**
 * ページ内のテキストを取得
 */
export async function getTextContent(
  page: Page,
  selectors: string[]
): Promise<string | null> {
  const element = await findElement(page, selectors);
  if (!element) return null;
  return element.textContent();
}

/**
 * スクロールして全コンテンツ読み込み
 */
export async function scrollToBottom(
  page: Page,
  options: { maxScrolls?: number; delay?: number } = {}
): Promise<void> {
  const { maxScrolls = 10, delay = 1000 } = options;

  for (let i = 0; i < maxScrolls; i++) {
    const previousHeight = await page.evaluate(() => document.body.scrollHeight);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(delay);

    const newHeight = await page.evaluate(() => document.body.scrollHeight);
    if (newHeight === previousHeight) break;
  }
}

export default BrowserPool;
