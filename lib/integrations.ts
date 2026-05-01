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

export function toNotificationText(payload: LeadPayload) {
  if (payload.type === "demand") {
    return [
      "新的企业 AI 需求",
      `公司：${payload.company}`,
      `联系人：${payload.contactName}`,
      `行业：${payload.industry}`,
      `预算：${payload.budgetRange}`,
      `期望交付：${payload.expectedDelivery}`,
      `需要推荐：${payload.needRecommend ? "是" : "否"}`,
      `手机号：${payload.phone || "未填写"}`,
      `微信号：${payload.wechat || "未填写"}`,
      `业务痛点：${payload.painPoint}`
    ].join("\n");
  }

  return [
    "新的服务商入驻申请",
    `团队/个人：${payload.teamName}`,
    `擅长方向：${payload.direction.join("、")}`,
    `预算区间：${payload.budgetRange}`,
    `可开票：${payload.canInvoice ? "是" : "否"}`,
    `手机号：${payload.contactPhone}`,
    `微信号：${payload.contactWechat || "未填写"}`,
    `技术栈：${payload.techStack}`,
    `案例链接：${payload.caseLinks}`
  ].join("\n");
}

export function getTargetChannelsFromEnv(value?: string): LeadChannel[] {
  if (!value) return ["feishu"];
  return value
    .split(",")
    .map((item) => item.trim())
    .filter((item): item is LeadChannel => item === "feishu" || item === "wecom" || item === "dingtalk");
}
