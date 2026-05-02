import "../relay/env.mjs";

const requiredForProduction = [
  "LEAD_RELAY_SECRET",
  "LEAD_ALLOWED_ORIGINS",
  "LEAD_CHANNELS",
  "DATABASE_URL",
  "REDIS_URL",
  "ADMIN_BOOTSTRAP_EMAIL",
  "ADMIN_BOOTSTRAP_PASSWORD",
  "ADMIN_BOOTSTRAP_ROLE"
];

const channelEnv = {
  feishu: ["FEISHU_APP_ID", "FEISHU_APP_SECRET", "FEISHU_APP_TOKEN", "FEISHU_DEMAND_TABLE_ID", "FEISHU_APPLICATION_TABLE_ID"],
  wecom: ["WECOM_BOT_WEBHOOK_URL"],
  dingtalk: ["DINGTALK_BOT_WEBHOOK_URL"]
};

const missing = [];
for (const key of requiredForProduction) {
  if (!process.env[key]) missing.push(key);
}

const channels = (process.env.LEAD_CHANNELS || "")
  .split(",")
  .map((item) => item.trim())
  .filter(Boolean);

for (const channel of channels) {
  for (const key of channelEnv[channel] || []) {
    if (!process.env[key]) missing.push(key);
  }
}

if (process.env.LEAD_RELAY_DRY_RUN === "true") {
  console.warn("Warning: LEAD_RELAY_DRY_RUN=true. Production should set it to false.");
}

if (!process.env.LEAD_RELAY_SECRET || process.env.LEAD_RELAY_SECRET.length < 32 || process.env.LEAD_RELAY_SECRET.includes("replace-with")) {
  missing.push("LEAD_RELAY_SECRET(non-default, >=32 chars)");
}

if (process.env.ADMIN_BOOTSTRAP_PASSWORD === "change-admin-password") {
  missing.push("ADMIN_BOOTSTRAP_PASSWORD(non-default)");
}

if (!process.env.ADMIN_BOOTSTRAP_PASSWORD || process.env.ADMIN_BOOTSTRAP_PASSWORD.includes("replace-with") || process.env.ADMIN_BOOTSTRAP_PASSWORD.length < 12) {
  missing.push("ADMIN_BOOTSTRAP_PASSWORD(non-default, >=12 chars)");
}

if (process.env.LEAD_CAPTCHA_REQUIRED !== "true") {
  missing.push("LEAD_CAPTCHA_REQUIRED=true");
}

if (!process.env.NEXT_PUBLIC_CAPTCHA_PROVIDER || !process.env.CAPTCHA_PROVIDER || !process.env.CAPTCHA_SECRET_KEY) {
  missing.push("NEXT_PUBLIC_CAPTCHA_PROVIDER", "CAPTCHA_PROVIDER", "CAPTCHA_SECRET_KEY");
}

const wechatPayKeys = ["WECHAT_PAY_APP_ID", "WECHAT_PAY_MCH_ID", "WECHAT_PAY_SERIAL_NO", "WECHAT_PAY_PRIVATE_KEY", "WECHAT_PAY_API_V3_KEY"];
const hasAnyWechatPay = wechatPayKeys.some((key) => Boolean(process.env[key]));
if (hasAnyWechatPay) {
  for (const key of wechatPayKeys) {
    if (!process.env[key]) missing.push(key);
  }
}

if (missing.length > 0) {
  console.error(`Missing production env vars:\n${Array.from(new Set(missing)).join("\n")}`);
  process.exit(1);
}

console.log("Production env check passed.");
