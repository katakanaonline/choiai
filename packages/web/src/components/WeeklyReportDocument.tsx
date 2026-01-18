"use client";

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";

// 日本語フォント登録（Noto Sans JP）
Font.register({
  family: "NotoSansJP",
  fonts: [
    {
      src: "https://cdn.jsdelivr.net/npm/@fontsource/noto-sans-jp@5.0.1/files/noto-sans-jp-japanese-400-normal.woff",
      fontWeight: "normal",
    },
    {
      src: "https://cdn.jsdelivr.net/npm/@fontsource/noto-sans-jp@5.0.1/files/noto-sans-jp-japanese-700-normal.woff",
      fontWeight: "bold",
    },
  ],
});

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "NotoSansJP",
    fontSize: 10,
    backgroundColor: "#ffffff",
  },
  header: {
    marginBottom: 20,
    borderBottom: "2px solid #2563eb",
    paddingBottom: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1e40af",
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 12,
    color: "#6b7280",
  },
  storeName: {
    fontSize: 14,
    fontWeight: "bold",
    marginTop: 5,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#1e40af",
    marginBottom: 10,
    backgroundColor: "#eff6ff",
    padding: 8,
    borderRadius: 4,
  },
  row: {
    flexDirection: "row",
    borderBottom: "1px solid #e5e7eb",
    paddingVertical: 8,
  },
  label: {
    width: "40%",
    color: "#6b7280",
  },
  value: {
    width: "60%",
    fontWeight: "bold",
  },
  changePositive: {
    color: "#16a34a",
  },
  changeNegative: {
    color: "#dc2626",
  },
  highlightBox: {
    backgroundColor: "#fef3c7",
    padding: 12,
    borderRadius: 4,
    marginBottom: 10,
    borderLeft: "4px solid #f59e0b",
  },
  alertBox: {
    backgroundColor: "#fee2e2",
    padding: 12,
    borderRadius: 4,
    marginBottom: 10,
    borderLeft: "4px solid #ef4444",
  },
  successBox: {
    backgroundColor: "#dcfce7",
    padding: 12,
    borderRadius: 4,
    marginBottom: 10,
    borderLeft: "4px solid #22c55e",
  },
  suggestion: {
    marginBottom: 8,
    paddingLeft: 15,
  },
  bulletPoint: {
    position: "absolute",
    left: 0,
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: "center",
    color: "#9ca3af",
    fontSize: 8,
    borderTop: "1px solid #e5e7eb",
    paddingTop: 10,
  },
  twoColumn: {
    flexDirection: "row",
    gap: 20,
  },
  column: {
    flex: 1,
  },
  rankingItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
    borderBottom: "1px solid #f3f4f6",
  },
  reviewItem: {
    marginBottom: 10,
    padding: 8,
    backgroundColor: "#f9fafb",
    borderRadius: 4,
  },
  reviewRating: {
    color: "#f59e0b",
    marginBottom: 4,
  },
  reviewText: {
    fontSize: 9,
    color: "#374151",
  },
  reviewDate: {
    fontSize: 8,
    color: "#9ca3af",
    marginTop: 4,
  },
});

export interface WeeklyReportData {
  storeName: string;
  storeType?: string;
  reportPeriod: {
    start: string;
    end: string;
  };
  meo: {
    currentRank: number;
    previousRank: number;
    keywords: Array<{
      keyword: string;
      rank: number;
      change: number;
    }>;
  };
  reviews: {
    totalCount: number;
    newCount: number;
    averageRating: number;
    recentReviews: Array<{
      rating: number;
      text: string;
      date: string;
    }>;
  };
  seo?: {
    keywords: Array<{
      keyword: string;
      rank: number;
      change: number;
    }>;
    pageViews: number;
    pageViewsChange: number;
  };
  sns?: {
    followers: number;
    followersChange: number;
    engagementRate: number;
    topPost?: string;
  };
  aeo?: {
    mentionScore: number;
    competitors: Array<{
      name: string;
      score: number;
    }>;
  };
  suggestions: string[];
  alerts: string[];
}

interface WeeklyReportDocumentProps {
  data: WeeklyReportData;
}

function formatChange(change: number): string {
  if (change > 0) return `+${change}`;
  return change.toString();
}

function getChangeStyle(change: number) {
  if (change > 0) return styles.changePositive;
  if (change < 0) return styles.changeNegative;
  return {};
}

function getRatingStars(rating: number): string {
  const fullStars = Math.floor(rating);
  const hasHalf = rating % 1 >= 0.5;
  return "★".repeat(fullStars) + (hasHalf ? "☆" : "") + "☆".repeat(5 - fullStars - (hasHalf ? 1 : 0));
}

export function WeeklyReportDocument({ data }: WeeklyReportDocumentProps) {
  const rankChange = data.meo.previousRank - data.meo.currentRank;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* ヘッダー */}
        <View style={styles.header}>
          <Text style={styles.title}>週次マーケティングレポート</Text>
          <Text style={styles.subtitle}>
            {data.reportPeriod.start} 〜 {data.reportPeriod.end}
          </Text>
          <Text style={styles.storeName}>{data.storeName}</Text>
        </View>

        {/* アラート */}
        {data.alerts.length > 0 && (
          <View style={styles.alertBox}>
            <Text style={{ fontWeight: "bold", marginBottom: 5 }}>
              要確認事項
            </Text>
            {data.alerts.map((alert, i) => (
              <Text key={i} style={{ marginBottom: 2 }}>
                ・{alert}
              </Text>
            ))}
          </View>
        )}

        {/* サマリー */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>今週のサマリー</Text>
          <View style={styles.row}>
            <Text style={styles.label}>MEO順位（メインキーワード）</Text>
            <Text style={styles.value}>
              {data.meo.currentRank}位{" "}
              <Text style={getChangeStyle(rankChange)}>
                ({formatChange(rankChange)})
              </Text>
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>口コミ数</Text>
            <Text style={styles.value}>
              {data.reviews.totalCount}件（今週 +{data.reviews.newCount}件）
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>平均評価</Text>
            <Text style={styles.value}>
              {data.reviews.averageRating.toFixed(1)} / 5.0
            </Text>
          </View>
          {data.sns && (
            <View style={styles.row}>
              <Text style={styles.label}>SNSフォロワー</Text>
              <Text style={styles.value}>
                {data.sns.followers.toLocaleString()}人{" "}
                <Text style={getChangeStyle(data.sns.followersChange)}>
                  ({formatChange(data.sns.followersChange)})
                </Text>
              </Text>
            </View>
          )}
        </View>

        {/* MEO詳細 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>MEO（Googleマップ順位）</Text>
          {data.meo.keywords.map((kw, i) => (
            <View key={i} style={styles.rankingItem}>
              <Text>{kw.keyword}</Text>
              <Text>
                {kw.rank}位{" "}
                <Text style={getChangeStyle(-kw.change)}>
                  ({formatChange(-kw.change)})
                </Text>
              </Text>
            </View>
          ))}
        </View>

        {/* 口コミ */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>新着口コミ</Text>
          {data.reviews.recentReviews.length === 0 ? (
            <Text style={{ color: "#6b7280" }}>今週の新着口コミはありません</Text>
          ) : (
            data.reviews.recentReviews.slice(0, 3).map((review, i) => (
              <View key={i} style={styles.reviewItem}>
                <Text style={styles.reviewRating}>
                  {getRatingStars(review.rating)} ({review.rating})
                </Text>
                <Text style={styles.reviewText}>
                  {review.text.length > 100
                    ? review.text.slice(0, 100) + "..."
                    : review.text}
                </Text>
                <Text style={styles.reviewDate}>{review.date}</Text>
              </View>
            ))
          )}
        </View>

        {/* 改善提案 */}
        {data.suggestions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>今週の改善提案</Text>
            <View style={styles.successBox}>
              {data.suggestions.map((suggestion, i) => (
                <Text key={i} style={{ marginBottom: 4 }}>
                  {i + 1}. {suggestion}
                </Text>
              ))}
            </View>
          </View>
        )}

        {/* フッター */}
        <View style={styles.footer}>
          <Text>
            ちょいマーケ - MEO/SEO/SNS/AEO統合監視サービス | 自動生成レポート
          </Text>
        </View>
      </Page>

      {/* 2ページ目: SEO/AEO詳細（オプション） */}
      {(data.seo || data.aeo) && (
        <Page size="A4" style={styles.page}>
          <View style={styles.header}>
            <Text style={styles.title}>詳細データ</Text>
            <Text style={styles.storeName}>{data.storeName}</Text>
          </View>

          {/* SEO */}
          {data.seo && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>SEO（検索順位）</Text>
              <View style={styles.row}>
                <Text style={styles.label}>ページビュー</Text>
                <Text style={styles.value}>
                  {data.seo.pageViews.toLocaleString()}{" "}
                  <Text style={getChangeStyle(data.seo.pageViewsChange)}>
                    ({formatChange(data.seo.pageViewsChange)}%)
                  </Text>
                </Text>
              </View>
              {data.seo.keywords.map((kw, i) => (
                <View key={i} style={styles.rankingItem}>
                  <Text>{kw.keyword}</Text>
                  <Text>
                    {kw.rank}位{" "}
                    <Text style={getChangeStyle(-kw.change)}>
                      ({formatChange(-kw.change)})
                    </Text>
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* AEO */}
          {data.aeo && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>AEO（AI検索言及度）</Text>
              <View style={styles.highlightBox}>
                <Text style={{ fontWeight: "bold" }}>
                  AI言及スコア: {data.aeo.mentionScore}/100
                </Text>
                <Text style={{ marginTop: 5, fontSize: 9, color: "#6b7280" }}>
                  ChatGPT、Perplexity等でのお店の言及頻度を0-100でスコア化
                </Text>
              </View>
              <Text style={{ marginTop: 10, fontWeight: "bold", marginBottom: 5 }}>
                競合比較
              </Text>
              {data.aeo.competitors.map((comp, i) => (
                <View key={i} style={styles.rankingItem}>
                  <Text>{comp.name}</Text>
                  <Text>{comp.score}/100</Text>
                </View>
              ))}
            </View>
          )}

          <View style={styles.footer}>
            <Text>
              ちょいマーケ - MEO/SEO/SNS/AEO統合監視サービス | 自動生成レポート
            </Text>
          </View>
        </Page>
      )}
    </Document>
  );
}

export default WeeklyReportDocument;
