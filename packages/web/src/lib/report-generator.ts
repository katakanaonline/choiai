import { WeeklyReportData } from "@/components/WeeklyReportDocument";
import { createServerSupabaseClient } from "./supabase-server";

/**
 * 週次レポート用のデータを集計する
 */
export async function generateWeeklyReportData(
  storeId: string
): Promise<WeeklyReportData | null> {
  const supabase = await createServerSupabaseClient();

  // 期間計算（過去7日間）
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 7);

  // 店舗情報取得
  const { data: store } = await supabase
    .from("stores")
    .select("*")
    .eq("id", storeId)
    .single();

  if (!store) {
    return null;
  }

  // MEO順位データ取得
  const { data: rankings } = await supabase
    .from("meo_rankings")
    .select("*")
    .eq("store_id", storeId)
    .gte("checked_at", startDate.toISOString())
    .order("checked_at", { ascending: false });

  // 口コミデータ取得
  const { data: reviews } = await supabase
    .from("reviews")
    .select("*")
    .eq("store_id", storeId)
    .gte("posted_at", startDate.toISOString())
    .order("posted_at", { ascending: false });

  // 全口コミの統計
  const { data: allReviews } = await supabase
    .from("reviews")
    .select("rating")
    .eq("store_id", storeId);

  // 改善提案取得
  const { data: suggestions } = await supabase
    .from("suggestions")
    .select("*")
    .eq("store_id", storeId)
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(5);

  // アラート取得
  const { data: alerts } = await supabase
    .from("alerts")
    .select("*")
    .eq("store_id", storeId)
    .eq("resolved", false)
    .order("created_at", { ascending: false })
    .limit(3);

  // キーワード別の順位集計
  const keywordRankings: Record<string, { current: number; previous: number }> = {};

  if (rankings && rankings.length > 0) {
    for (const r of rankings) {
      const keyword = r.keyword as string;
      if (!keywordRankings[keyword]) {
        keywordRankings[keyword] = { current: r.rank, previous: r.rank };
      }
    }
    // 7日前のデータがあれば previous を更新
    const oldRankings = rankings.filter(
      (r) => new Date(r.checked_at) < new Date(Date.now() - 6 * 24 * 60 * 60 * 1000)
    );
    for (const r of oldRankings) {
      const keyword = r.keyword as string;
      if (keywordRankings[keyword]) {
        keywordRankings[keyword].previous = r.rank;
      }
    }
  }

  // 平均評価計算
  const avgRating = allReviews && allReviews.length > 0
    ? allReviews.reduce((sum, r) => sum + (r.rating || 0), 0) / allReviews.length
    : 0;

  // メインキーワードの順位
  const mainKeyword = Object.keys(keywordRankings)[0] || "";
  const mainRanking = keywordRankings[mainKeyword] || { current: 0, previous: 0 };

  const reportData: WeeklyReportData = {
    storeName: store.name,
    storeType: store.store_type,
    reportPeriod: {
      start: formatDate(startDate),
      end: formatDate(endDate),
    },
    meo: {
      currentRank: mainRanking.current,
      previousRank: mainRanking.previous,
      keywords: Object.entries(keywordRankings).map(([keyword, ranks]) => ({
        keyword,
        rank: ranks.current,
        change: ranks.previous - ranks.current, // 下がった方がプラス
      })),
    },
    reviews: {
      totalCount: allReviews?.length || 0,
      newCount: reviews?.length || 0,
      averageRating: avgRating,
      recentReviews: (reviews || []).slice(0, 5).map((r) => ({
        rating: r.rating || 0,
        text: r.text || "",
        date: formatDate(new Date(r.posted_at)),
      })),
    },
    suggestions: (suggestions || []).map((s) => s.content as string),
    alerts: (alerts || []).map((a) => a.message as string),
  };

  return reportData;
}

/**
 * デモ用のサンプルレポートデータを生成
 */
export function generateSampleReportData(storeName: string): WeeklyReportData {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 7);

  return {
    storeName: storeName || "サンプル店舗",
    storeType: "飲食店",
    reportPeriod: {
      start: formatDate(startDate),
      end: formatDate(endDate),
    },
    meo: {
      currentRank: 3,
      previousRank: 5,
      keywords: [
        { keyword: "渋谷 ラーメン", rank: 3, change: 2 },
        { keyword: "渋谷 つけ麺", rank: 5, change: 1 },
        { keyword: "渋谷駅 ラーメン 深夜", rank: 2, change: 0 },
      ],
    },
    reviews: {
      totalCount: 127,
      newCount: 5,
      averageRating: 4.2,
      recentReviews: [
        {
          rating: 5,
          text: "麺のコシが最高でした！スープも濃厚で、また来たいと思います。深夜までやっているのも助かります。",
          date: formatDate(new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)),
        },
        {
          rating: 4,
          text: "美味しかったです。ただ、少し待ち時間が長かったのが残念。",
          date: formatDate(new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)),
        },
        {
          rating: 3,
          text: "普通に美味しいです。特筆することはないですが、リピートはアリ。",
          date: formatDate(new Date(Date.now() - 4 * 24 * 60 * 60 * 1000)),
        },
      ],
    },
    sns: {
      followers: 2340,
      followersChange: 45,
      engagementRate: 3.2,
      topPost: "新メニュー「激辛つけ麺」の投稿が582いいね獲得",
    },
    aeo: {
      mentionScore: 42,
      competitors: [
        { name: "○○ラーメン 渋谷店", score: 58 },
        { name: "△△軒 渋谷本店", score: 35 },
        { name: "当店", score: 42 },
      ],
    },
    suggestions: [
      "口コミ返信率が60%です。全ての口コミに返信すると評価向上が期待できます。",
      "「深夜営業」を強調した投稿を増やすと、検索流入が増える可能性があります。",
      "Instagramでのハッシュタグ「#渋谷グルメ」の使用を推奨します。",
    ],
    alerts: [
      "星2の口コミが1件ありました。早めの返信を推奨します。",
    ],
  };
}

function formatDate(date: Date): string {
  return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, "0")}/${String(date.getDate()).padStart(2, "0")}`;
}
