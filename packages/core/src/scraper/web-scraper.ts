import { Page } from "playwright";
import BrowserPool, {
  BrowserPoolOptions,
  trySelectors,
  findElement,
  getTextContent,
  scrollToBottom,
} from "./browser-pool";

/**
 * WebScraper - 汎用スクレイピングモジュール
 */

export interface ScrapeResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

export interface ScrapeOptions extends BrowserPoolOptions {
  contextId?: string;
  timeout?: number;
  waitForSelector?: string;
  scrollToLoad?: boolean;
}

export class WebScraper {
  private pool: BrowserPool;

  constructor() {
    this.pool = BrowserPool.getInstance();
  }

  /**
   * URLからHTMLを取得
   */
  async fetchHtml(url: string, options: ScrapeOptions = {}): Promise<ScrapeResult<string>> {
    const contextId = options.contextId || `scrape-${Date.now()}`;
    let page: Page | null = null;

    try {
      page = await this.pool.getPage(contextId, options);
      await page.goto(url, {
        waitUntil: "networkidle",
        timeout: options.timeout || 30000,
      });

      if (options.waitForSelector) {
        await page.waitForSelector(options.waitForSelector, {
          timeout: options.timeout || 10000,
        });
      }

      if (options.scrollToLoad) {
        await scrollToBottom(page);
      }

      const html = await page.content();

      return {
        success: true,
        data: html,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      };
    } finally {
      if (page) await page.close();
    }
  }

  /**
   * セレクタで要素を抽出
   */
  async scrapeElements<T>(
    url: string,
    extractor: (page: Page) => Promise<T>,
    options: ScrapeOptions = {}
  ): Promise<ScrapeResult<T>> {
    const contextId = options.contextId || `scrape-${Date.now()}`;
    let page: Page | null = null;

    try {
      page = await this.pool.getPage(contextId, options);
      await page.goto(url, {
        waitUntil: "networkidle",
        timeout: options.timeout || 30000,
      });

      if (options.waitForSelector) {
        await page.waitForSelector(options.waitForSelector, {
          timeout: options.timeout || 10000,
        });
      }

      if (options.scrollToLoad) {
        await scrollToBottom(page);
      }

      const data = await extractor(page);

      return {
        success: true,
        data,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      };
    } finally {
      if (page) await page.close();
    }
  }

  /**
   * テーブルデータを抽出
   */
  async scrapeTable(
    url: string,
    tableSelector: string,
    options: ScrapeOptions = {}
  ): Promise<ScrapeResult<string[][]>> {
    return this.scrapeElements(
      url,
      async (page) => {
        const rows = await page.$$(`${tableSelector} tr`);
        const data: string[][] = [];

        for (const row of rows) {
          const cells = await row.$$("td, th");
          const rowData: string[] = [];

          for (const cell of cells) {
            const text = await cell.textContent();
            rowData.push(text?.trim() || "");
          }

          if (rowData.length > 0) {
            data.push(rowData);
          }
        }

        return data;
      },
      options
    );
  }

  /**
   * リンク一覧を抽出
   */
  async scrapeLinks(
    url: string,
    linkSelector: string = "a",
    options: ScrapeOptions = {}
  ): Promise<ScrapeResult<Array<{ text: string; href: string }>>> {
    return this.scrapeElements(
      url,
      async (page) => {
        const links = await page.$$(linkSelector);
        const data: Array<{ text: string; href: string }> = [];

        for (const link of links) {
          const text = await link.textContent();
          const href = await link.getAttribute("href");

          if (href) {
            data.push({
              text: text?.trim() || "",
              href,
            });
          }
        }

        return data;
      },
      options
    );
  }

  /**
   * JSON-LDを抽出（構造化データ）
   */
  async scrapeJsonLd(
    url: string,
    options: ScrapeOptions = {}
  ): Promise<ScrapeResult<object[]>> {
    return this.scrapeElements(
      url,
      async (page) => {
        const scripts = await page.$$('script[type="application/ld+json"]');
        const data: object[] = [];

        for (const script of scripts) {
          const content = await script.textContent();
          if (content) {
            try {
              data.push(JSON.parse(content));
            } catch {
              // Invalid JSON, skip
            }
          }
        }

        return data;
      },
      options
    );
  }

  /**
   * クリーンアップ
   */
  async close(): Promise<void> {
    await this.pool.closeAll();
  }
}

// ユーティリティ関数をエクスポート
export { trySelectors, findElement, getTextContent, scrollToBottom };

export default WebScraper;
