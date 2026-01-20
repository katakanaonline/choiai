import { createClient } from "@supabase/supabase-js";

// Server-side Supabase client (service role for admin operations)
export function createServerClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Missing Supabase environment variables");
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// Client-side Supabase client (anon key for public operations)
export function createBrowserClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase environment variables");
  }

  return createClient(supabaseUrl, supabaseAnonKey);
}

// Database types
export interface ShukyakuPost {
  id: string;
  store_id: string | null;
  content: string;
  image_url: string | null;
  platforms: string[];
  status: "draft" | "pending" | "posted" | "failed";
  posted_at: string | null;
  created_at: string;
  platform_results: Record<string, {
    success: boolean;
    postId?: string;
    error?: string;
  }> | null;
}

export interface ShukyakuReport {
  id: string;
  store_id: string | null;
  date: string;
  discovery_count: number;
  total_views: number;
  top_post_id: string | null;
  sentiment_score: number;
  tips: string[];
  created_at: string;
}
