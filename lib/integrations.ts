export type LeadChannel = "feishu" | "wecom" | "dingtalk";

export type DemandLead = {
  type: "demand";
  company: string;
  contactName: string;
  industry: string;
  painPoint: string;
  budgetRange: string;
  expectedDelivery: string;
  needRecommend: boolean;
  phone?: string;
  wechat?: string;
  context?: string;
  source?: string;
};

export type ApplicationLead = {
  type: "application";
  teamName: string;
  direction: string[];
  caseLinks: string;
  techStack: string;
  budgetRange: string;
  canInvoice: boolean;
  contactPhone: string;
  contactWechat?: string;
};

export type LeadPayload = DemandLead | ApplicationLead;

export type LeadSubmissionResult = {
  ok: boolean;
  channel: LeadChannel | "database" | "relay";
  message: string;
};

export type LeadIntegrationConfig = {
  feishu?: {
    appId: string;
    appSecret: string;
    appToken: string;
    demandTableId: string;
    applicationTableId: string;
  };
  wecom?: {
    botWebhookUrl: string;
    mentionedMobileList?: string[];
  };
  dingtalk?: {
    botWebhookUrl: string;
    secret?: string;
    atMobiles?: string[];
  };
};

// Future integration contract:
// - Feishu: write to Bitable tables and optionally notify a Feishu group.
// - WeCom: notify an internal group bot or create a customer-contact follow-up.
// - DingTalk: notify a group bot or trigger an approval/workflow.
// Keep credentials server-side only; static pages should call a secure relay.
export async function submitLeadToChannels(
  payload: LeadPayload,
  channels: LeadChannel[]
): Promise<LeadSubmissionResult[]> {
  void payload;
  return channels.map((channel) => ({
    ok: false,
    channel,
    message: "Pending secure server-side integration."
  }));
}

// toNotificationText has been removed — the canonical implementation lives in relay/lead-relay.mjs.
// Avoid maintaining duplicate notification templates across frontend and backend.


export function getTargetChannelsFromEnv(value?: string): LeadChannel[] {
  if (!value) return ["feishu"];
  return value
    .split(",")
    .map((item) => item.trim())
    .filter((item): item is LeadChannel => item === "feishu" || item === "wecom" || item === "dingtalk");
}
