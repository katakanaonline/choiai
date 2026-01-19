/**
 * ちょいマーケ MEO監視 PoC テスト
 *
 * 実際の店舗データで機能を検証する
 *
 * 使用方法:
 *   npm run test              # 全テスト実行
 *   npm run test ranking      # 順位チェックのみ
 *   npm run test reviews      # 口コミ取得のみ
 *   npm run test geocode      # 住所→座標変換テスト
 *
 * 環境変数:
 *   HEADLESS=false  # ブラウザを表示してデバッグ
 */

import {
  checkMapsRanking,
  checkMultipleKeywords,
  geocodeAddress,
  cleanup as cleanupRanking,
  type GeoLocation,
} from "./maps-ranking.js";
import {
  fetchReviews,
  detectNewReviews,
  cleanup as cleanupReviews,
} from "./maps-reviews.js";

// テスト用の店舗設定
const TEST_STORE = {
  name: "一蘭 新宿中央東口店",
  address: "東京都新宿区新宿3-34-11",
  placeId: "", // 実際のPlace IDがあれば設定
  keywords: ["新宿 ラーメン", "新宿 とんこつ", "新宿駅 ラーメン"],
};

// ヘッダー表示
function printHeader(title: string) {
  console.log("\n" + "=".repeat(50));
  console.log(title);
  console.log("=".repeat(50));
}

// 結果サマリー表示
function printSummary(passed: number, failed: number) {
  console.log("\n" + "=".repeat(50));
  console.log(`テスト結果: ${passed} passed, ${failed} failed`);
  console.log("=".repeat(50) + "\n");
}

/**
 * テスト1: 住所→座標変換（Geocoding）
 */
async function testGeocode(): Promise<boolean> {
  printHeader("テスト1: 住所→座標変換（Geocoding）");

  console.log(`\n住所: ${TEST_STORE.address}`);

  const location = await geocodeAddress(TEST_STORE.address);

  if (location) {
    console.log(`\n結果: 成功`);
    console.log(`  緯度: ${location.latitude}`);
    console.log(`  経度: ${location.longitude}`);
    return true;
  } else {
    console.log(`\n結果: 失敗（座標を取得できませんでした）`);
    return false;
  }
}

/**
 * テスト2: 順位チェック（単一キーワード）
 */
async function testRankingCheck(): Promise<boolean> {
  printHeader("テスト2: 順位チェック（単一キーワード）");

  const keyword = TEST_STORE.keywords[0];
  console.log(`\nキーワード: ${keyword}`);
  console.log(`対象店舗: ${TEST_STORE.name}`);

  // 住所から座標を取得
  const location = await geocodeAddress(TEST_STORE.address);
  console.log(`検索地点: ${location ? `${location.latitude}, ${location.longitude}` : "デフォルト（東京）"}`);

  const result = await checkMapsRanking({
    keyword,
    targetPlaceId: TEST_STORE.placeId,
    targetName: "一蘭",
    location: location || undefined,
    maxResults: 10,
  });

  if (result.error) {
    console.log(`\n結果: エラー`);
    console.log(`  ${result.error}`);
    return false;
  }

  console.log(`\n結果: 成功`);
  console.log(`  順位: ${result.rank ?? "圏外(10位以下)"}`);
  console.log(`  取得件数: ${result.totalResults}`);
  console.log(`\nトップ10:`);
  result.topResults.forEach((r) => {
    const mark = r.name.includes("一蘭") ? " <-- TARGET" : "";
    const placeIdShort = r.placeId ? `[${r.placeId.slice(0, 10)}...]` : "";
    console.log(`  ${r.rank}. ${r.name} (★${r.rating || "-"}) ${placeIdShort}${mark}`);
  });

  return result.totalResults > 0;
}

/**
 * テスト3: 複数キーワード一括チェック
 */
async function testMultipleKeywords(): Promise<boolean> {
  printHeader("テスト3: 複数キーワード一括チェック");

  console.log(`\nキーワード: ${TEST_STORE.keywords.join(", ")}`);
  console.log(`対象店舗: ${TEST_STORE.name}`);

  const results = await checkMultipleKeywords(
    TEST_STORE.keywords,
    TEST_STORE.placeId,
    "一蘭"
  );

  console.log(`\n結果サマリー:`);
  console.log("-".repeat(40));

  let successCount = 0;
  results.forEach((r) => {
    const status = r.error ? `エラー: ${r.error}` : `${r.rank ?? "圏外"}位`;
    console.log(`  ${r.keyword}: ${status}`);
    if (!r.error) successCount++;
  });

  return successCount === results.length;
}

/**
 * テスト4: 口コミ取得
 */
async function testReviewFetch(): Promise<boolean> {
  printHeader("テスト4: 口コミ取得");

  console.log(`\n店舗: ${TEST_STORE.name}`);

  const result = await fetchReviews({
    placeName: TEST_STORE.name,
    maxReviews: 5,
  });

  if (result.error) {
    console.log(`\n結果: エラー`);
    console.log(`  ${result.error}`);
    return false;
  }

  console.log(`\n結果: 成功`);
  console.log(`  店舗名: ${result.placeName}`);
  console.log(`  平均評価: ${result.averageRating}`);
  console.log(`  総口コミ数: ${result.totalReviews}`);
  console.log(`\n最新${result.reviews.length}件:`);
  result.reviews.forEach((r, i) => {
    console.log(`\n  ${i + 1}. ${"★".repeat(r.rating)}${"☆".repeat(5 - r.rating)} ${r.relativeTime}`);
    console.log(`     ${r.authorName}`);
    console.log(`     ${r.text.slice(0, 80)}${r.text.length > 80 ? "..." : ""}`);
  });

  return result.reviews.length > 0;
}

/**
 * テスト5: 新着口コミ検出
 */
async function testNewReviewDetection(): Promise<boolean> {
  printHeader("テスト5: 新着口コミ検出");

  // 最初の取得
  console.log("\n1回目の取得...");
  const first = await fetchReviews({
    placeName: TEST_STORE.name,
    maxReviews: 5,
  });

  if (first.error) {
    console.log(`エラー: ${first.error}`);
    return false;
  }

  const previousIds = first.reviews.map((r) => r.id);
  console.log(`  取得した口コミID: ${previousIds.length}件`);
  previousIds.forEach((id) => console.log(`    - ${id}`));

  // 2回目の取得（シミュレーション）
  console.log("\n2回目の取得...");
  const second = await fetchReviews({
    placeName: TEST_STORE.name,
    maxReviews: 5,
  });

  if (second.error) {
    console.log(`エラー: ${second.error}`);
    return false;
  }

  // 新着検出
  const newReviews = detectNewReviews(second.reviews, previousIds);
  console.log(`\n新着口コミ: ${newReviews.length}件`);

  if (newReviews.length > 0) {
    newReviews.forEach((r) => {
      console.log(`  - ${r.authorName}: ${"★".repeat(r.rating)}`);
    });
  } else {
    console.log("  (同一データのため新着なし - 正常動作)");
  }

  return true; // 新着がなくても正常
}

// メイン実行
async function main() {
  console.log("\n");
  console.log("╔══════════════════════════════════════════════════╗");
  console.log("║     ちょいマーケ MEO監視 PoC テスト              ║");
  console.log("╚══════════════════════════════════════════════════╝");
  console.log(`\nHEADLESS: ${process.env.HEADLESS !== "false" ? "true (本番モード)" : "false (デバッグモード)"}`);

  const testMode = process.argv[2] || "all";
  let passed = 0;
  let failed = 0;

  try {
    switch (testMode) {
      case "geocode":
        (await testGeocode()) ? passed++ : failed++;
        break;

      case "ranking":
        (await testRankingCheck()) ? passed++ : failed++;
        break;

      case "keywords":
        (await testMultipleKeywords()) ? passed++ : failed++;
        break;

      case "reviews":
        (await testReviewFetch()) ? passed++ : failed++;
        break;

      case "detect":
        (await testNewReviewDetection()) ? passed++ : failed++;
        break;

      case "all":
      default:
        // Geocode
        (await testGeocode()) ? passed++ : failed++;

        // Ranking（単一）
        (await testRankingCheck()) ? passed++ : failed++;

        // Reviews
        (await testReviewFetch()) ? passed++ : failed++;

        break;
    }

    printSummary(passed, failed);
    process.exit(failed > 0 ? 1 : 0);
  } catch (error) {
    console.error("\n致命的エラー:", error);
    process.exit(1);
  } finally {
    // クリーンアップ
    await cleanupRanking();
    await cleanupReviews();
  }
}

main();
