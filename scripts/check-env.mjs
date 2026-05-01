const requiredForProduction = [
  "LEAD_RELAY_SECRET",
  "LEAD_ALLOWED_ORIGINS",
  "LEAD_CHANNELS"
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

if (missing.length > 0) {
  console.error(`Missing production env vars:\n${Array.from(new Set(missing)).join("\n")}`);
  process.exit(1);
}

console.log("Production env check passed.");
