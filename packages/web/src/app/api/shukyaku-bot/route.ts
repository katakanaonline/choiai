import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { rewriteForPlatforms, generateDailyTips } from "@/lib/ai-rewrite";

// export const runtime = "edge"; // Anthropic SDKはNode.jsランタイムが必要

interface PostRequest {
  content: string;
  imageUrl?: string;
  platforms: string[];
  storeId?: string;
}

interface PostResponse {
  success: boolean;
  postId: string;
  rewrites: {
    platform: string;
    original: string;
    rewritten: string;
  }[];
  message: string;
}

interface ReportResponse {
  date: string;
  discoveryCount: number;
  totalViews: number;
  topPost?: {
    content: string;
    views: number;
  };
  sentiment: number;
  tips: string[];
  recentPosts: {
    id: string;
    content: string;
    platforms: string[];
    createdAt: string;
    stats?: {
      views: number;
      reactions: number;
    };
  }[];
}

export async function POST(req: NextRequest) {
  try {
    const body: PostRequest = await req.json();
    const { content, imageUrl, platforms, storeId } = body;

    if (!content?.trim()) {
      return NextResponse.json(
        { error: "投稿内容を入力してください" },
        { status: 400 }
      );
    }

    if (!platforms || platforms.length === 0) {
      return NextResponse.json(
        { error: "配信先を1つ以上選択してください" },
        { status: 400 }
      );
    }

    // AIで各プラットフォーム向けにリライト
    const validPlatforms = platforms.filter(
      (p): p is "gbp" | "x" | "instagram" =>
        ["gbp", "x", "instagram"].includes(p)
    );

    let rewrites: { platform: string; original: string; rewritten: string }[] =
      [];

    try {
      rewrites = await rewriteForPlatforms(content, validPlatforms);
    } catch (error) {
      console.error("Rewrite error:", error);
      // リライト失敗時は元のコンテンツを使用
      rewrites = validPlatforms.map((p) => ({
        platform: p,
        original: content,
        rewritten: content,
      }));
    }

    // Supabaseに保存（環境変数がある場合のみ）
    let postId = `post_${Date.now()}`;

    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const supabase = createServerClient();

        // 投稿を保存
        const { data: post, error: postError } = await supabase
          .from("shukyaku_posts")
          .insert({
            store_id: storeId || null,
            content,
            image_url: imageUrl || null,
            platforms,
            status: "pending",
          })
          .select()
          .single();

        if (postError) {
          console.error("Post save error:", postError);
        } else if (post) {
          postId = post.id;

          // リライト結果を保存
          const rewriteInserts = rewrites.map((r) => ({
            post_id: post.id,
            platform: r.platform,
            original_content: r.original,
            rewritten_content: r.rewritten,
            approved: false,
          }));

          const { error: rewriteError } = await supabase
            .from("shukyaku_rewrites")
            .insert(rewriteInserts);

          if (rewriteError) {
            console.error("Rewrite save error:", rewriteError);
          }
        }
      } catch (dbError) {
        console.error("Database error:", dbError);
      }
    }

    const response: PostResponse = {
      success: true,
      postId,
      rewrites,
      message: `${platforms.length}つのプラットフォーム向けに最適化しました`,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Shukyaku-bot post error:", error);
    return NextResponse.json(
      { error: "投稿中にエラーが発生しました" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const storeId = searchParams.get("storeId");

    let recentPosts: ReportResponse["recentPosts"] = [];
    let discoveryCount = 0;
    let totalViews = 0;
    let sentiment = 75;
    let tips: string[] = [];
    let topPost: ReportResponse["topPost"] | undefined;

    // Supabaseからデータ取得（環境変数がある場合のみ）
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const supabase = createServerClient();

        // 最近の投稿を取得
        let query = supabase
          .from("shukyaku_posts")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(10);

        if (storeId) {
          query = query.eq("store_id", storeId);
        }

        const { data: posts, error: postsError } = await query;

        if (!postsError && posts) {
          recentPosts = posts.map((p) => ({
            id: p.id,
            content: p.content,
            platforms: p.platforms,
            createdAt: p.created_at,
            stats: p.platform_results
              ? {
                  views: Object.values(p.platform_results as Record<string, { views?: number }>).reduce(
                    (sum, r) => sum + (r.views || 0),
                    0
                  ),
                  reactions: 0,
                }
              : undefined,
          }));

          // 統計を計算
          totalViews = recentPosts.reduce(
            (sum, p) => sum + (p.stats?.views || 0),
            0
          );
          discoveryCount = Math.floor(totalViews * 0.15); // 15%が新規発見と仮定

          // トップ投稿を特定
          const topPostData = recentPosts.reduce(
            (top, p) =>
              (p.stats?.views || 0) > (top?.stats?.views || 0) ? p : top,
            recentPosts[0]
          );

          if (topPostData?.stats?.views) {
            topPost = {
              content: topPostData.content,
              views: topPostData.stats.views,
            };
          }
        }

        // 今日のレポートを取得または生成
        const today = new Date().toISOString().split("T")[0];
        const { data: existingReport } = await supabase
          .from("shukyaku_reports")
          .select("*")
          .eq("date", today)
          .maybeSingle();

        if (existingReport) {
          discoveryCount = existingReport.discovery_count;
          totalViews = existingReport.total_views;
          sentiment = existingReport.sentiment_score;
          tips = existingReport.tips || [];
        }
      } catch (dbError) {
        console.error("Database error:", dbError);
      }
    }

    // ヒントが空の場合はAIで生成
    if (tips.length === 0) {
      try {
        const postsForTips = recentPosts
          .filter((p) => p.stats)
          .map((p) => ({
            content: p.content,
            views: p.stats?.views || 0,
            reactions: p.stats?.reactions || 0,
          }));

        tips = await generateDailyTips(postsForTips);
      } catch (error) {
        console.error("Tips generation error:", error);
        tips = [
          "写真付き投稿は反応が2倍になる傾向があります",
          "14時〜16時の投稿がよく見られています",
          "口コミへの返信率が上がると検索順位も上がります",
        ];
      }
    }

    // デモ用のフォールバックデータ
    if (recentPosts.length === 0) {
      recentPosts = [
        {
          id: "demo-1",
          content: "今日のランチは自家製ミートソースパスタ。トマトは地元農家から直送です",
          platforms: ["gbp", "x", "instagram"],
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          stats: { views: 45, reactions: 12 },
        },
        {
          id: "demo-2",
          content: "週末限定デザート始まりました。チーズケーキ、売り切れ御免です！",
          platforms: ["gbp", "x"],
          createdAt: new Date(Date.now() - 172800000).toISOString(),
          stats: { views: 89, reactions: 23 },
        },
      ];
      discoveryCount = 15;
      totalViews = 134;
      sentiment = 85;
      topPost = {
        content: "週末限定デザート始まりました",
        views: 89,
      };
    }

    const report: ReportResponse = {
      date: new Date().toISOString().split("T")[0],
      discoveryCount,
      totalViews,
      topPost,
      sentiment,
      tips,
      recentPosts,
    };

    return NextResponse.json(report);
  } catch (error) {
    console.error("Shukyaku-bot report error:", error);
    return NextResponse.json(
      { error: "レポート取得中にエラーが発生しました" },
      { status: 500 }
    );
  }
}
