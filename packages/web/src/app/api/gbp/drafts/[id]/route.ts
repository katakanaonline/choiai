import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GBP下書きを更新（編集・承認・却下）
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createServerSupabaseClient();
    const body = await request.json();

    const { action, content, scheduledAt } = body;

    let updateData: Record<string, unknown> = {};

    switch (action) {
      case "approve":
        updateData = {
          status: "approved",
          rewritten_content: content,
        };
        break;

      case "reject":
        updateData = {
          status: "rejected",
        };
        break;

      case "edit":
        updateData = {
          rewritten_content: content,
        };
        break;

      case "schedule":
        updateData = {
          scheduled_at: scheduledAt,
        };
        break;

      case "markPosted":
        updateData = {
          status: "posted",
          posted_at: new Date().toISOString(),
        };
        break;

      default:
        return NextResponse.json(
          { error: "Invalid action" },
          { status: 400 }
        );
    }

    const { data, error } = await supabase
      .from("gbp_drafts")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Update draft error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ draft: data });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Failed to update draft" },
      { status: 500 }
    );
  }
}

/**
 * GBP下書きを削除
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createServerSupabaseClient();

    const { error } = await supabase
      .from("gbp_drafts")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Delete draft error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Failed to delete draft" },
      { status: 500 }
    );
  }
}
