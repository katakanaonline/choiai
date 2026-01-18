import { NextRequest, NextResponse } from "next/server";

/**
 * AEO（AI検索言及）チェックAPI
 *
 * POST /api/aeo/check
 * { storeName, storeType, location }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { storeName, storeType, location, demo } = body;

    if (!storeName) {
      return NextResponse.json(
        { error: "storeName is required" },
        { status: 400 }
      );
    }

    // デモモード: スクレイピングせずサンプルデータを返す
    if (demo) {
      return NextResponse.json({
        data: generateSampleAeoData(storeName),
      });
    }

    // 本番モード: スクレイパーを呼び出す（Railwayで実行推奨）
    // ローカル開発時はデモデータを返す
    if (process.env.NODE_ENV === "development") {
      return NextResponse.json({
        data: generateSampleAeoData(storeName),
        isDemo: true,
      });
    }

    // Railway上のスクレイパーAPIを呼び出す
    const scraperUrl = process.env.SCRAPER_API_URL;
    if (!scraperUrl) {
      return NextResponse.json({
        data: generateSampleAeoData(storeName),
        isDemo: true,
        message: "SCRAPER_API_URL not configured",
      });
    }

    const response = await fetch(`${scraperUrl}/aeo/check`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ storeName, storeType, location }),
    });

    if (!response.ok) {
      throw new Error("Scraper API error");
    }

    const result = await response.json();
    return NextResponse.json({ data: result });
  } catch (error) {
    console.error("AEO check error:", error);
    return NextResponse.json(
      { error: "Failed to check AEO" },
      { status: 500 }
    );
  }
}

/**
 * サンプルAEOデータを生成
 */
function generateSampleAeoData(storeName: string) {
  const score = Math.floor(Math.random() * 40) + 30; // 30-70

  return {
    storeName,
    overallScore: score,
    platformScores: {
      chatgpt: score + Math.floor(Math.random() * 20) - 10,
      perplexity: score + Math.floor(Math.random() * 20) - 10,
      gemini: score + Math.floor(Math.random() * 20) - 10,
    },
    queries: [
      {
        platform: "perplexity",
        query: "渋谷 ラーメン おすすめ",
        mentioned: score > 50,
        mentionType: score > 50 ? "direct" : "not_found",
        context: score > 50 ? `${storeName}は渋谷で人気のラーメン店です...` : undefined,
        competitors: ["一蘭 渋谷店", "一風堂 渋谷店", "家系ラーメン 渋谷"],
        timestamp: new Date().toISOString(),
      },
      {
        platform: "gemini",
        query: "渋谷で人気のラーメン",
        mentioned: score > 40,
        mentionType: score > 40 ? "indirect" : "not_found",
        context: score > 40 ? "渋谷には多くの人気ラーメン店があります..." : undefined,
        competitors: ["AFURI", "蒙古タンメン中本"],
        timestamp: new Date().toISOString(),
      },
    ],
    recommendations: generateRecommendations(score),
    checkedAt: new Date().toISOString(),
  };
}

function generateRecommendations(score: number): string[] {
  if (score < 40) {
    return [
      "AIにほとんど認識されていません。以下の対策を推奨します：",
      "1. Googleビジネスプロフィールを充実させる（営業時間、写真、説明文）",
      "2. 自社サイトにFAQページを追加し、構造化データを設定する",
      "3. 口コミ数を増やし、平均評価を4.0以上に維持する",
    ];
  } else if (score < 60) {
    return [
      "部分的にAIに認識されています。さらなる改善ポイント：",
      "1. 「〇〇（地域名）+ 業種」の検索で上位表示されるようSEO対策",
      "2. 専門性を示すブログ記事やコラムの追加",
      "3. 他メディア（食べログ、ホットペッパー等）での露出増加",
    ];
  } else {
    return [
      "良好なAEOスコアです。現状の施策を継続してください。",
      "競合との差別化ポイントを明確にし、ブランド認知を高めましょう。",
    ];
  }
}
