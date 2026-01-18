import { NextRequest, NextResponse } from "next/server";
import { BetaAnalyticsDataClient } from "@google-analytics/data";

/**
 * GA4からアナリティクスデータを取得
 *
 * 顧客のGA4プロパティに接続してデータ取得
 * 認証: サービスアカウント or OAuth
 */

// 環境変数からサービスアカウント認証情報を取得
const analyticsDataClient = process.env.GOOGLE_APPLICATION_CREDENTIALS
  ? new BetaAnalyticsDataClient()
  : null;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { propertyId, startDate, endDate, metrics, dimensions } = body;

    if (!propertyId) {
      return NextResponse.json(
        { error: "propertyId is required" },
        { status: 400 }
      );
    }

    if (!analyticsDataClient) {
      // デモモード: サービスアカウント未設定の場合はサンプルデータを返す
      return NextResponse.json({
        data: generateSampleAnalyticsData(),
        isDemo: true,
      });
    }

    // GA4 Data API でレポート取得
    const [response] = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [
        {
          startDate: startDate || "7daysAgo",
          endDate: endDate || "today",
        },
      ],
      metrics: metrics || [
        { name: "screenPageViews" },
        { name: "sessions" },
        { name: "bounceRate" },
        { name: "averageSessionDuration" },
      ],
      dimensions: dimensions || [{ name: "date" }],
    });

    // レスポンス整形
    const rows = response.rows?.map((row) => ({
      dimensions: row.dimensionValues?.map((d) => d.value) || [],
      metrics: row.metricValues?.map((m) => m.value) || [],
    }));

    const totals = response.totals?.[0]?.metricValues?.map((m) => m.value) || [];

    return NextResponse.json({
      data: {
        rows,
        totals,
        rowCount: response.rowCount,
      },
    });
  } catch (error) {
    console.error("GA4 API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics data" },
      { status: 500 }
    );
  }
}

/**
 * サイト概要を取得（簡易版）
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get("propertyId");
    const days = parseInt(searchParams.get("days") || "7");

    if (!propertyId) {
      return NextResponse.json(
        { error: "propertyId is required" },
        { status: 400 }
      );
    }

    if (!analyticsDataClient) {
      return NextResponse.json({
        data: generateSampleAnalyticsData(),
        isDemo: true,
      });
    }

    // 今週のデータ
    const [currentResponse] = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [
        {
          startDate: `${days}daysAgo`,
          endDate: "today",
        },
      ],
      metrics: [
        { name: "screenPageViews" },
        { name: "sessions" },
        { name: "totalUsers" },
        { name: "bounceRate" },
        { name: "averageSessionDuration" },
      ],
    });

    // 前週のデータ（比較用）
    const [previousResponse] = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [
        {
          startDate: `${days * 2}daysAgo`,
          endDate: `${days + 1}daysAgo`,
        },
      ],
      metrics: [
        { name: "screenPageViews" },
        { name: "sessions" },
        { name: "totalUsers" },
        { name: "bounceRate" },
        { name: "averageSessionDuration" },
      ],
    });

    const current = currentResponse.totals?.[0]?.metricValues || [];
    const previous = previousResponse.totals?.[0]?.metricValues || [];

    const parseValue = (idx: number, response: typeof current) =>
      parseFloat(response[idx]?.value || "0");

    const calcChange = (idx: number) => {
      const curr = parseValue(idx, current);
      const prev = parseValue(idx, previous);
      if (prev === 0) return 0;
      return Math.round(((curr - prev) / prev) * 100);
    };

    return NextResponse.json({
      data: {
        pageViews: parseValue(0, current),
        pageViewsChange: calcChange(0),
        sessions: parseValue(1, current),
        sessionsChange: calcChange(1),
        users: parseValue(2, current),
        usersChange: calcChange(2),
        bounceRate: parseValue(3, current),
        bounceRateChange: calcChange(3),
        avgSessionDuration: parseValue(4, current),
        avgSessionDurationChange: calcChange(4),
      },
    });
  } catch (error) {
    console.error("GA4 API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics data" },
      { status: 500 }
    );
  }
}

function generateSampleAnalyticsData() {
  return {
    pageViews: 2450,
    pageViewsChange: 12,
    sessions: 1820,
    sessionsChange: 8,
    users: 1340,
    usersChange: 15,
    bounceRate: 42.5,
    bounceRateChange: -5,
    avgSessionDuration: 185,
    avgSessionDurationChange: 10,
    topPages: [
      { page: "/", views: 890 },
      { page: "/menu", views: 456 },
      { page: "/access", views: 234 },
      { page: "/contact", views: 178 },
    ],
  };
}
