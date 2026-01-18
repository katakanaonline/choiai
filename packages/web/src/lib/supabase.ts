import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// 型定義
export interface Customer {
  id: string;
  email: string;
  name: string | null;
  plan: "light" | "standard" | "premium";
  created_at: string;
  updated_at: string;
}

export interface Store {
  id: string;
  customer_id: string;
  name: string;
  place_id: string;
  address: string | null;
  created_at: string;
}

export interface Keyword {
  id: string;
  store_id: string;
  keyword: string;
  enabled: boolean;
  created_at: string;
}

export interface Ranking {
  id: string;
  keyword_id: string;
  rank: number | null;
  checked_at: string;
}

export interface Review {
  id: string;
  store_id: string;
  google_review_id: string | null;
  rating: number;
  text: string | null;
  author_name: string | null;
  published_at: string | null;
  replied: boolean;
  suggested_reply: string | null;
  created_at: string;
}

export interface AlertSettings {
  id: string;
  customer_id: string;
  rank_change_threshold: number;
  notify_new_review: boolean;
  notify_low_rating: boolean;
  low_rating_threshold: number;
  ntfy_topic: string | null;
  created_at: string;
}
