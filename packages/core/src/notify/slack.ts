/**
 * Slack通知モジュール
 * Webhook経由でSlackにメッセージを送信
 */

export interface SlackMessage {
  text?: string;
  blocks?: SlackBlock[];
  channel?: string;
  username?: string;
  icon_emoji?: string;
}

export interface SlackBlock {
  type: "section" | "header" | "divider" | "context" | "actions";
  text?: {
    type: "plain_text" | "mrkdwn";
    text: string;
    emoji?: boolean;
  };
  fields?: Array<{
    type: "plain_text" | "mrkdwn";
    text: string;
  }>;
  elements?: unknown[];
  accessory?: unknown;
}

export interface SlackResult {
  success: boolean;
  error?: string;
}

/**
 * Slack通知送信
 */
export async function sendSlackMessage(
  webhookUrl: string,
  message: SlackMessage
): Promise<SlackResult> {
  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      const text = await response.text();
      return { success: false, error: `HTTP ${response.status}: ${text}` };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * シンプルなテキストメッセージ送信
 */
export async function sendSlackText(
  webhookUrl: string,
  text: string
): Promise<SlackResult> {
  return sendSlackMessage(webhookUrl, { text });
}

/**
 * リッチメッセージ送信（ブロック形式）
 */
export async function sendSlackBlocks(
  webhookUrl: string,
  blocks: SlackBlock[],
  fallbackText?: string
): Promise<SlackResult> {
  return sendSlackMessage(webhookUrl, {
    text: fallbackText || "通知",
    blocks,
  });
}

/**
 * アラート通知（赤色強調）
 */
export async function sendSlackAlert(
  webhookUrl: string,
  title: string,
  message: string,
  details?: Record<string, string>
): Promise<SlackResult> {
  const blocks: SlackBlock[] = [
    {
      type: "header",
      text: { type: "plain_text", text: `🚨 ${title}`, emoji: true },
    },
    {
      type: "section",
      text: { type: "mrkdwn", text: message },
    },
  ];

  if (details && Object.keys(details).length > 0) {
    blocks.push({
      type: "section",
      fields: Object.entries(details).map(([key, value]) => ({
        type: "mrkdwn" as const,
        text: `*${key}:*\n${value}`,
      })),
    });
  }

  return sendSlackBlocks(webhookUrl, blocks, `🚨 ${title}`);
}

/**
 * 成功通知（緑色強調）
 */
export async function sendSlackSuccess(
  webhookUrl: string,
  title: string,
  message: string
): Promise<SlackResult> {
  const blocks: SlackBlock[] = [
    {
      type: "header",
      text: { type: "plain_text", text: `✅ ${title}`, emoji: true },
    },
    {
      type: "section",
      text: { type: "mrkdwn", text: message },
    },
  ];

  return sendSlackBlocks(webhookUrl, blocks, `✅ ${title}`);
}

/**
 * 週次レポート通知
 */
export async function sendSlackReport(
  webhookUrl: string,
  reportTitle: string,
  metrics: Record<string, string | number>,
  reportUrl?: string
): Promise<SlackResult> {
  const blocks: SlackBlock[] = [
    {
      type: "header",
      text: { type: "plain_text", text: `📊 ${reportTitle}`, emoji: true },
    },
    { type: "divider" },
    {
      type: "section",
      fields: Object.entries(metrics).map(([key, value]) => ({
        type: "mrkdwn" as const,
        text: `*${key}*\n${value}`,
      })),
    },
  ];

  if (reportUrl) {
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `<${reportUrl}|📄 レポート全文を見る>`,
      },
    });
  }

  return sendSlackBlocks(webhookUrl, blocks, `📊 ${reportTitle}`);
}

export default {
  sendSlackMessage,
  sendSlackText,
  sendSlackBlocks,
  sendSlackAlert,
  sendSlackSuccess,
  sendSlackReport,
};
