import { NextRequest, NextResponse } from "next/server";
import { rewriteForGBP } from "@/lib/gbp-rewrite";

/**
 * SNS投稿をGBP向けにリライト
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { platform, originalContent, storeName, storeType } = body;

    if (!platform || !originalContent || !storeName) {
      return NextResponse.json(
        { error: "platform, originalContent, and storeName are required" },
        { status: 400 }
      );
    }

    if (!["x", "instagram"].includes(platform)) {
      return NextResponse.json(
        { error: "platform must be 'x' or 'instagram'" },
        { status: 400 }
      );
    }

    const result = await rewriteForGBP({
      platform,
      originalContent,
      storeName,
      storeType,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Rewrite failed" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      rewrittenContent: result.rewrittenContent,
    });
  } catch (error) {
    console.error("Rewrite API error:", error);
    return NextResponse.json(
      { error: "Failed to rewrite content" },
      { status: 500 }
    );
  }
}
