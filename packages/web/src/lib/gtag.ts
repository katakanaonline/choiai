export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

declare global {
  interface Window {
    gtag: (
      command: "config" | "event" | "js",
      targetId: string | Date,
      config?: Record<string, unknown>
    ) => void;
  }
}

export const pageview = (url: string) => {
  if (typeof window !== "undefined" && window.gtag && GA_MEASUREMENT_ID) {
    window.gtag("config", GA_MEASUREMENT_ID, {
      page_path: url,
    });
  }
};

export const event = ({
  action,
  category,
  label,
  value,
}: {
  action: string;
  category: string;
  label?: string;
  value?: number;
}) => {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
};

// ツール利用イベント
export const trackToolUsage = (toolName: string, action: "start" | "complete" | "error") => {
  event({
    action: `tool_${action}`,
    category: "tool_usage",
    label: toolName,
  });
};

// CTA クリックイベント
export const trackCTAClick = (ctaName: string) => {
  event({
    action: "cta_click",
    category: "engagement",
    label: ctaName,
  });
};
