/**
 * 通知モジュール - エクスポート
 */

export {
  sendSlackMessage,
  sendSlackText,
  sendSlackBlocks,
  sendSlackAlert,
  sendSlackSuccess,
  sendSlackReport,
  SlackMessage,
  SlackBlock,
  SlackResult,
} from "./slack";

export {
  sendLineNotify,
  sendLineNotifyWithImage,
  pushLineMessage,
  sendLineAlert,
  sendLineSuccess,
  sendLineReport,
  buildFlexCarousel,
  LineNotifyResult,
  LineMessage,
} from "./line";

export {
  sendEmail,
  sendTextEmail,
  sendHtmlEmail,
  sendEmailWithPdf,
  sendAlertEmail,
  sendReportEmail,
  EmailOptions,
  EmailAttachment,
  EmailResult,
} from "./email";

// 統合通知クラス
export class Notifier {
  private slackWebhookUrl?: string;
  private lineToken?: string;
  private sendgridApiKey?: string;

  constructor(options: {
    slackWebhookUrl?: string;
    lineToken?: string;
    sendgridApiKey?: string;
  } = {}) {
    this.slackWebhookUrl = options.slackWebhookUrl || process.env.SLACK_WEBHOOK_URL;
    this.lineToken = options.lineToken || process.env.LINE_NOTIFY_TOKEN;
    this.sendgridApiKey = options.sendgridApiKey || process.env.SENDGRID_API_KEY;
  }

  /**
   * 全チャネルにアラート送信
   */
  async alert(
    title: string,
    message: string,
    options: {
      details?: Record<string, string>;
      email?: string;
      slack?: boolean;
      line?: boolean;
    } = {}
  ): Promise<{
    slack?: { success: boolean; error?: string };
    line?: { success: boolean; error?: string };
    email?: { success: boolean; error?: string };
  }> {
    const results: {
      slack?: { success: boolean; error?: string };
      line?: { success: boolean; error?: string };
      email?: { success: boolean; error?: string };
    } = {};

    const promises: Promise<void>[] = [];

    // Slack
    if (options.slack !== false && this.slackWebhookUrl) {
      const { sendSlackAlert } = await import("./slack");
      promises.push(
        sendSlackAlert(this.slackWebhookUrl, title, message, options.details)
          .then((r) => { results.slack = r; })
      );
    }

    // LINE
    if (options.line !== false && this.lineToken) {
      const { sendLineAlert: sendLA } = await import("./line");
      promises.push(
        sendLA(this.lineToken, title, message, options.details)
          .then((r) => { results.line = r; })
      );
    }

    // Email
    if (options.email && this.sendgridApiKey) {
      const { sendAlertEmail: sendAE } = await import("./email");
      promises.push(
        sendAE(this.sendgridApiKey, options.email, title, message, options.details)
          .then((r) => { results.email = r; })
      );
    }

    await Promise.all(promises);
    return results;
  }

  /**
   * 全チャネルに成功通知送信
   */
  async success(
    title: string,
    message: string,
    options: {
      slack?: boolean;
      line?: boolean;
    } = {}
  ): Promise<{
    slack?: { success: boolean; error?: string };
    line?: { success: boolean; error?: string };
  }> {
    const results: {
      slack?: { success: boolean; error?: string };
      line?: { success: boolean; error?: string };
    } = {};

    const promises: Promise<void>[] = [];

    if (options.slack !== false && this.slackWebhookUrl) {
      const { sendSlackSuccess } = await import("./slack");
      promises.push(
        sendSlackSuccess(this.slackWebhookUrl, title, message)
          .then((r) => { results.slack = r; })
      );
    }

    if (options.line !== false && this.lineToken) {
      const { sendLineSuccess: sendLS } = await import("./line");
      promises.push(
        sendLS(this.lineToken, title, message)
          .then((r) => { results.line = r; })
      );
    }

    await Promise.all(promises);
    return results;
  }

  /**
   * レポート通知送信
   */
  async report(
    reportTitle: string,
    metrics: Record<string, string | number>,
    options: {
      reportUrl?: string;
      pdfBase64?: string;
      email?: string;
      slack?: boolean;
      line?: boolean;
    } = {}
  ): Promise<{
    slack?: { success: boolean; error?: string };
    line?: { success: boolean; error?: string };
    email?: { success: boolean; error?: string };
  }> {
    const results: {
      slack?: { success: boolean; error?: string };
      line?: { success: boolean; error?: string };
      email?: { success: boolean; error?: string };
    } = {};

    const promises: Promise<void>[] = [];

    if (options.slack !== false && this.slackWebhookUrl) {
      const { sendSlackReport } = await import("./slack");
      promises.push(
        sendSlackReport(this.slackWebhookUrl, reportTitle, metrics, options.reportUrl)
          .then((r) => { results.slack = r; })
      );
    }

    if (options.line !== false && this.lineToken) {
      const { sendLineReport: sendLR } = await import("./line");
      promises.push(
        sendLR(this.lineToken, reportTitle, metrics, options.reportUrl)
          .then((r) => { results.line = r; })
      );
    }

    if (options.email && this.sendgridApiKey) {
      const { sendReportEmail: sendRE } = await import("./email");
      promises.push(
        sendRE(this.sendgridApiKey, options.email, reportTitle, metrics, options.pdfBase64, options.reportUrl)
          .then((r) => { results.email = r; })
      );
    }

    await Promise.all(promises);
    return results;
  }
}

export default Notifier;
