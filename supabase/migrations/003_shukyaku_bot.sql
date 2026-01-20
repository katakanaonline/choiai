-- ============================================
-- 集客ボット機能用テーブル
-- 2026-01-20
-- ============================================

-- 集客投稿テーブル
CREATE TABLE shukyaku_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  image_url TEXT,
  platforms TEXT[] NOT NULL DEFAULT '{}', -- ['gbp', 'x', 'instagram']
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'posted', 'failed')),
  posted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  -- 各プラットフォームへの投稿結果
  platform_results JSONB DEFAULT '{}'
);

-- 集客デイリーレポートテーブル
CREATE TABLE shukyaku_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  discovery_count INTEGER DEFAULT 0, -- 新規発見数
  total_views INTEGER DEFAULT 0, -- 総表示回数
  top_post_id UUID REFERENCES shukyaku_posts(id) ON DELETE SET NULL,
  sentiment_score INTEGER DEFAULT 0, -- 好感度スコア (0-100)
  tips TEXT[] DEFAULT '{}', -- AIが生成するヒント
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(store_id, date)
);

-- プラットフォーム別リライトテーブル（投稿前の最適化用）
CREATE TABLE shukyaku_rewrites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES shukyaku_posts(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('gbp', 'x', 'instagram')),
  original_content TEXT NOT NULL,
  rewritten_content TEXT NOT NULL,
  approved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, platform)
);

-- インデックス
CREATE INDEX idx_shukyaku_posts_store ON shukyaku_posts(store_id);
CREATE INDEX idx_shukyaku_posts_created ON shukyaku_posts(created_at DESC);
CREATE INDEX idx_shukyaku_posts_status ON shukyaku_posts(status);
CREATE INDEX idx_shukyaku_reports_store_date ON shukyaku_reports(store_id, date DESC);

-- RLS
ALTER TABLE shukyaku_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE shukyaku_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE shukyaku_rewrites ENABLE ROW LEVEL SECURITY;

-- ユーザーポリシー
CREATE POLICY "Users can manage own shukyaku_posts" ON shukyaku_posts
  FOR ALL USING (
    store_id IS NULL OR
    store_id IN (SELECT id FROM stores WHERE customer_id = auth.uid())
  );

CREATE POLICY "Users can view own shukyaku_reports" ON shukyaku_reports
  FOR ALL USING (
    store_id IS NULL OR
    store_id IN (SELECT id FROM stores WHERE customer_id = auth.uid())
  );

CREATE POLICY "Users can manage own shukyaku_rewrites" ON shukyaku_rewrites
  FOR ALL USING (
    post_id IN (
      SELECT id FROM shukyaku_posts
      WHERE store_id IS NULL OR store_id IN (SELECT id FROM stores WHERE customer_id = auth.uid())
    )
  );

-- サービスロールポリシー
CREATE POLICY "Service role has full access to shukyaku_posts" ON shukyaku_posts
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role has full access to shukyaku_reports" ON shukyaku_reports
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role has full access to shukyaku_rewrites" ON shukyaku_rewrites
  FOR ALL USING (auth.role() = 'service_role');
