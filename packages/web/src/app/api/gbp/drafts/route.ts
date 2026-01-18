import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

/**
 * GBP下書き一覧を取得
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get("storeId");
    const status = searchParams.get("status");

    let query = supabase
      .from("gbp_drafts")
      .select(`
        *,
        sns_posts (
          platform,
          content,
          media_urls,
          posted_at
        )
      `)
      .order("created_at", { ascending: false });

    if (storeId) {
      query = query.eq("store_id", storeId);
    }

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query.limit(50);

    if (error) {
      console.error("Fetch drafts error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // レスポンス形式を整形
    const drafts = data?.map((d) => ({
      id: d.id,
      snsPostId: d.sns_post_id,
      platform: d.sns_posts?.platform || "x",
      originalContent: d.original_content,
      rewrittenContent: d.rewritten_content,
      mediaUrls: d.sns_posts?.media_urls || [],
      postedAt: d.sns_posts?.posted_at || d.created_at,
      status: d.status,
      scheduledAt: d.scheduled_at,
      createdAt: d.created_at,
    }));

    return NextResponse.json({ drafts });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch drafts" },
      { status: 500 }
    );
  }
}

/**
 * GBP下書きを作成
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const body = await request.json();

    const { storeId, snsPostId, originalContent, rewrittenContent } = body;

    if (!storeId || !originalContent || !rewrittenContent) {
      return NextResponse.json(
        { error: "storeId, originalContent, and rewrittenContent are required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("gbp_drafts")
      .insert({
        store_id: storeId,
        sns_post_id: snsPostId || null,
        original_content: originalContent,
        rewritten_content: rewrittenContent,
        status: "pending",
      })
      .select()
      .single();

    if (error) {
      console.error("Create draft error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ draft: data });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Failed to create draft" },
      { status: 500 }
    );
  }
}
