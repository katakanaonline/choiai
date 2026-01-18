/**
 * LINE通知モジュール
 * LINE Notify / LINE Messaging API 経由で通知送信
 */

export interface LineNotifyResult {
  success: boolean;
  error?: string;
}

export interface LineMessage {
  type: "text" | "image" | "flex";
  text?: string;
  imageUrl?: string;
  flexContent?: unknown;
}

/**
 * LINE Notify でメッセージ送信
 * @param token LINE Notifyのアクセストークン
 * @param message 送信するメッセージ
 */
export async function sendLineNotify(
  token: string,
  message: string
): Promise<LineNotifyResult> {
  try {
    const response = await fetch("https://notify-api.line.me/api/notify", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Bearer ${token}`,
      },
      body: new URLSearchParams({ message }).toString(),
    });

    if (!response.ok) {
      const data = await response.json();
      return {
        success: false,
        error: data.message || `HTTP ${response.status}`,
      };
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
 * LINE Notify で画像付きメッセージ送信
 */
export async function sendLineNotifyWithImage(
  token: string,
  message: string,
  imageUrl: string,
  thumbnailUrl?: string
): Promise<LineNotifyResult> {
  try {
    const params = new URLSearchParams({
      message,
      imageThumbnail: thumbnailUrl || imageUrl,
      imageFullsize: imageUrl,
    });

    const response = await fetch("https://notify-api.line.me/api/notify", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Bearer ${token}`,
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const data = await response.json();
      return {
        success: false,
        error: data.message || `HTTP ${response.status}`,
      };
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
 * LINE Messaging API でプッシュメッセージ送信
 * @param channelAccessToken チャネルアクセストークン
 * @param to 送信先（ユーザーID or グループID）
 * @param messages メッセージ配列
 */
export async function pushLineMessage(
  channelAccessToken: string,
  to: string,
  messages: LineMessage[]
): Promise<LineNotifyResult> {
  try {
    const lineMessages = messages.map((msg) => {
      if (msg.type === "text") {
        return { type: "text", text: msg.text };
      } else if (msg.type === "image") {
        return {
          type: "image",
          originalContentUrl: msg.imageUrl,
          previewImageUrl: msg.imageUrl,
        };
      } else if (msg.type === "flex") {
        return { type: "flex", altText: "メッセージ", contents: msg.flexContent };
      }
      return { type: "text", text: msg.text || "" };
    });

    const response = await fetch("https://api.line.me/v2/bot/message/push", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${channelAccessToken}`,
      },
      body: JSON.stringify({ to, messages: lineMessages }),
    });

    if (!response.ok) {
      const data = await response.json();
      return {
        success: false,
        error: data.message || `HTTP ${response.status}`,
      };
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
 * アラート通知（LINE Notify）
 */
export async function sendLineAlert(
  token: string,
  title: string,
  message: string,
  details?: Record<string, string>
): Promise<LineNotifyResult> {
  let text = `\n🚨 ${title}\n\n${message}`;

  if (details && Object.keys(details).length > 0) {
    text += "\n\n【詳細】";
    for (const [key, value] of Object.entries(details)) {
      text += `\n・${key}: ${value}`;
    }
  }

  return sendLineNotify(token, text);
}

/**
 * 成功通知（LINE Notify）
 */
export async function sendLineSuccess(
  token: string,
  title: string,
  message: string
): Promise<LineNotifyResult> {
  const text = `\n✅ ${title}\n\n${message}`;
  return sendLineNotify(token, text);
}

/**
 * 週次レポート通知（LINE Notify）
 */
export async function sendLineReport(
  token: string,
  reportTitle: string,
  metrics: Record<string, string | number>,
  reportUrl?: string
): Promise<LineNotifyResult> {
  let text = `\n📊 ${reportTitle}\n`;

  for (const [key, value] of Object.entries(metrics)) {
    text += `\n・${key}: ${value}`;
  }

  if (reportUrl) {
    text += `\n\n詳細: ${reportUrl}`;
  }

  return sendLineNotify(token, text);
}

/**
 * Flex Message ビルダー（カルーセル）
 */
export function buildFlexCarousel(
  items: Array<{
    title: string;
    description: string;
    imageUrl?: string;
    actionUrl?: string;
  }>
): unknown {
  return {
    type: "carousel",
    contents: items.map((item) => ({
      type: "bubble",
      hero: item.imageUrl
        ? {
            type: "image",
            url: item.imageUrl,
            size: "full",
            aspectRatio: "20:13",
            aspectMode: "cover",
          }
        : undefined,
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: item.title,
            weight: "bold",
            size: "lg",
          },
          {
            type: "text",
            text: item.description,
            size: "sm",
            color: "#666666",
            margin: "md",
            wrap: true,
          },
        ],
      },
      footer: item.actionUrl
        ? {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "button",
                action: {
                  type: "uri",
                  label: "詳細を見る",
                  uri: item.actionUrl,
                },
                style: "primary",
              },
            ],
          }
        : undefined,
    })),
  };
}

export default {
  sendLineNotify,
  sendLineNotifyWithImage,
  pushLineMessage,
  sendLineAlert,
  sendLineSuccess,
  sendLineReport,
  buildFlexCarousel,
};
