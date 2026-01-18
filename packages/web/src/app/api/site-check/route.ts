import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";
export const maxDuration = 60;

interface SiteCheckRequest {
  url: string;
}

interface Issue {
  type: "typo" | "broken_link" | "seo" | "accessibility";
  severity: "high" | "medium" | "low";
  location: string;
  original?: string;
  suggestion?: string;
  description: string;
}

interface SiteCheckResponse {
  url: string;
  checkedAt: string;
  summary: {
    totalIssues: number;
    typos: number;
    brokenLinks: number;
    seoIssues: number;
    accessibilityIssues: number;
  };
  issues: Issue[];
  score: number;
}

async function fetchPageContent(
  url: string
): Promise<{ html: string; text: string; links: string[] }> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; ChoiAI-SiteChecker/1.0)",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const html = await response.text();

    // Extract links
    const linkMatches = html.matchAll(/href=["']([^"']+)["']/gi);
    const links: string[] = [];
    for (const match of linkMatches) {
      const href = match[1];
      if (href.startsWith("http") || href.startsWith("/")) {
        links.push(href);
      }
    }

    // Extract text
    const text = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    return { html, text, links: [...new Set(links)].slice(0, 50) };
  } catch (error) {
    throw new Error(`ページを取得できませんでした: ${error}`);
  }
}

async function checkBrokenLinks(
  baseUrl: string,
  links: string[]
): Promise<Issue[]> {
  const issues: Issue[] = [];
  const baseUrlObj = new URL(baseUrl);

  // Check up to 10 links to avoid timeout
  const linksToCheck = links.slice(0, 10);

  for (const link of linksToCheck) {
    try {
      let fullUrl = link;
      if (link.startsWith("/")) {
        fullUrl = `${baseUrlObj.protocol}//${baseUrlObj.host}${link}`;
      }

      const response = await fetch(fullUrl, {
        method: "HEAD",
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; ChoiAI-SiteChecker/1.0)",
        },
      });

      if (!response.ok && response.status !== 301 && response.status !== 302) {
        issues.push({
          type: "broken_link",
          severity: response.status === 404 ? "high" : "medium",
          location: link,
          description: `リンク切れ（HTTP ${response.status}）`,
        });
      }
    } catch {
      issues.push({
        type: "broken_link",
        severity: "high",
        location: link,
        description: "リンクにアクセスできません",
      });
    }
  }

  return issues;
}

async function checkContentWithAI(
  text: string,
  html: string,
  apiKey: string
): Promise<Issue[]> {
  const prompt = `以下のウェブページのテキストとHTMLを校正してください。

【テキスト（最初の3000文字）】
${text.slice(0, 3000)}

【HTML（最初の2000文字）】
${html.slice(0, 2000)}

以下の観点でチェックし、問題点をJSON形式で出力してください：

1. **誤字脱字**: 漢字の誤り、送り仮名の誤り、同音異義語の誤用
2. **文法・表記**: 「お問い合せ」vs「お問い合わせ」などの表記ゆれ、文法的な誤り
3. **SEO**: titleタグやmeta descriptionの問題、見出し構造の問題
4. **アクセシビリティ**: altテキストの欠落、フォームラベルの問題

JSON形式（配列）で回答：
[
  {
    "type": "typo|seo|accessibility",
    "severity": "high|medium|low",
    "location": "問題の箇所（テキストの一部）",
    "original": "誤りの元テキスト",
    "suggestion": "修正提案",
    "description": "問題の説明"
  }
]

問題がなければ空配列 [] を返してください。JSONのみ出力、説明文は不要。`;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "あなたは日本語校正の専門家です。厳密にJSON形式のみで回答してください。",
          },
          { role: "user", content: prompt },
        ],
        max_tokens: 2000,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || "[]";

    // Parse JSON
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return [];
    }

    const issues = JSON.parse(jsonMatch[0]);
    return issues.map((issue: Issue) => ({
      ...issue,
      type: issue.type || "typo",
      severity: issue.severity || "medium",
    }));
  } catch (error) {
    console.error("AI check error:", error);
    return [];
  }
}

export async function POST(req: NextRequest) {
  try {
    const body: SiteCheckRequest = await req.json();
    const { url } = body;

    if (!url) {
      return NextResponse.json(
        { error: "URLを入力してください" },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "API設定エラー" }, { status: 500 });
    }

    // Fetch page
    const { html, text, links } = await fetchPageContent(url);

    // Run checks in parallel
    const [brokenLinkIssues, contentIssues] = await Promise.all([
      checkBrokenLinks(url, links),
      checkContentWithAI(text, html, apiKey),
    ]);

    const allIssues = [...brokenLinkIssues, ...contentIssues];

    // Calculate summary
    const summary = {
      totalIssues: allIssues.length,
      typos: allIssues.filter((i) => i.type === "typo").length,
      brokenLinks: allIssues.filter((i) => i.type === "broken_link").length,
      seoIssues: allIssues.filter((i) => i.type === "seo").length,
      accessibilityIssues: allIssues.filter((i) => i.type === "accessibility")
        .length,
    };

    // Calculate score (100 - penalties)
    let score = 100;
    for (const issue of allIssues) {
      if (issue.severity === "high") score -= 10;
      else if (issue.severity === "medium") score -= 5;
      else score -= 2;
    }
    score = Math.max(0, score);

    const response: SiteCheckResponse = {
      url,
      checkedAt: new Date().toISOString(),
      summary,
      issues: allIssues,
      score,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Site check error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "チェック中にエラーが発生しました",
      },
      { status: 500 }
    );
  }
}
