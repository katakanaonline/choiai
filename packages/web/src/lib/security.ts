/**
 * セキュリティユーティリティ
 * SSRF防止、入力バリデーション、レート制限
 */

// プライベートIPアドレス範囲
const PRIVATE_IP_PATTERNS = [
  /^127\./,                          // 127.0.0.0/8 (localhost)
  /^10\./,                           // 10.0.0.0/8 (Private A)
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./,  // 172.16.0.0/12 (Private B)
  /^192\.168\./,                     // 192.168.0.0/16 (Private C)
  /^169\.254\./,                     // 169.254.0.0/16 (Link-local)
  /^0\./,                            // 0.0.0.0/8
  /^100\.(6[4-9]|[7-9][0-9]|1[0-2][0-7])\./,  // 100.64.0.0/10 (Carrier-grade NAT)
  /^198\.1[89]\./,                   // 198.18.0.0/15 (Benchmark)
  /^::1$/,                           // IPv6 localhost
  /^fc00:/i,                         // IPv6 Unique local
  /^fe80:/i,                         // IPv6 Link-local
];

// 禁止ホスト名
const BLOCKED_HOSTNAMES = [
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "::1",
  "[::1]",
  "metadata.google.internal",  // GCP metadata
  "169.254.169.254",           // AWS/GCP/Azure metadata
  "metadata.google",
  "kubernetes.default",
  "kubernetes.default.svc",
];

// 許可プロトコル
const ALLOWED_PROTOCOLS = ["http:", "https:"];

// 入力長制限
export const INPUT_LIMITS = {
  url: 2048,
  companyName: 100,
  industry: 50,
  location: 100,
  message: 1000,
  context: 10000,
  description: 2000,
  competitors: 5,  // 最大競合数
  competitorName: 50,
};

/**
 * URLの安全性を検証（SSRF防止）
 */
export function validateUrl(urlString: string): { valid: boolean; error?: string } {
  // 長さチェック
  if (!urlString || urlString.length > INPUT_LIMITS.url) {
    return { valid: false, error: "URLが無効または長すぎます" };
  }

  let url: URL;
  try {
    url = new URL(urlString);
  } catch {
    return { valid: false, error: "無効なURL形式です" };
  }

  // プロトコルチェック
  if (!ALLOWED_PROTOCOLS.includes(url.protocol)) {
    return { valid: false, error: `許可されていないプロトコルです: ${url.protocol}` };
  }

  // ホスト名チェック
  const hostname = url.hostname.toLowerCase();

  if (BLOCKED_HOSTNAMES.includes(hostname)) {
    return { valid: false, error: "このホストへのアクセスは許可されていません" };
  }

  // プライベートIPチェック
  for (const pattern of PRIVATE_IP_PATTERNS) {
    if (pattern.test(hostname)) {
      return { valid: false, error: "プライベートIPアドレスへのアクセスは許可されていません" };
    }
  }

  // ポートチェック（標準ポートのみ許可）
  if (url.port && !["80", "443", ""].includes(url.port)) {
    return { valid: false, error: "非標準ポートへのアクセスは許可されていません" };
  }

  return { valid: true };
}

/**
 * 文字列入力のサニタイズ
 */
export function sanitizeString(input: string, maxLength: number): string {
  if (typeof input !== "string") {
    return "";
  }

  // 長さ制限
  let sanitized = input.slice(0, maxLength);

  // 制御文字除去（改行・タブは許可）
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");

  return sanitized.trim();
}

/**
 * 配列入力のバリデーション
 */
export function validateArray<T>(
  input: unknown,
  maxItems: number,
  itemValidator: (item: unknown) => T | null
): T[] {
  if (!Array.isArray(input)) {
    return [];
  }

  return input
    .slice(0, maxItems)
    .map(itemValidator)
    .filter((item): item is T => item !== null);
}

/**
 * レート制限（メモリベース・簡易版）
 * 本番ではRedis等を使用すべき
 */
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

export function checkRateLimit(
  identifier: string,
  limit: number = 10,
  windowMs: number = 60000  // 1分
): RateLimitResult {
  const now = Date.now();
  const key = identifier;

  let record = rateLimitStore.get(key);

  // ウィンドウリセット
  if (!record || now >= record.resetAt) {
    record = { count: 0, resetAt: now + windowMs };
    rateLimitStore.set(key, record);
  }

  record.count++;

  // 古いエントリをクリーンアップ（メモリリーク防止）
  if (rateLimitStore.size > 10000) {
    const cutoff = now - windowMs;
    for (const [k, v] of rateLimitStore.entries()) {
      if (v.resetAt < cutoff) {
        rateLimitStore.delete(k);
      }
    }
  }

  return {
    allowed: record.count <= limit,
    remaining: Math.max(0, limit - record.count),
    resetAt: record.resetAt,
  };
}

/**
 * IPアドレス取得（Next.js用）
 */
export function getClientIp(request: Request): string {
  const headers = request.headers;

  // Vercel / Cloudflare / 一般的なプロキシ
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  const realIp = headers.get("x-real-ip");
  if (realIp) {
    return realIp;
  }

  // Cloudflare specific
  const cfIp = headers.get("cf-connecting-ip");
  if (cfIp) {
    return cfIp;
  }

  return "unknown";
}

/**
 * プロンプトインジェクション対策
 * ユーザー入力を安全にプロンプトに含めるための処理
 */
export function sanitizeForPrompt(input: string): string {
  // 基本的なサニタイズ
  let sanitized = sanitizeString(input, 5000);

  // プロンプト操作を試みるパターンを検出・中和
  const dangerousPatterns = [
    /ignore\s+(previous|above|all)\s+(instructions?|prompts?)/gi,
    /disregard\s+(previous|above|all)/gi,
    /forget\s+(everything|previous)/gi,
    /you\s+are\s+now\s+a?n?\s*/gi,
    /pretend\s+you\s+are/gi,
    /act\s+as\s+if\s+you/gi,
    /\[SYSTEM\]/gi,
    /\[INST\]/gi,
    /<<SYS>>/gi,
  ];

  for (const pattern of dangerousPatterns) {
    sanitized = sanitized.replace(pattern, "[FILTERED]");
  }

  return sanitized;
}

/**
 * レスポンスヘッダー設定（セキュリティ強化）
 */
export function getSecurityHeaders(): Record<string, string> {
  return {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "X-XSS-Protection": "1; mode=block",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Content-Security-Policy": "default-src 'self'",
  };
}
