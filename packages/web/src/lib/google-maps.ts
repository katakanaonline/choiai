/**
 * Google Maps URL からの Place ID 抽出ユーティリティ
 *
 * ユーザーが Google Maps URL を貼り付けるだけで
 * Place ID を自動取得できるようにする
 */

export interface ExtractedPlaceInfo {
  placeId: string | null;
  name?: string;
  cid?: string; // Customer ID (別形式のID)
}

/**
 * Google Maps URL から Place ID を抽出
 *
 * 対応フォーマット:
 * 1. https://www.google.com/maps/place/.../.../data=...!1s0x60188...
 * 2. https://maps.google.com/?cid=12345678901234567890
 * 3. https://www.google.com/maps?cid=...
 * 4. https://www.google.com/maps/place/.../@.../data=!3m1!4b1!4m...!3m...!1s...
 * 5. https://goo.gl/maps/... (短縮URL - 要リダイレクト解決)
 * 6. place_id=... クエリパラメータ
 */
export function extractPlaceIdFromUrl(url: string): ExtractedPlaceInfo {
  const result: ExtractedPlaceInfo = { placeId: null };

  if (!url || typeof url !== "string") {
    return result;
  }

  // URL をトリム
  url = url.trim();

  try {
    // パターン1: data= パラメータ内の !1s0x... 形式
    // 例: data=!4m5!3m4!1s0x60188bfbd89f700b:0x277c49ba34ed38!8m2!3d35.6812...
    const dataMatch = url.match(/!1s(0x[a-f0-9]+:0x[a-f0-9]+)/i);
    if (dataMatch) {
      result.placeId = dataMatch[1];
      return result;
    }

    // パターン2: !3m...!1s... 形式（別のdata構造）
    const data3mMatch = url.match(/!3m\d+!1s([^!&]+)/);
    if (data3mMatch) {
      const decoded = decodeURIComponent(data3mMatch[1]);
      // 0x形式のPlace IDかチェック
      if (decoded.match(/^0x[a-f0-9]+:0x[a-f0-9]+$/i)) {
        result.placeId = decoded;
        return result;
      }
      // ChIJ形式のPlace ID
      if (decoded.startsWith("ChIJ")) {
        result.placeId = decoded;
        return result;
      }
    }

    // パターン3: place_id クエリパラメータ
    const placeIdMatch = url.match(/[?&]place_id=([^&]+)/);
    if (placeIdMatch) {
      result.placeId = decodeURIComponent(placeIdMatch[1]);
      return result;
    }

    // パターン4: cid (Customer ID) - Place IDに変換が必要
    const cidMatch = url.match(/[?&]cid=(\d+)/);
    if (cidMatch) {
      result.cid = cidMatch[1];
      // CIDはPlace IDとは別形式だが、API経由で使用可能
      return result;
    }

    // パターン5: ftid パラメータ
    const ftidMatch = url.match(/[?&]ftid=(0x[a-f0-9]+:0x[a-f0-9]+)/i);
    if (ftidMatch) {
      result.placeId = ftidMatch[1];
      return result;
    }

    // パターン6: /place/ の後の店舗名を抽出（参考情報として）
    const placeNameMatch = url.match(/\/place\/([^/@]+)/);
    if (placeNameMatch) {
      result.name = decodeURIComponent(placeNameMatch[1]).replace(/\+/g, " ");
    }
  } catch (error) {
    console.error("URL parsing error:", error);
  }

  return result;
}

/**
 * Place ID の形式を検証
 */
export function isValidPlaceId(placeId: string): boolean {
  if (!placeId) return false;

  // ChIJ形式 (例: ChIJN1t_tDeuEmsRUsoyG83frY4)
  if (/^ChIJ[a-zA-Z0-9_-]{20,}$/.test(placeId)) {
    return true;
  }

  // 0x形式 (例: 0x60188bfbd89f700b:0x277c49ba34ed38)
  if (/^0x[a-f0-9]+:0x[a-f0-9]+$/i.test(placeId)) {
    return true;
  }

  return false;
}

/**
 * URL が Google Maps の URL かどうかを判定
 */
export function isGoogleMapsUrl(url: string): boolean {
  if (!url) return false;

  const patterns = [
    /^https?:\/\/(www\.)?google\.(com|co\.[a-z]{2})\/maps/i,
    /^https?:\/\/maps\.google\.(com|co\.[a-z]{2})/i,
    /^https?:\/\/goo\.gl\/maps/i,
    /^https?:\/\/maps\.app\.goo\.gl/i,
  ];

  return patterns.some((pattern) => pattern.test(url));
}

/**
 * ユーザー入力を解析して Place ID を取得
 * URLでもPlace ID直接入力でも対応
 */
export function parseUserInput(input: string): ExtractedPlaceInfo {
  if (!input) {
    return { placeId: null };
  }

  input = input.trim();

  // 直接 Place ID が入力された場合
  if (isValidPlaceId(input)) {
    return { placeId: input };
  }

  // URL として解析
  if (isGoogleMapsUrl(input)) {
    return extractPlaceIdFromUrl(input);
  }

  // その他の場合は不明
  return { placeId: null };
}

/**
 * Place ID から店舗情報を取得
 *
 * NOTE: サーバーサイドでのみ使用可能
 * クライアントからは /api/places/details を使用すること
 *
 * @see ./google-maps-server.ts
 */
// fetchPlaceDetails is in google-maps-server.ts (server-only)

/**
 * 業種別おすすめキーワードテンプレート
 */
export const KEYWORD_TEMPLATES: Record<
  string,
  { label: string; keywords: string[] }
> = {
  ramen: {
    label: "ラーメン店",
    keywords: [
      "{地域} ラーメン",
      "{地域} つけ麺",
      "{地域} ラーメン おすすめ",
      "{地域} ラーメン 人気",
      "近くのラーメン屋",
    ],
  },
  cafe: {
    label: "カフェ",
    keywords: [
      "{地域} カフェ",
      "{地域} 喫茶店",
      "{地域} カフェ おしゃれ",
      "{地域} コーヒー",
      "近くのカフェ",
    ],
  },
  beauty: {
    label: "美容院・ヘアサロン",
    keywords: [
      "{地域} 美容院",
      "{地域} 美容室",
      "{地域} ヘアサロン",
      "{地域} カット 安い",
      "{地域} 美容院 おすすめ",
    ],
  },
  clinic: {
    label: "クリニック・病院",
    keywords: [
      "{地域} 内科",
      "{地域} 病院",
      "{地域} クリニック",
      "{地域} 皮膚科",
      "近くの病院",
    ],
  },
  dental: {
    label: "歯科",
    keywords: [
      "{地域} 歯医者",
      "{地域} 歯科",
      "{地域} 歯科 おすすめ",
      "{地域} 歯医者 痛くない",
      "近くの歯医者",
    ],
  },
  restaurant: {
    label: "レストラン・飲食店",
    keywords: [
      "{地域} ランチ",
      "{地域} ディナー",
      "{地域} レストラン",
      "{地域} グルメ",
      "{地域} 食事",
    ],
  },
  izakaya: {
    label: "居酒屋",
    keywords: [
      "{地域} 居酒屋",
      "{地域} 飲み屋",
      "{地域} 居酒屋 個室",
      "{地域} 飲み放題",
      "{地域} 居酒屋 安い",
    ],
  },
  gym: {
    label: "ジム・フィットネス",
    keywords: [
      "{地域} ジム",
      "{地域} フィットネス",
      "{地域} パーソナルジム",
      "{地域} スポーツジム",
      "{地域} 24時間ジム",
    ],
  },
  realestate: {
    label: "不動産",
    keywords: [
      "{地域} 不動産",
      "{地域} 賃貸",
      "{地域} マンション",
      "{地域} 不動産屋",
      "{地域} アパート",
    ],
  },
  custom: {
    label: "カスタム",
    keywords: [],
  },
};

/**
 * キーワードテンプレートを地域名で展開
 */
export function expandKeywordTemplate(
  templateKey: string,
  area: string
): string[] {
  const template = KEYWORD_TEMPLATES[templateKey];
  if (!template) return [];

  return template.keywords.map((kw) => kw.replace("{地域}", area));
}
