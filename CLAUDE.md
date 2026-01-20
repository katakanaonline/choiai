# ちょいAIツール - 業務効率化AIツール受託開発

## プロジェクト概要

中小企業向けの「ちょっとAIが入った便利ツール」をメニュー形式で提供。
1ヶ月無料トライアル → カスタマイズ受託のビジネスモデル。

**コンセプト**: 「まず無料で試す → 価値を感じたらカスタマイズ」

---

## ビジネスモデル（2026/01/18 転換）

### 料金体系

| フェーズ | 内容 | 料金 |
|---------|------|------|
| **お試し** | 1ヶ月無料トライアル | ¥0 |
| **継続** | 基本機能そのまま利用 | ¥0（API実費のみ） |
| **カスタム** | 御社専用に調整 | ¥30,000〜 |
| **保守** | 障害対応・修正・相談 | ¥10,000/月 |

### 納品形態

- **メイン**: Vercel代理デプロイ + 管理画面
- **ライト版**: Google Apps Script + スプレッドシート

### 営業チャネル

1. 知り合い店舗に無料導入（実績作り）
2. ランサーズ/クラウドワークスでパッケージ出品
3. X/noteで発信
4. Googleマップ直営業（口コミ少ない店舗にDM）

---

## 旧コンセプト（参考）

中小企業向けのマーケティング監視・改善提案SaaS。
月額5万円で MEO + SEO + SNS + AEO を一括監視。
→ **SaaSは初期ハードル高いため、受託+無料トライアルモデルに転換**

---

## サービス設計

### ターゲット顧客
- 地域密着型ビジネス（飲食店、美容院、クリニック、不動産等）
- マーケ専任がいない中小企業
- 月5〜10万円のマーケ予算がある事業者

### 料金プラン

| プラン | 月額 | 内容 |
|-------|------|------|
| **ライト** | 20,000円 | MEOのみ監視+提案 |
| **スタンダード** | 50,000円 | MEO+SEO+SNS+AEO |
| **プレミアム** | 80,000円 | 上記 + 改善代行（月5時間） |

---

## 機能要件

### 1. MEO（Googleマップ最適化）

#### 監視機能
- [ ] Googleマップでの検索順位チェック（指定キーワード×地域）
- [ ] 口コミの新着監視
- [ ] 競合店舗の順位・評価追跡
- [ ] Googleビジネスプロフィールの情報変更検知

#### 改善提案
- [ ] 口コミ返信文の自動生成
- [ ] 投稿コンテンツの提案
- [ ] プロフィール改善ポイントの指摘

#### SNS→GBP投稿流用機能（差別化）
- [ ] X/Instagram投稿の自動監視
- [ ] GBPに適した投稿の自動抽出・リライト
- [ ] 最適タイミング（営業開始前、週末前等）での自動投稿
- [ ] 画像の自動リサイズ・最適化

**ペイン**: SNSとGBP両方に投稿するのは手間
**ソリューション**: SNS投稿を自動でGBPにも流用

### 2. SEO（検索エンジン最適化）

#### 監視機能
- [ ] 主要キーワードの検索順位チェック
- [ ] Google Search Console連携（CTR、表示回数、順位）
- [ ] 被リンク監視
- [ ] Core Web Vitals（PageSpeed Insights API）

#### 改善提案
- [ ] タイトル/メタディスクリプション改善案
- [ ] コンテンツ追加・リライト提案
- [ ] 内部リンク最適化提案

### 3. SNS（ソーシャルメディア）

#### 監視機能
- [ ] フォロワー数推移
- [ ] エンゲージメント率（いいね、コメント、シェア）
- [ ] 投稿パフォーマンス分析
- [ ] 競合アカウント監視

#### 改善提案
- [ ] 最適投稿時間の提案
- [ ] 投稿コンテンツ案の生成
- [ ] ハッシュタグ提案

### 4. AEO（AI検索エンジン最適化）★差別化ポイント

#### 監視機能
- [ ] ChatGPTでの言及チェック
- [ ] Perplexityでの言及チェック
- [ ] Google AI Overviewでの表示チェック
- [ ] 競合との比較スコアリング

#### 改善提案
- [ ] FAQ構造化データの提案
- [ ] AIに拾われやすい文章構造の提案
- [ ] 専門性・権威性を高めるコンテンツ提案

---

## 技術アーキテクチャ

```
┌─────────────────────────────────────────────────────────┐
│  データ収集層（Railway + cron-job.org）                 │
├─────────────────────────────────────────────────────────┤
│  Playwright / Puppeteer                                │
│  - MEO: Googleマップスクレイピング                     │
│  - SEO: 検索結果スクレイピング + Search Console API    │
│  - SNS: 各プラットフォームAPI / スクレイピング          │
│  - AEO: AI検索エンジンへのクエリ                       │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  データ保存層                                          │
├─────────────────────────────────────────────────────────┤
│  Supabase (PostgreSQL)                                 │
│  - 顧客情報                                            │
│  - 監視設定（キーワード、URL、アカウント）              │
│  - 収集データ（順位、口コミ、エンゲージメント）         │
│  - 改善提案履歴                                        │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  分析・提案生成層                                       │
├─────────────────────────────────────────────────────────┤
│  Claude API / Gemini API                               │
│  - データ分析・トレンド検出                            │
│  - 改善提案文生成                                      │
│  - 週次サマリー生成                                    │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  配信層                                                │
├─────────────────────────────────────────────────────────┤
│  Next.js (Vercel)                                      │
│  - 顧客向けダッシュボード                              │
│  - 管理画面                                            │
│                                                        │
│  通知                                                  │
│  - アラート: ntfy.sh / LINE / Slack                    │
│  - レポート: SendGrid (PDF添付)                        │
└─────────────────────────────────────────────────────────┘
```

---

## 技術スタック

| レイヤー | 技術 | 備考 |
|---------|------|------|
| フロントエンド | Next.js 14 (App Router) | Vercelデプロイ |
| 認証 | Supabase Auth | マジックリンク or Google |
| DB | Supabase (PostgreSQL) | 無料枠→Pro |
| スクレイピング | Playwright | Railwayで実行 |
| 定期実行 | cron-job.org | 無料 |
| AI分析 | Claude API | 改善提案生成 |
| グラフ | Recharts | ダッシュボード用 |
| 通知 | ntfy.sh, SendGrid | アラート、レポート |
| PDF生成 | @react-pdf/renderer | 週次レポート |

---

## データベース設計（概要）

### テーブル構成

```sql
-- 顧客
customers (
  id, name, email, plan, created_at
)

-- 監視対象
monitor_targets (
  id, customer_id, type, -- 'meo' | 'seo' | 'sns' | 'aeo'
  config JSONB,          -- キーワード、URL、アカウント等
  created_at
)

-- 収集データ
collected_data (
  id, target_id, data JSONB, collected_at
)

-- 改善提案
suggestions (
  id, customer_id, type, content, status, created_at
)

-- アラート設定
alert_settings (
  id, customer_id, type, threshold, channel, enabled
)
```

---

## 開発ロードマップ

### Phase 1: MVP - MEO監視（2週間）
- [ ] Googleマップ順位チェック機能
- [ ] 口コミ新着監視
- [ ] シンプルなダッシュボード（1画面）
- [ ] アラート通知（ntfy.sh）

**目標**: 1社テスト導入、月額1〜2万円で検証

### Phase 2: SEO追加（+2週間）
- [ ] 検索順位チェック機能
- [ ] Search Console API連携
- [ ] ダッシュボードにSEOセクション追加

### Phase 3: SNS + AEO（+3週間）
- [ ] SNSエンゲージメント監視
- [ ] AI検索言及チェック
- [ ] 統合ダッシュボード完成

### Phase 4: 改善提案AI（+2週間）
- [ ] Claude APIで改善提案自動生成
- [ ] 週次レポートPDF生成
- [ ] 提案履歴管理

### Phase 5: 商用化（+2週間）
- [ ] 決済機能（Stripe）
- [ ] LP作成
- [ ] 顧客管理機能

---

## 収益シミュレーション

| 顧客数 | 月売上 | 年売上 | 粗利（80%想定） |
|-------|-------|--------|----------------|
| 5社 | 25万円 | 300万円 | 240万円 |
| 10社 | 50万円 | 600万円 | 480万円 |
| 20社 | 100万円 | 1,200万円 | 960万円 |

### 運用コスト（月額）
- Railway: 5,000円
- Supabase Pro: 2,500円
- Vercel Pro: 2,000円
- API費用: 10,000〜20,000円
- **合計**: 約2〜3万円/月

---

## 競合との差別化

| 項目 | 既存MEO代行 | ちょいマーケ |
|-----|-----------|------------|
| 価格 | 月3〜5万円（MEOのみ） | 月5万円（4領域統合） |
| AEO対策 | なし | あり（差別化） |
| レポート | 月1回PDF | リアルタイムダッシュボード |
| 対応速度 | 人力（営業時間内） | 24時間自動監視 |

---

## リスク・課題

1. **スクレイピングの安定性**: Googleマップの構造変更で動かなくなるリスク
   → 定期的なメンテナンス体制が必要

2. **AEO監視の精度**: AIの回答は毎回変わる可能性
   → 複数回クエリして傾向を把握

3. **顧客獲得**: 営業力が必要
   → まずは紹介・口コミ、クラウドソーシングでの実績作り

---

## 関連プロジェクト（流用可能）

- `ai-researcher/`: レポート生成、メール配信ロジック
- `ec-creative-suite/`: Next.jsダッシュボード構成
- `freelance_checker.py`: 定期監視パターン
- `article-workflow/`: AI文章生成パイプライン

---

## 完了タスク (2026/01/18)

- [x] Phase 1（MEO監視MVP）の詳細設計 → `docs/PHASE1_MEO_MVP_DESIGN.md`
- [x] Supabaseテーブル設計 → `supabase/migrations/001_initial_schema.sql`
- [x] Googleマップ順位チェックのPoC → `packages/scraper/src/maps-ranking.ts`
- [x] 口コミ監視スクリプト → `packages/scraper/src/maps-reviews.ts`
- [x] テスト顧客候補リストアップ → `docs/TEST_CUSTOMERS.md`
- [x] **マルチAIレビュー対応（スコア3.3→3.8改善）**
  - 位置情報の設定可能化（geocodeAddress関数追加）
  - Place ID抽出ロジック（URLから自動抽出）
  - 環境変数でheadless制御（`HEADLESS=false`でデバッグ）
  - セレクタの堅牢化（複数パターン対応、フォールバック）
  - ブラウザプール導入（BrowserPoolクラス）
  - 口コミ「もっと見る」処理改善
- [x] **UX/ビジネスレビュー対応（2026/01/18追加）**
  - Place ID自動抽出機能 → `packages/web/src/lib/google-maps.ts`
  - PlaceIdInput コンポーネント → `packages/web/src/components/PlaceIdInput.tsx`
  - BrowserPool共通モジュール化 → `packages/scraper/src/browser-pool.ts`
  - 環境変数のサーバーサイド限定 → `packages/web/src/lib/google-maps-server.ts`
  - 業種別キーワードテンプレート → `packages/web/src/components/KeywordTemplateSelector.tsx`
  - 口コミ返信コピーボタン → `ReviewList.tsx` 更新
  - API Routes追加（`/api/places/details`, `/api/reviews/generate-reply`）
- [x] **SNS→GBP投稿流用機能（2026/01/18）**
  - 設計ドキュメント → `docs/SNS_TO_GBP_DESIGN.md`
  - DBマイグレーション → `supabase/migrations/002_sns_to_gbp.sql`
  - X/Instagramスクレイパー → `packages/scraper/src/sns-x.ts`, `sns-instagram.ts`
  - GBPリライトAI → `packages/web/src/lib/gbp-rewrite.ts`
  - 承認UI → `packages/web/src/components/SnsToGbpApproval.tsx`
  - API Routes → `/api/gbp/drafts`, `/api/gbp/drafts/[id]`, `/api/gbp/rewrite`
- [x] **ランディングページ作成（2026/01/18）**
  - サービス紹介LP → `packages/web/src/app/page.tsx`
  - ヒーロー、機能紹介、料金プラン、ダッシュボードプレビュー、CTA
- [x] **週次レポートPDF生成（2026/01/18）**
  - PDF Document → `packages/web/src/components/WeeklyReportDocument.tsx`
  - レポートデータ集計 → `packages/web/src/lib/report-generator.ts`
  - API → `/api/reports/weekly` (GET: PDF, POST: JSON)
- [x] **GA4連携（2026/01/18）**
  - API → `/api/analytics/ga4`
  - @google-analytics/data 使用
- [x] **AEO監視MVP（2026/01/18）**
  - Perplexity/Google AI言及チェッカー → `packages/scraper/src/aeo-checker.ts`
  - API → `/api/aeo/check`
  - UIコンポーネント → `packages/web/src/components/AeoScoreCard.tsx`
- [x] **ビジネスモデル転換・市場調査（2026/01/18）**
  - SaaS → 受託+無料トライアルモデルに転換
  - 競合調査（スクレイピング代行会社、RPA市場）
  - 料金体系設計（無料→カスタム¥30,000〜→保守¥10,000/月）
- [x] **toB向けサービスLP作成（2026/01/18）**
  - `packages/web/src/app/services/page.tsx`
  - 12種類のAIツールメニュー
  - 1ヶ月無料トライアル訴求
  - 料金体系、FAQ、CTA

---

## ツールメニュー（12種類）

| カテゴリ | ツール | 無料 | カスタム |
|---------|--------|------|---------|
| MEO・集客 | 競合順位ウォッチャー | ✓ | ¥50,000〜 |
| | 口コミ監視くん | ✓ | ¥30,000〜 |
| | SNS→GBP自動リライト | ✓ | ¥80,000〜 |
| | AEOスコアチェッカー | ✓ | ¥50,000〜 |
| 営業・リスト | 競合価格ウォッチャー | ✓ | ¥50,000〜 |
| | 営業リスト自動収集 | ✓ | ¥30,000〜 |
| | 問い合わせフォーム自動送信 | ✓ | ¥80,000〜 |
| レポート | 週次レポート自動生成 | ✓ | ¥50,000〜 |
| | Notionダッシュボード | ✓ | ¥30,000〜 |
| 顧客対応 | LINE自動応答ボット | ✓ | ¥80,000〜 |
| | 口コミ依頼自動化 | ✓ | ¥50,000〜 |
| | カスタム情報収集 | ✓ | ¥100,000〜 |

---

## 次のアクション（営業フェーズ）

### Phase 1: 実績作り
1. [ ] 知り合い店舗1-2件に無料導入
2. [ ] 1ヶ月運用してBefore/After取得
3. [ ] 事例としてLP掲載（匿名でもOK）

### Phase 2: 集客開始
4. [ ] 問い合わせフォーム設置（Googleフォーム）
5. [ ] ランサーズにパッケージ出品
6. [ ] クラウドワークスでMEO案件に応募
7. [ ] X/noteで発信開始

### Phase 3: 拡大
8. [ ] 紹介で広げる
9. [ ] Googleマップ直営業（口コミ少ない店舗にDM）

### 技術（必要に応じて）
- [ ] Supabaseプロジェクト作成
- [ ] Vercel本番デプロイ
- [ ] 管理画面テンプレート作成

### 🤖 集客ボット - 新コンセプト（2026/01/19）

**背景**:
- ローカルビジネスにマーケ担当はいない
- SEO/MEO/AEO別々に説明しても伝わらない
- 月額¥30,000は払えない、¥5,000がリアル

**コンセプト**:
> 「1日1投稿するだけ。あとはAIが集客してくれる」

**店主の1日**:
```
朝〜昼: 何か1つ投稿する（写真でもひとことでもOK）
夜: レポート見る（30秒）
   「今日5人が店を見つけました」
   「3日前の投稿、反応よかったです👍」
```

**AIがやること（裏側）**:
- 投稿 → GBP/各SNSに自動展開
- 口コミ → 返信文を自動作成
- 分析 → 何が効いたかフィードバック
- レポート → 毎晩届く
- MEO/SEO/AEO → 全部まとめて「見つかりやすさ」として統合

**口コミが最重要**:
```
口コミ増える → MEO上がる → SEOにも反映 → AIも認識 → 全部つながる
```

**価格**: ¥5,000/月（全自動でコスト抑制）

**価格を抑える方法**:
- 全自動（人手ゼロ）
- APIは1日1回バッチ
- シンプルUI（開発工数少）
- セルフサービス（サポートコスト抑制）

**TODO**:
- [x] UIプロトタイプ作成（1画面完結） ← 2026/01/20完了
- [x] AIリライト機能（プラットフォーム別最適化） ← 2026/01/20完了
- [x] Supabase連携（投稿保存・履歴管理） ← 2026/01/20完了
- [ ] 投稿→GBP/SNS自動展開の実装確認（API連携）
- [ ] 夜間レポート生成機能（cron-job.org）
- [ ] フィードバック機能（「3日前の投稿が効いた」）
- [ ] 口コミQRコード生成
- [ ] LINE連携（来店後リマインド）
- [ ] 料金プラン設計（¥5,000で成立するか検証）

**実装済み（2026/01/20）**:
- `/shukyaku-bot` ページ: 投稿入力UI + デイリーレポート表示 + AIリライト結果表示
- `/api/shukyaku-bot` API: POST(投稿+AIリライト)、GET(レポート+AIヒント生成)
- プラットフォーム選択（GBP/X/Instagram）
- Anthropic SDK連携（claude-3-5-haiku-latest使用）
- プラットフォーム別最適化テキスト生成+コピーボタン
- Supabaseテーブル設計（`003_shukyaku_bot.sql`）
- `ai-rewrite.ts`: AIリライト・ヒント生成ユーティリティ
- `supabase.ts`: Supabaseクライアント

**既存資産（流用可能）**:
- `sns-x.ts`, `sns-instagram.ts` - SNS取得
- `gbp-rewrite.ts` - GBP投稿リライト
- `aeo-checker.ts` - AI言及チェック
- `maps-reviews.ts` - 口コミ取得

---

### AEO単独ツールの結論（2026/01/19）

**結論**: 単独ツールとしては難しい。集客ボットに統合する。

**難しい理由**:
| 問題 | 詳細 |
|------|------|
| HubSpotが無料で強い | 企業向けはもう解決済み |
| スコア出しても「だから何？」 | 改善アクションが不明確 |
| AIの回答は非決定的 | 毎回変わる、再現性ない |
| ローカルビジネスには響かない | MEO/SEO/AEOの区別がわからない |

**方針**:
- AEOは集客ボットの「裏側」として統合
- ユーザーには「見つかりやすさスコア」として見せる
- choiai.jp では「準備中」表示、リンクなし

---

## ファイル構成

```
choi-marketing/
├── CLAUDE.md
├── docs/
│   ├── PHASE1_MEO_MVP_DESIGN.md   # Phase 1 詳細設計
│   ├── SNS_TO_GBP_DESIGN.md       # SNS→GBP機能設計
│   └── TEST_CUSTOMERS.md          # テスト顧客候補
├── packages/
│   ├── scraper/                   # Playwrightスクレイパー
│   │   ├── package.json
│   │   └── src/
│   │       ├── browser-pool.ts    # 共通ブラウザプール
│   │       ├── maps-ranking.ts    # 順位チェック
│   │       ├── maps-reviews.ts    # 口コミ取得
│   │       ├── sns-x.ts           # X/Twitterスクレイパー
│   │       ├── sns-instagram.ts   # Instagramスクレイパー
│   │       ├── aeo-checker.ts     # AEO言及チェッカー
│   │       └── test-poc.ts        # PoCテスト
│   └── web/                       # Next.js フロントエンド
│       └── src/
│           ├── app/
│           │   ├── page.tsx       # toCランディングページ（旧）
│           │   ├── services/
│           │   │   └── page.tsx   # toB向けサービスLP（メイン）
│           │   └── api/
│           │       ├── gbp/       # GBP関連API
│           │       ├── aeo/       # AEO関連API
│           │       ├── analytics/ # GA4連携API
│           │       └── reports/   # レポート生成API
│           ├── components/
│           │   ├── SnsToGbpApproval.tsx   # SNS→GBP承認UI
│           │   ├── AeoScoreCard.tsx       # AEOスコア表示
│           │   ├── WeeklyReportDocument.tsx # PDFレポート
│           │   └── ...
│           └── lib/
│               ├── google-maps.ts        # Place ID抽出
│               ├── google-maps-server.ts # サーバーサイドAPI
│               ├── gbp-rewrite.ts        # AIリライト
│               └── report-generator.ts   # レポートデータ集計
└── supabase/
    └── migrations/
        ├── 001_initial_schema.sql # DB初期スキーマ
        └── 002_sns_to_gbp.sql     # SNS→GBP機能テーブル
```

---

*作成日: 2026/01/18*
*最終更新: 2026/01/18*
