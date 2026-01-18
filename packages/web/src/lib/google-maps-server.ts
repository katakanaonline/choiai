/**
 * Google Maps サーバーサイド専用ユーティリティ
 *
 * IMPORTANT: このファイルはサーバーサイドでのみ使用すること
 * クライアントコンポーネントからimportしないこと
 */

import "server-only";

/**
 * Place ID から店舗情報を取得
 * Google Places API を使用（サーバーサイドのみ）
 *
 * 必要な環境変数: GOOGLE_PLACES_API_KEY
 */
export async function fetchPlaceDetails(
  placeId: string
): Promise<{
  name: string;
  address: string;
  rating?: number;
  reviewCount?: number;
  location?: { lat: number; lng: number };
} | null> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;

  if (!apiKey) {
    console.warn("GOOGLE_PLACES_API_KEY is not set - place details will not be fetched");
    return null;
  }

  try {
    const url = new URL("https://maps.googleapis.com/maps/api/place/details/json");
    url.searchParams.set("place_id", placeId);
    url.searchParams.set("fields", "name,formatted_address,rating,user_ratings_total,geometry");
    url.searchParams.set("language", "ja");
    url.searchParams.set("key", apiKey);

    const response = await fetch(url.toString());
    const data = await response.json();

    if (data.status === "OK" && data.result) {
      return {
        name: data.result.name,
        address: data.result.formatted_address,
        rating: data.result.rating,
        reviewCount: data.result.user_ratings_total,
        location: data.result.geometry?.location,
      };
    }

    if (data.status === "INVALID_REQUEST") {
      console.error("Invalid Place ID:", placeId);
    } else if (data.status !== "OK") {
      console.error("Places API error:", data.status, data.error_message);
    }
  } catch (error) {
    console.error("Places API fetch error:", error);
  }

  return null;
}

/**
 * 住所から緯度経度を取得（Nominatim API - 無料）
 */
export async function geocodeAddress(address: string): Promise<{
  latitude: number;
  longitude: number;
} | null> {
  try {
    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("format", "json");
    url.searchParams.set("q", address);
    url.searchParams.set("limit", "1");

    const response = await fetch(url.toString(), {
      headers: { "User-Agent": "choi-marketing/1.0" },
    });

    const data = (await response.json()) as Array<{ lat: string; lon: string }>;

    if (data && data.length > 0) {
      return {
        latitude: parseFloat(data[0].lat),
        longitude: parseFloat(data[0].lon),
      };
    }
  } catch (error) {
    console.error("Geocoding error:", error);
  }

  return null;
}

/**
 * AI による口コミ返信案を生成
 * Claude API を使用（サーバーサイドのみ）
 *
 * 必要な環境変数: ANTHROPIC_API_KEY
 */
export async function generateReviewReply(
  reviewText: string,
  rating: number,
  storeName: string
): Promise<string | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    console.warn("ANTHROPIC_API_KEY is not set - review replies will not be generated");
    return null;
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-haiku-20240307",
        max_tokens: 300,
        messages: [
          {
            role: "user",
            content: `あなたは「${storeName}」の店舗オーナーです。
以下の口コミに対する返信文を作成してください。

口コミ評価: ${"★".repeat(rating)}${"☆".repeat(5 - rating)}
口コミ内容: ${reviewText}

要件:
- 丁寧で感謝の気持ちを込めた文章
- 具体的な内容に言及する
- 100文字程度
- 低評価の場合は改善への姿勢を示す

返信文のみを出力してください。`,
          },
        ],
      }),
    });

    const data = await response.json();

    if (data.content && data.content[0]?.text) {
      return data.content[0].text.trim();
    }
  } catch (error) {
    console.error("Review reply generation error:", error);
  }

  return null;
}
