/**
 * FeedParser - Google Shopping Feed / RSS / JSON Feed パーサー
 */

export interface Product {
  id: string;
  title: string;
  description?: string;
  link: string;
  imageUrl?: string;
  price?: number;
  currency?: string;
  availability?: string;
  brand?: string;
  category?: string;
  customAttributes?: Record<string, string>;
}

export interface FeedParseResult {
  success: boolean;
  products?: Product[];
  itemCount?: number;
  error?: string;
  feedType?: "google_shopping" | "rss" | "json" | "csv";
}

/**
 * Google Shopping Feed (XML) をパース
 */
export async function parseGoogleShoppingFeed(
  feedUrl: string
): Promise<FeedParseResult> {
  try {
    const response = await fetch(feedUrl);
    if (!response.ok) {
      return { success: false, error: `HTTP ${response.status}` };
    }

    const xml = await response.text();
    const products = parseShoppingXml(xml);

    return {
      success: true,
      products,
      itemCount: products.length,
      feedType: "google_shopping",
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Google Shopping XML をパース（DOMParser使用）
 */
function parseShoppingXml(xml: string): Product[] {
  const products: Product[] = [];

  // シンプルな正規表現ベースのパース（Node.js環境用）
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;

  while ((match = itemRegex.exec(xml)) !== null) {
    const itemXml = match[1];
    const product = parseItemXml(itemXml);
    if (product) {
      products.push(product);
    }
  }

  // entry形式（Atom）もサポート
  const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
  while ((match = entryRegex.exec(xml)) !== null) {
    const itemXml = match[1];
    const product = parseItemXml(itemXml);
    if (product) {
      products.push(product);
    }
  }

  return products;
}

function parseItemXml(itemXml: string): Product | null {
  const getValue = (tag: string): string | undefined => {
    // g:price, g:title等の名前空間付きタグに対応
    const patterns = [
      new RegExp(`<g:${tag}[^>]*>([^<]*)<\/g:${tag}>`, "i"),
      new RegExp(`<${tag}[^>]*>([^<]*)<\/${tag}>`, "i"),
      new RegExp(`<${tag}[^>]*><!\\\[CDATA\\\[([^\\\]]*)\\\]\\\]><\/${tag}>`, "i"),
    ];

    for (const pattern of patterns) {
      const match = itemXml.match(pattern);
      if (match) return match[1].trim();
    }
    return undefined;
  };

  const id = getValue("id") || getValue("sku");
  const title = getValue("title");
  const link = getValue("link") || getValue("url");

  if (!id || !title) return null;

  const priceStr = getValue("price") || getValue("sale_price");
  let price: number | undefined;
  let currency: string | undefined;

  if (priceStr) {
    const priceMatch = priceStr.match(/([0-9,.]+)\s*([A-Z]{3})?/);
    if (priceMatch) {
      price = parseFloat(priceMatch[1].replace(/,/g, ""));
      currency = priceMatch[2] || "JPY";
    }
  }

  return {
    id,
    title,
    description: getValue("description"),
    link: link || "",
    imageUrl: getValue("image_link") || getValue("image"),
    price,
    currency,
    availability: getValue("availability"),
    brand: getValue("brand"),
    category: getValue("product_type") || getValue("category"),
  };
}

/**
 * RSS Feed をパース
 */
export async function parseRssFeed(
  feedUrl: string
): Promise<FeedParseResult> {
  try {
    const response = await fetch(feedUrl);
    if (!response.ok) {
      return { success: false, error: `HTTP ${response.status}` };
    }

    const xml = await response.text();
    const products: Product[] = [];

    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;
    let index = 0;

    while ((match = itemRegex.exec(xml)) !== null) {
      const itemXml = match[1];

      const getValue = (tag: string): string | undefined => {
        const pattern = new RegExp(`<${tag}[^>]*>([^<]*)<\/${tag}>`, "i");
        const m = itemXml.match(pattern);
        return m ? m[1].trim() : undefined;
      };

      const title = getValue("title");
      const link = getValue("link");

      if (title) {
        products.push({
          id: `rss-${index++}`,
          title,
          description: getValue("description"),
          link: link || "",
        });
      }
    }

    return {
      success: true,
      products,
      itemCount: products.length,
      feedType: "rss",
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * JSON Feed をパース
 */
export async function parseJsonFeed(
  feedUrl: string,
  options: {
    itemsPath?: string;
    mapping?: Record<keyof Product, string>;
  } = {}
): Promise<FeedParseResult> {
  try {
    const response = await fetch(feedUrl);
    if (!response.ok) {
      return { success: false, error: `HTTP ${response.status}` };
    }

    const json = await response.json();

    // items配列を取得
    let items = json;
    if (options.itemsPath) {
      const paths = options.itemsPath.split(".");
      for (const path of paths) {
        items = items?.[path];
      }
    }

    if (!Array.isArray(items)) {
      return { success: false, error: "Items not found in JSON" };
    }

    const mapping = options.mapping || {
      id: "id",
      title: "title",
      description: "description",
      link: "link",
      imageUrl: "image",
      price: "price",
      currency: "currency",
      brand: "brand",
      category: "category",
    };

    const products: Product[] = items.map((item, index) => ({
      id: String(item[mapping.id] || index),
      title: item[mapping.title] || "",
      description: item[mapping.description],
      link: item[mapping.link] || "",
      imageUrl: item[mapping.imageUrl],
      price: typeof item[mapping.price] === "number" ? item[mapping.price] : undefined,
      currency: item[mapping.currency],
      brand: item[mapping.brand],
      category: item[mapping.category],
    }));

    return {
      success: true,
      products,
      itemCount: products.length,
      feedType: "json",
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * CSV をパース
 */
export async function parseCsvFeed(
  csvContent: string,
  options: {
    delimiter?: string;
    mapping?: Record<keyof Product, string>;
  } = {}
): Promise<FeedParseResult> {
  try {
    const delimiter = options.delimiter || ",";
    const lines = csvContent.split("\n").filter((line) => line.trim());

    if (lines.length < 2) {
      return { success: false, error: "CSV too short" };
    }

    const headers = lines[0].split(delimiter).map((h) => h.trim().toLowerCase());
    const products: Product[] = [];

    const mapping = options.mapping || {
      id: "id",
      title: "title",
      description: "description",
      link: "link",
      imageUrl: "image_link",
      price: "price",
      currency: "currency",
      brand: "brand",
      category: "category",
    };

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(delimiter);
      const item: Record<string, string> = {};

      headers.forEach((header, index) => {
        item[header] = values[index]?.trim() || "";
      });

      const getField = (key: keyof Product): string | undefined => {
        const mappedKey = mapping[key];
        return mappedKey ? item[mappedKey.toLowerCase()] : undefined;
      };

      const id = getField("id");
      const title = getField("title");

      if (id && title) {
        const priceStr = getField("price");
        products.push({
          id,
          title,
          description: getField("description"),
          link: getField("link") || "",
          imageUrl: getField("imageUrl"),
          price: priceStr ? parseFloat(priceStr.replace(/[^0-9.]/g, "")) : undefined,
          currency: getField("currency") || "JPY",
          brand: getField("brand"),
          category: getField("category"),
        });
      }
    }

    return {
      success: true,
      products,
      itemCount: products.length,
      feedType: "csv",
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export default {
  parseGoogleShoppingFeed,
  parseRssFeed,
  parseJsonFeed,
  parseCsvFeed,
};
