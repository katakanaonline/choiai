-- ============================================
-- ちょいマーケ Phase 1: MEO監視MVP
-- 初期スキーマ
-- ============================================

-- 顧客テーブル
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  plan TEXT DEFAULT 'light' CHECK (plan IN ('light', 'standard', 'premium')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 店舗テーブル
CREATE TABLE stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  place_id TEXT NOT NULL, -- Google Place ID
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 監視キーワードテーブル
CREATE TABLE keywords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  keyword TEXT NOT NULL,
  enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 順位履歴テーブル
CREATE TABLE rankings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword_id UUID NOT NULL REFERENCES keywords(id) ON DELETE CASCADE,
  rank INTEGER, -- NULL = 圏外（20位以下）
  checked_at TIMESTAMPTZ DEFAULT NOW()
);

-- 口コミテーブル
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  google_review_id TEXT UNIQUE, -- Google側のID（重複防止）
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  text TEXT,
  author_name TEXT,
  published_at TIMESTAMPTZ,
  replied BOOLEAN DEFAULT FALSE,
  suggested_reply TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- アラート設定テーブル
CREATE TABLE alert_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  rank_change_threshold INTEGER DEFAULT 3, -- 何位変動で通知
  notify_new_review BOOLEAN DEFAULT TRUE,
  notify_low_rating BOOLEAN DEFAULT TRUE, -- 低評価を即時通知
  low_rating_threshold INTEGER DEFAULT 3, -- ★3以下で通知
  ntfy_topic TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(customer_id)
);

-- ============================================
-- インデックス
-- ============================================

-- 順位検索用（キーワード×日付）
CREATE INDEX idx_rankings_keyword_date ON rankings(keyword_id, checked_at DESC);

-- 口コミ検索用（店舗×日付）
CREATE INDEX idx_reviews_store_date ON reviews(store_id, published_at DESC);

-- 顧客メール検索用
CREATE INDEX idx_customers_email ON customers(email);

-- ============================================
-- Row Level Security (RLS)
-- ============================================

-- 全テーブルでRLS有効化
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE rankings ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_settings ENABLE ROW LEVEL SECURITY;

-- customers: 自分のデータのみ
CREATE POLICY "Users can view own customer data"
  ON customers FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own customer data"
  ON customers FOR UPDATE
  USING (auth.uid() = id);

-- stores: 自分の店舗のみ
CREATE POLICY "Users can manage own stores"
  ON stores FOR ALL
  USING (customer_id = auth.uid());

-- keywords: 自分の店舗のキーワードのみ
CREATE POLICY "Users can manage own keywords"
  ON keywords FOR ALL
  USING (
    store_id IN (
      SELECT id FROM stores WHERE customer_id = auth.uid()
    )
  );

-- rankings: 自分のキーワードの順位のみ
CREATE POLICY "Users can view own rankings"
  ON rankings FOR SELECT
  USING (
    keyword_id IN (
      SELECT k.id FROM keywords k
      JOIN stores s ON k.store_id = s.id
      WHERE s.customer_id = auth.uid()
    )
  );

-- reviews: 自分の店舗の口コミのみ
CREATE POLICY "Users can manage own reviews"
  ON reviews FOR ALL
  USING (
    store_id IN (
      SELECT id FROM stores WHERE customer_id = auth.uid()
    )
  );

-- alert_settings: 自分の設定のみ
CREATE POLICY "Users can manage own alert settings"
  ON alert_settings FOR ALL
  USING (customer_id = auth.uid());

-- ============================================
-- サービスロール用ポリシー（Cron用）
-- ============================================

-- サービスロールは全データアクセス可能
CREATE POLICY "Service role has full access to customers"
  ON customers FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role has full access to stores"
  ON stores FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role has full access to keywords"
  ON keywords FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role has full access to rankings"
  ON rankings FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role has full access to reviews"
  ON reviews FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role has full access to alert_settings"
  ON alert_settings FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================
-- 更新日時自動更新トリガー
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ============================================
-- 初期データ（開発用）
-- ============================================

-- 開発用のテスト顧客は手動で追加
-- INSERT INTO customers (id, email, name, plan) VALUES (...);
