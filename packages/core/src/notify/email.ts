/**
 * メール通知モジュール
 * SendGrid API 経由でメール送信
 */

export interface EmailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  from?: string;
  fromName?: string;
  replyTo?: string;
  attachments?: EmailAttachment[];
}

export interface EmailAttachment {
  content: string; // Base64 encoded
  filename: string;
  type?: string; // MIME type
  disposition?: "attachment" | "inline";
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * SendGrid でメール送信
 */
export async function sendEmail(
  apiKey: string,
  options: EmailOptions
): Promise<EmailResult> {
  const from = options.from || process.env.SENDGRID_FROM_EMAIL;
  if (!from) {
    return { success: false, error: "From email address is required" };
  }

  const toArray = Array.isArray(options.to) ? options.to : [options.to];

  const body = {
    personalizations: [
      {
        to: toArray.map((email) => ({ email })),
      },
    ],
    from: {
      email: from,
      name: options.fromName || undefined,
    },
    reply_to: options.replyTo ? { email: options.replyTo } : undefined,
    subject: options.subject,
    content: [
      options.text ? { type: "text/plain", value: options.text } : null,
      options.html ? { type: "text/html", value: options.html } : null,
    ].filter(Boolean),
    attachments: options.attachments?.map((att) => ({
      content: att.content,
      filename: att.filename,
      type: att.type || "application/octet-stream",
      disposition: att.disposition || "attachment",
    })),
  };

  try {
    const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      return {
        success: false,
        error: errorData?.errors?.[0]?.message || `HTTP ${response.status}`,
      };
    }

    const messageId = response.headers.get("X-Message-Id") || undefined;

    return { success: true, messageId };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * シンプルなテキストメール送信
 */
export async function sendTextEmail(
  apiKey: string,
  to: string,
  subject: string,
  text: string
): Promise<EmailResult> {
  return sendEmail(apiKey, { to, subject, text });
}

/**
 * HTMLメール送信
 */
export async function sendHtmlEmail(
  apiKey: string,
  to: string,
  subject: string,
  html: string,
  text?: string
): Promise<EmailResult> {
  return sendEmail(apiKey, { to, subject, html, text });
}

/**
 * PDF添付メール送信
 */
export async function sendEmailWithPdf(
  apiKey: string,
  to: string,
  subject: string,
  body: string,
  pdfBase64: string,
  pdfFilename: string
): Promise<EmailResult> {
  return sendEmail(apiKey, {
    to,
    subject,
    text: body,
    attachments: [
      {
        content: pdfBase64,
        filename: pdfFilename,
        type: "application/pdf",
      },
    ],
  });
}

/**
 * アラートメール送信
 */
export async function sendAlertEmail(
  apiKey: string,
  to: string,
  title: string,
  message: string,
  details?: Record<string, string>
): Promise<EmailResult> {
  let text = `🚨 ${title}\n\n${message}`;

  if (details && Object.keys(details).length > 0) {
    text += "\n\n【詳細】";
    for (const [key, value] of Object.entries(details)) {
      text += `\n・${key}: ${value}`;
    }
  }

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #dc2626;">🚨 ${title}</h1>
      <p style="font-size: 16px; line-height: 1.6;">${message.replace(/\n/g, "<br>")}</p>
      ${
        details
          ? `
        <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin-top: 16px;">
          <h3 style="margin: 0 0 8px 0;">詳細</h3>
          ${Object.entries(details)
            .map(([k, v]) => `<p style="margin: 4px 0;"><strong>${k}:</strong> ${v}</p>`)
            .join("")}
        </div>
      `
          : ""
      }
    </div>
  `;

  return sendEmail(apiKey, {
    to,
    subject: `[アラート] ${title}`,
    text,
    html,
  });
}

/**
 * 週次レポートメール送信
 */
export async function sendReportEmail(
  apiKey: string,
  to: string,
  reportTitle: string,
  metrics: Record<string, string | number>,
  pdfBase64?: string,
  reportUrl?: string
): Promise<EmailResult> {
  let text = `📊 ${reportTitle}\n`;

  for (const [key, value] of Object.entries(metrics)) {
    text += `\n・${key}: ${value}`;
  }

  if (reportUrl) {
    text += `\n\n詳細レポート: ${reportUrl}`;
  }

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #2563eb;">📊 ${reportTitle}</h1>
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        ${Object.entries(metrics)
          .map(
            ([k, v]) => `
          <tr>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">${k}</td>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">${v}</td>
          </tr>
        `
          )
          .join("")}
      </table>
      ${reportUrl ? `<p><a href="${reportUrl}" style="color: #2563eb;">詳細レポートを見る →</a></p>` : ""}
      ${pdfBase64 ? "<p style='color: #666;'>※ PDFレポートを添付しています</p>" : ""}
    </div>
  `;

  const attachments: EmailAttachment[] = [];
  if (pdfBase64) {
    attachments.push({
      content: pdfBase64,
      filename: `${reportTitle.replace(/\s/g, "_")}.pdf`,
      type: "application/pdf",
    });
  }

  return sendEmail(apiKey, {
    to,
    subject: reportTitle,
    text,
    html,
    attachments: attachments.length > 0 ? attachments : undefined,
  });
}

export default {
  sendEmail,
  sendTextEmail,
  sendHtmlEmail,
  sendEmailWithPdf,
  sendAlertEmail,
  sendReportEmail,
};
