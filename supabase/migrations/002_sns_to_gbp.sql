-- SNS→GBP投稿流用機能用テーブル

-- SNS投稿
CREATE TABLE sns_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('x', 'instagram')),
  external_id TEXT NOT NULL,
  content TEXT NOT NULL,
  media_urls TEXT[] DEFAULT '{}',
  posted_at TIMESTAMPTZ NOT NULL,
  fetched_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(platform, external_id)
);

-- GBP投稿下書き
CREATE TABLE gbp_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  sns_post_id UUID REFERENCES sns_posts(id) ON DELETE SET NULL,
  original_content TEXT NOT NULL,
  rewritten_content TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'posted')),
  scheduled_at TIMESTAMPTZ,
  posted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- SNSアカウント設定
CREATE TABLE sns_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('x', 'instagram')),
  username TEXT NOT NULL,
  enabled BOOLEAN DEFAULT TRUE,
  last_fetched_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(store_id, platform)
);

-- インデックス
CREATE INDEX idx_sns_posts_store ON sns_posts(store_id);
CREATE INDEX idx_sns_posts_posted ON sns_posts(posted_at DESC);
CREATE INDEX idx_gbp_drafts_store ON gbp_drafts(store_id);
CREATE INDEX idx_gbp_drafts_status ON gbp_drafts(status);

-- RLS
ALTER TABLE sns_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE gbp_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE sns_accounts ENABLE ROW LEVEL SECURITY;

-- ポリシー
CREATE POLICY "Users can view own sns_posts" ON sns_posts
  FOR ALL USING (store_id IN (SELECT id FROM stores WHERE customer_id = auth.uid()));

CREATE POLICY "Users can view own gbp_drafts" ON gbp_drafts
  FOR ALL USING (store_id IN (SELECT id FROM stores WHERE customer_id = auth.uid()));

CREATE POLICY "Users can view own sns_accounts" ON sns_accounts
  FOR ALL USING (store_id IN (SELECT id FROM stores WHERE customer_id = auth.uid()));

-- 更新日時の自動更新
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER gbp_drafts_updated_at
  BEFORE UPDATE ON gbp_drafts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
