# Phase 1: MEO監視MVP 詳細設計

## 概要

最小限の機能でMEO監視サービスを立ち上げ、1社テスト導入を目指す。

**期間**: 2週間
**目標**:
- Googleマップでの検索順位チェック
- 口コミ新着監視
- シンプルなダッシュボード
- アラート通知

---

## 機能一覧

### MVP機能（必須）

| # | 機能 | 説明 | 優先度 |
|---|------|------|-------|
| 1 | 順位チェック | 指定キーワード×地域でGoogleマップ順位取得 | P0 |
| 2 | 口コミ監視 | 新着口コミの検知・通知 | P0 |
| 3 | ダッシュボード | 順位推移グラフ、口コミ一覧表示 | P0 |
| 4 | アラート | 順位変動・新着口コミをntfy.shで通知 | P1 |
| 5 | 口コミ返信案 | AIで返信文を自動生成 | P1 |

### Phase 2以降に延期

- 競合店舗の監視
- GBPプロフィール変更検知
- GBP自動投稿
- 週次レポートPDF

---

## 画面設計

### 1. ログイン画面 `/login`

```
┌─────────────────────────────────────┐
│         ちょいマーケ                │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ メールアドレス              │   │
│  └─────────────────────────────┘   │
│                                     │
│  [ マジックリンクを送信 ]          │
│                                     │
│  または                             │
│  [ Googleでログイン ]              │
└─────────────────────────────────────┘
```

### 2. ダッシュボード `/dashboard`

```
┌─────────────────────────────────────────────────────────────┐
│ ちょいマーケ                              [設定] [ログアウト] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  📊 MEO順位サマリー                                         │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ キーワード        現在順位    前日比    1週間前比   │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │ 新宿 ラーメン     3位         →         ↑2          │   │
│  │ 新宿 つけ麺       5位         ↓1        →           │   │
│  │ 西新宿 ラーメン   2位         ↑1        ↑3          │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  📈 順位推移グラフ                                          │
│  ┌─────────────────────────────────────────────────────┐   │
│  │     ^                                               │   │
│  │  1 │    ●                                          │   │
│  │  2 │      ●   ●                                    │   │
│  │  3 │  ●     ●   ●  ●  ●                           │   │
│  │  4 │                                               │   │
│  │  5 │                                               │   │
│  │    └──────────────────────────────────────────→    │   │
│  │      1/12  1/13  1/14  1/15  1/16  1/17  1/18     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  💬 最新の口コミ                                            │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ ★★★★★ 2026/01/18                                    │   │
│  │ 「スープが最高でした！また来ます」                    │   │
│  │ [返信案を生成] [Googleで返信]                        │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │ ★★★☆☆ 2026/01/15                                    │   │
│  │ 「量が少なかった」                                    │   │
│  │ [返信案を生成] [Googleで返信]                        │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 3. 設定画面 `/settings`

```
┌─────────────────────────────────────────────────────────────┐
│ 設定                                          [← 戻る]      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  🏪 店舗情報                                                │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 店舗名: [麺屋 カタカナ                          ]   │   │
│  │ Place ID: [ChIJ...                              ]   │   │
│  │ 住所: [東京都新宿区西新宿1-1-1                  ]   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  🔍 監視キーワード                                          │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 新宿 ラーメン                              [削除]   │   │
│  │ 新宿 つけ麺                                [削除]   │   │
│  │ 西新宿 ラーメン                            [削除]   │   │
│  │ [+ キーワードを追加]                                │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  🔔 通知設定                                                │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ [✓] 順位が3位以上変動したら通知                     │   │
│  │ [✓] 新着口コミを通知                                │   │
│  │ [✓] 低評価（★3以下）口コミを即時通知               │   │
│  │                                                     │   │
│  │ 通知先: ntfy.sh トピック                            │   │
│  │ [choimarke-user123                              ]   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  [ 保存 ]                                                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## API設計

### エンドポイント一覧

| メソッド | パス | 説明 |
|---------|------|------|
| GET | `/api/rankings` | 順位データ取得 |
| GET | `/api/rankings/history` | 順位履歴取得 |
| GET | `/api/reviews` | 口コミ一覧取得 |
| POST | `/api/reviews/generate-reply` | 口コミ返信案生成 |
| GET | `/api/settings` | 設定取得 |
| PUT | `/api/settings` | 設定更新 |
| POST | `/api/cron/check-rankings` | 順位チェック実行（cron用） |
| POST | `/api/cron/check-reviews` | 口コミチェック実行（cron用） |

### API詳細

#### GET /api/rankings

```json
// Response
{
  "rankings": [
    {
      "keyword": "新宿 ラーメン",
      "currentRank": 3,
      "previousRank": 3,
      "weekAgoRank": 5,
      "checkedAt": "2026-01-18T09:00:00Z"
    }
  ]
}
```

#### GET /api/rankings/history?keyword=新宿+ラーメン&days=30

```json
// Response
{
  "keyword": "新宿 ラーメン",
  "history": [
    { "date": "2026-01-18", "rank": 3 },
    { "date": "2026-01-17", "rank": 3 },
    { "date": "2026-01-16", "rank": 4 }
  ]
}
```

#### GET /api/reviews

```json
// Response
{
  "reviews": [
    {
      "id": "abc123",
      "rating": 5,
      "text": "スープが最高でした！また来ます",
      "authorName": "田中太郎",
      "publishedAt": "2026-01-18T12:00:00Z",
      "replied": false
    }
  ]
}
```

#### POST /api/reviews/generate-reply

```json
// Request
{
  "reviewId": "abc123",
  "reviewText": "スープが最高でした！また来ます",
  "rating": 5
}

// Response
{
  "suggestedReply": "ご来店いただきありがとうございます！スープを気に入っていただけて大変嬉しいです。またのご来店を心よりお待ちしております。"
}
```

#### POST /api/cron/check-rankings

```json
// Request (cron-job.org から呼び出し)
// Header: Authorization: Bearer {CRON_SECRET}

// Response
{
  "checked": 3,
  "alerts": [
    {
      "keyword": "新宿 つけ麺",
      "previousRank": 4,
      "currentRank": 7,
      "change": -3
    }
  ]
}
```

---

## データベース設計（Supabase）

### テーブル

#### customers（顧客）

```sql
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  plan TEXT DEFAULT 'light', -- 'light' | 'standard' | 'premium'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### stores（店舗）

```sql
CREATE TABLE stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  place_id TEXT NOT NULL, -- Google Place ID
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### keywords（監視キーワード）

```sql
CREATE TABLE keywords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  keyword TEXT NOT NULL,
  enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### rankings（順位履歴）

```sql
CREATE TABLE rankings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword_id UUID REFERENCES keywords(id) ON DELETE CASCADE,
  rank INTEGER, -- NULL = 圏外
  checked_at TIMESTAMPTZ DEFAULT NOW()
);

-- インデックス
CREATE INDEX idx_rankings_keyword_date ON rankings(keyword_id, checked_at DESC);
```

#### reviews（口コミ）

```sql
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  google_review_id TEXT UNIQUE, -- Google側の口コミID
  rating INTEGER NOT NULL, -- 1-5
  text TEXT,
  author_name TEXT,
  published_at TIMESTAMPTZ,
  replied BOOLEAN DEFAULT FALSE,
  suggested_reply TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### alert_settings（アラート設定）

```sql
CREATE TABLE alert_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  rank_change_threshold INTEGER DEFAULT 3, -- 何位変動で通知
  notify_new_review BOOLEAN DEFAULT TRUE,
  notify_low_rating BOOLEAN DEFAULT TRUE, -- ★3以下
  low_rating_threshold INTEGER DEFAULT 3,
  ntfy_topic TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### RLS (Row Level Security)

```sql
-- customers: 自分のデータのみ
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own data" ON customers
  FOR SELECT USING (auth.uid() = id);

-- stores: 自分の顧客の店舗のみ
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own stores" ON stores
  FOR ALL USING (customer_id = auth.uid());

-- 他テーブルも同様に設定
```

---

## 定期実行設計

### cron-job.org 設定

| ジョブ | 頻度 | URL | 説明 |
|-------|------|-----|------|
| 順位チェック | 毎日9:00 | `POST /api/cron/check-rankings` | Googleマップ順位取得 |
| 口コミチェック | 毎時 | `POST /api/cron/check-reviews` | 新着口コミ監視 |

### 認証

```
Authorization: Bearer {CRON_SECRET}
```

環境変数 `CRON_SECRET` をcron-job.orgのヘッダーに設定。

---

## 通知設計

### ntfy.sh

```bash
# 順位変動アラート
curl -d "【順位変動】新宿 ラーメン: 3位 → 7位（-4）" \
  https://ntfy.sh/choimarke-{customer_id}

# 新着口コミアラート
curl -d "【新着口コミ】★★★★★ スープが最高でした！" \
  https://ntfy.sh/choimarke-{customer_id}
```

### 将来拡張（Phase 2以降）

- LINE Notify
- Slack Webhook
- メール（SendGrid）

---

## ディレクトリ構成

```
choi-marketing/
├── CLAUDE.md
├── docs/
│   └── PHASE1_MEO_MVP_DESIGN.md  (このファイル)
├── packages/
│   ├── web/                      # Next.js フロントエンド
│   │   ├── app/
│   │   │   ├── (auth)/
│   │   │   │   └── login/page.tsx
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx
│   │   │   ├── settings/
│   │   │   │   └── page.tsx
│   │   │   └── api/
│   │   │       ├── rankings/route.ts
│   │   │       ├── reviews/route.ts
│   │   │       ├── settings/route.ts
│   │   │       └── cron/
│   │   │           ├── check-rankings/route.ts
│   │   │           └── check-reviews/route.ts
│   │   ├── components/
│   │   │   ├── RankingTable.tsx
│   │   │   ├── RankingChart.tsx
│   │   │   ├── ReviewList.tsx
│   │   │   └── AlertBadge.tsx
│   │   └── lib/
│   │       ├── supabase.ts
│   │       └── ntfy.ts
│   └── scraper/                  # Playwright スクレイパー
│       ├── src/
│       │   ├── maps-ranking.ts   # Googleマップ順位チェック
│       │   └── maps-reviews.ts   # 口コミ取得
│       └── package.json
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql
└── package.json
```

---

## 開発タスク

### Week 1

- [ ] Next.jsプロジェクト作成（`packages/web`）
- [ ] Supabaseプロジェクト作成・テーブル作成
- [ ] 認証（Supabase Auth）実装
- [ ] Googleマップ順位チェックスクレイパー実装
- [ ] `/api/cron/check-rankings` 実装

### Week 2

- [ ] ダッシュボード画面実装
- [ ] 口コミ監視スクレイパー実装
- [ ] `/api/cron/check-reviews` 実装
- [ ] ntfy.sh通知実装
- [ ] 口コミ返信案生成（Claude API）実装
- [ ] Vercel/Railwayデプロイ
- [ ] cron-job.org設定

---

## 環境変数

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Cron認証
CRON_SECRET=

# AI
ANTHROPIC_API_KEY=

# 通知
NTFY_BASE_URL=https://ntfy.sh
```

---

*作成日: 2026/01/18*
