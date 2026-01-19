/**
 * ブラウザプール管理モジュール
 *
 * Playwrightブラウザインスタンスを効率的に再利用し、
 * リソース消費を抑えながら安定したスクレイピングを実現
 *
 * 使用方法:
 *   const pool = await BrowserPool.getInstance();
 *   const context = await pool.getContext({ headless: true, location: { latitude: 35.68, longitude: 139.69 } });
 *   const page = await context.newPage();
 *   // ... スクレイピング処理
 *   await page.close();
 *   // 終了時
 *   await pool.close();
 */

import { chromium, Browser, BrowserContext, Page } from "playwright";

// 環境変数からheadless設定を取得（デフォルトはtrue = 本番モード）
export const HEADLESS_DEFAULT = process.env.HEADLESS !== "false";

export interface GeoLocation {
  latitude: number;
  longitude: number;
}

export interface BrowserPoolOptions {
  headless?: boolean;
  location?: GeoLocation;
  locale?: string;
  userAgent?: string;
}

// 東京駅付近（デフォルト位置）
const DEFAULT_LOCATION: GeoLocation = {
  latitude: 35.6812,
  longitude: 139.7671,
};

const DEFAULT_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

/**
 * ブラウザプール管理クラス
 *
 * シングルトンパターンでブラウザインスタンスを管理
 * 一定回数使用後に自動リサイクルしてメモリリークを防止
 */
export class BrowserPool {
  private static instance: BrowserPool | null = null;
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private useCount = 0;
  private readonly maxUseCount: number;
  private lastOptions: BrowserPoolOptions | null = null;

  /**
   * @param maxUseCount ブラウザをリサイクルするまでの使用回数（デフォルト10）
   */
  private constructor(maxUseCount = 10) {
    this.maxUseCount = maxUseCount;
  }

  /**
   * シングルトンインスタンスを取得
   */
  static async getInstance(maxUseCount = 10): Promise<BrowserPool> {
    if (!BrowserPool.instance) {
      BrowserPool.instance = new BrowserPool(maxUseCount);
    }
    return BrowserPool.instance;
  }

  /**
   * インスタンスをリセット（テスト用）
   */
  static resetInstance(): void {
    if (BrowserPool.instance) {
      BrowserPool.instance.close().catch(console.error);
      BrowserPool.instance = null;
    }
  }

  /**
   * ブラウザコンテキストを取得
   *
   * @param options ブラウザオプション
   * @returns BrowserContext
   */
  async getContext(options: BrowserPoolOptions = {}): Promise<BrowserContext> {
    const {
      headless = HEADLESS_DEFAULT,
      location = DEFAULT_LOCATION,
      locale = "ja-JP",
      userAgent = DEFAULT_USER_AGENT,
    } = options;

    // 使用回数超過、またはブラウザがない場合は新規作成
    const needsNewBrowser =
      !this.browser ||
      this.useCount >= this.maxUseCount ||
      this.hasHeadlessMismatch(headless);

    if (needsNewBrowser) {
      await this.closeBrowser();
      this.browser = await chromium.launch({
        headless,
        args: [
          "--lang=ja-JP",
          "--disable-blink-features=AutomationControlled",
          "--disable-features=IsolateOrigins,site-per-process",
        ],
      });
      this.useCount = 0;
      this.lastOptions = { headless };
    }

    // コンテキストは毎回新規作成（クッキー/セッション分離）
    if (this.context) {
      try {
        await this.context.close();
      } catch {
        // 既に閉じている場合は無視
      }
    }

    this.context = await this.browser!.newContext({
      locale,
      geolocation: location,
      permissions: ["geolocation"],
      userAgent,
      viewport: { width: 1280, height: 720 },
      deviceScaleFactor: 1,
    });

    this.useCount++;
    return this.context;
  }

  /**
   * headless設定が変わったか確認
   */
  private hasHeadlessMismatch(headless: boolean): boolean {
    return this.lastOptions !== null && this.lastOptions.headless !== headless;
  }

  /**
   * ブラウザのみを閉じる（コンテキストは維持）
   */
  private async closeBrowser(): Promise<void> {
    if (this.context) {
      try {
        await this.context.close();
      } catch {
        // 無視
      }
      this.context = null;
    }
    if (this.browser) {
      try {
        await this.browser.close();
      } catch {
        // 無視
      }
      this.browser = null;
    }
  }

  /**
   * すべてのリソースを解放
   */
  async close(): Promise<void> {
    await this.closeBrowser();
    this.useCount = 0;
    this.lastOptions = null;
  }

  /**
   * 現在の使用回数を取得
   */
  getUseCount(): number {
    return this.useCount;
  }

  /**
   * ブラウザが起動しているか確認
   */
  isRunning(): boolean {
    return this.browser !== null;
  }
}

/**
 * 複数のセレクタを試して最初にマッチしたものを返す
 *
 * Googleなどの動的サイトではセレクタが変わることがあるため、
 * 複数の候補を用意してフォールバックする
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
 * 複数のセレクタから最初に見つかった要素を返す
 */
export async function findElement(
  page: Page,
  selectors: string[]
): Promise<Awaited<ReturnType<Page["$"]>>> {
  for (const selector of selectors) {
    try {
      const el = await page.$(selector);
      if (el) return el;
    } catch {
      continue;
    }
  }
  return null;
}

/**
 * ブラウザプールをクリーンアップ
 */
export async function cleanup(): Promise<void> {
  const pool = await BrowserPool.getInstance();
  await pool.close();
}

export default BrowserPool;
