import { NextRequest, NextResponse } from "next/server";
import { fetchPlaceDetails } from "@/lib/google-maps-server";
import { isValidPlaceId } from "@/lib/google-maps";

/**
 * Place ID から店舗詳細を取得する API
 *
 * Google Places API を使用（サーバーサイドのみ）
 * APIキーがクライアントに露出しないようにする
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const placeId = searchParams.get("placeId");

  if (!placeId) {
    return NextResponse.json(
      { error: "placeId is required" },
      { status: 400 }
    );
  }

  // Place ID の形式を検証
  if (!isValidPlaceId(placeId)) {
    return NextResponse.json(
      { error: "Invalid Place ID format" },
      { status: 400 }
    );
  }

  try {
    const details = await fetchPlaceDetails(placeId);

    if (!details) {
      return NextResponse.json(
        { error: "Failed to fetch place details or Places API not configured" },
        { status: 503 }
      );
    }

    return NextResponse.json(details);
  } catch (error) {
    console.error("Places API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch place details" },
      { status: 500 }
    );
  }
}
