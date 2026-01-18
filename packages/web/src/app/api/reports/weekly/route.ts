import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { WeeklyReportDocument } from "@/components/WeeklyReportDocument";
import {
  generateWeeklyReportData,
  generateSampleReportData,
} from "@/lib/report-generator";
import { createElement } from "react";

/**
 * 週次レポートPDFを生成
 *
 * GET /api/reports/weekly?storeId=xxx
 * GET /api/reports/weekly?demo=true&storeName=xxx
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get("storeId");
    const demo = searchParams.get("demo") === "true";
    const storeName = searchParams.get("storeName") || "サンプル店舗";

    let reportData;

    if (demo) {
      // デモモード: サンプルデータでPDF生成
      reportData = generateSampleReportData(storeName);
    } else if (storeId) {
      // 本番モード: DBからデータ取得
      reportData = await generateWeeklyReportData(storeId);

      if (!reportData) {
        return NextResponse.json(
          { error: "Store not found" },
          { status: 404 }
        );
      }
    } else {
      return NextResponse.json(
        { error: "storeId or demo=true is required" },
        { status: 400 }
      );
    }

    // React PDFでPDF生成
    const pdfBuffer = await renderToBuffer(
      createElement(WeeklyReportDocument, { data: reportData })
    );

    // 日付をファイル名に含める
    const today = new Date();
    const dateStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, "0")}${String(today.getDate()).padStart(2, "0")}`;
    const safeStoreName = reportData.storeName.replace(/[^a-zA-Z0-9\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/g, "_");
    const filename = `weekly_report_${safeStoreName}_${dateStr}.pdf`;

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"`,
      },
    });
  } catch (error) {
    console.error("Report generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate report" },
      { status: 500 }
    );
  }
}

/**
 * レポートデータをJSON形式で取得（プレビュー用）
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { storeId, demo, storeName } = body;

    let reportData;

    if (demo) {
      reportData = generateSampleReportData(storeName || "サンプル店舗");
    } else if (storeId) {
      reportData = await generateWeeklyReportData(storeId);

      if (!reportData) {
        return NextResponse.json(
          { error: "Store not found" },
          { status: 404 }
        );
      }
    } else {
      return NextResponse.json(
        { error: "storeId or demo is required" },
        { status: 400 }
      );
    }

    return NextResponse.json({ data: reportData });
  } catch (error) {
    console.error("Report data error:", error);
    return NextResponse.json(
      { error: "Failed to get report data" },
      { status: 500 }
    );
  }
}
