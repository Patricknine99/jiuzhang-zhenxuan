import { createHmac, timingSafeEqual } from "node:crypto";
import { createServer } from "node:http";
import { saveLeadPlaceholder } from "./database.mjs";

const PORT = Number(process.env.PORT || process.env.LEAD_RELAY_PORT || 8787);
const MAX_BODY_BYTES = 64 * 1024;
const REQUEST_TIMEOUT_MS = Number(process.env.LEAD_REQUEST_TIMEOUT_MS || 8000);
const RATE_LIMIT_WINDOW_MS = Number(process.env.LEAD_RATE_LIMIT_WINDOW_MS || 60_000);
const RATE_LIMIT_MAX = Number(process.env.LEAD_RATE_LIMIT_MAX || 20);

const CHANNELS = parseChannels(process.env.LEAD_CHANNELS || "feishu");
const ALLOWED_ORIGINS = parseList(process.env.LEAD_ALLOWED_ORIGINS || "*");
const SHARED_SECRET = process.env.LEAD_RELAY_SECRET || "";
const DRY_RUN = process.env.LEAD_RELAY_DRY_RUN === "true";
const RATE_LIMIT_BUCKETS = new Map();

const server = createServer(async (request, response) => {
  const origin = request.headers.origin || "";
  const requestId = getRequestId();
  setCorsHeaders(response, origin);
  response.setHeader("X-Request-Id", requestId);

  if (request.method === "OPTIONS") {
    response.writeHead(204);
    response.end();
    return;
  }

  const pathname = getPathname(request.url);

  if ((pathname === "/healthz" || pathname === "/readyz") && request.method === "GET") {
    sendJson(response, 200, {
      ok: true,
      status: "ready",
      dryRun: DRY_RUN,
      channels: CHANNELS,
      database: "reserved",
      requestId
    });
    return;
  }

  if (pathname !== "/api/leads") {
    sendError(response, 404, "not_found", "Not found", requestId);
    return;
  }

  if (request.method !== "POST") {
    response.setHeader("Allow", "POST, OPTIONS");
    sendError(response, 405, "method_not_allowed", "Method is not allowed", requestId);
    return;
  }

  if (!isAllowedOrigin(origin)) {
    sendError(response, 403, "origin_not_allowed", "Origin is not allowed", requestId);
    return;
  }

  if (SHARED_SECRET && !isValidSecret(request.headers["x-lead-relay-secret"], SHARED_SECRET)) {
    sendError(response, 401, "invalid_secret", "Invalid relay secret", requestId);
    return;
  }

  if (!isJsonRequest(request)) {
    sendError(response, 415, "unsupported_media_type", "Content-Type must be application/json", requestId);
    return;
  }

  const rateLimit = consumeRateLimit(getClientKey(request));
  if (!rateLimit.ok) {
    response.setHeader("Retry-After", String(Math.ceil(rateLimit.retryAfterMs / 1000)));
    sendError(response, 429, "rate_limited", "Too many requests, please retry later", requestId);
    return;
  }

  try {
    const body = await readJsonBody(request);
    const payload = normalizeLeadPayload(body);
    const results = await submitLeadToChannels(payload, CHANNELS);
    const requiredResults = results.filter((result) => result.channel !== "database");
    const ok = requiredResults.length > 0 && requiredResults.some((result) => result.ok);
    sendJson(response, ok ? 200 : 502, { ok, results, requestId });
  } catch (error) {
    sendError(response, 400, "bad_request", error instanceof Error ? error.message : "Invalid request", requestId);
  }
});

server.listen(PORT, () => {
  console.log(`Lead relay listening on http://127.0.0.1:${PORT}`);
  console.log(`Channels: ${CHANNELS.join(", ") || "none"}${DRY_RUN ? " (dry run)" : ""}`);
});

async function submitLeadToChannels(payload, channels) {
  const databaseResult = await saveLeadPlaceholder(payload);

  if (DRY_RUN) {
    return [databaseResult, ...channels.map((channel) => ({
      ok: true,
      channel,
      message: `Dry run accepted ${payload.type} lead`
    }))];
  }

  const uniqueChannels = Array.from(new Set(channels));
  if (uniqueChannels.length === 0) {
    return [
      databaseResult,
      {
        ok: false,
        channel: "relay",
        message: "No lead channels configured"
      }
    ];
  }

  const channelResults = await Promise.all(
    uniqueChannels.map(async (channel) => {
      try {
        if (channel === "feishu") return await withTimeout(submitToFeishu(payload), REQUEST_TIMEOUT_MS, "Feishu request timed out");
        if (channel === "wecom") return await withTimeout(submitToWeCom(payload), REQUEST_TIMEOUT_MS, "WeCom request timed out");
        if (channel === "dingtalk") return await withTimeout(submitToDingTalk(payload), REQUEST_TIMEOUT_MS, "DingTalk request timed out");
        return { ok: false, channel, message: "Unsupported channel" };
      } catch (error) {
        return {
          ok: false,
          channel,
          message: error instanceof Error ? error.message : "Unknown channel error"
        };
      }
    })
  );
  return [databaseResult, ...channelResults];
}

async function submitToFeishu(payload) {
  const appId = requireEnv("FEISHU_APP_ID");
  const appSecret = requireEnv("FEISHU_APP_SECRET");
  const appToken = requireEnv("FEISHU_APP_TOKEN");
  const tableId =
    payload.type === "demand"
      ? requireEnv("FEISHU_DEMAND_TABLE_ID")
      : requireEnv("FEISHU_APPLICATION_TABLE_ID");
  const tokenResponse = await fetch("https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal", {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({
      app_id: appId,
      app_secret: appSecret
    })
  });
  const tokenData = await tokenResponse.json();
  if (!tokenResponse.ok || tokenData.code !== 0) {
    throw new Error(`Feishu token failed: ${tokenData.msg || tokenResponse.statusText}`);
  }

  const recordResponse = await fetch(
    `https://open.feishu.cn/open-apis/bitable/v1/apps/${appToken}/tables/${tableId}/records`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${tokenData.tenant_access_token}`,
        "Content-Type": "application/json; charset=utf-8"
      },
      body: JSON.stringify({
        fields: toFeishuFields(payload)
      })
    }
  );
  const recordData = await recordResponse.json();
  if (!recordResponse.ok || recordData.code !== 0) {
    throw new Error(`Feishu record failed: ${recordData.msg || recordResponse.statusText}`);
  }

  return { ok: true, channel: "feishu", message: "Feishu record created" };
}

async function submitToWeCom(payload) {
  const webhook = requireEnv("WECOM_BOT_WEBHOOK_URL");
  const mentionedMobileList = parseList(process.env.WECOM_MENTIONED_MOBILE_LIST || "");
  const response = await fetch(webhook, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      msgtype: "text",
      text: {
        content: toNotificationText(payload),
        mentioned_mobile_list: mentionedMobileList
      }
    })
  });
  const data = await response.json();
  if (!response.ok || data.errcode !== 0) {
    throw new Error(`WeCom webhook failed: ${data.errmsg || response.statusText}`);
  }
  return { ok: true, channel: "wecom", message: "WeCom notification sent" };
}

async function submitToDingTalk(payload) {
  const baseWebhook = requireEnv("DINGTALK_BOT_WEBHOOK_URL");
  const webhook = signDingTalkWebhook(baseWebhook, process.env.DINGTALK_BOT_SECRET || "");
  const atMobiles = parseList(process.env.DINGTALK_AT_MOBILES || "");
  const response = await fetch(webhook, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      msgtype: "text",
      text: {
        content: toNotificationText(payload)
      },
      at: {
        atMobiles,
        isAtAll: false
      }
    })
  });
  const data = await response.json();
  if (!response.ok || data.errcode !== 0) {
    throw new Error(`DingTalk webhook failed: ${data.errmsg || response.statusText}`);
  }
  return { ok: true, channel: "dingtalk", message: "DingTalk notification sent" };
}

function normalizeLeadPayload(body) {
  if (!body || typeof body !== "object") throw new Error("Body must be an object");
  if (body.type === "demand") {
    requireString(body.company, "company");
    requireString(body.contactName, "contactName");
    requireString(body.industry, "industry");
    requireString(body.painPoint, "painPoint");
    requireString(body.budgetRange, "budgetRange");
    requireString(body.expectedDelivery, "expectedDelivery");
    return {
      type: "demand",
      company: body.company.trim(),
      contactName: body.contactName.trim(),
      industry: body.industry.trim(),
      painPoint: body.painPoint.trim(),
      budgetRange: body.budgetRange.trim(),
      expectedDelivery: body.expectedDelivery.trim(),
      needRecommend: Boolean(body.needRecommend),
      phone: optionalString(body.phone),
      wechat: optionalString(body.wechat),
      source: optionalString(body.source)
    };
  }

  if (body.type === "application") {
    requireString(body.teamName, "teamName");
    requireArray(body.direction, "direction");
    requireString(body.caseLinks, "caseLinks");
    requireString(body.techStack, "techStack");
    requireString(body.budgetRange, "budgetRange");
    requireString(body.contactPhone, "contactPhone");
    return {
      type: "application",
      teamName: body.teamName.trim(),
      direction: body.direction.map((item) => String(item).trim()).filter(Boolean),
      caseLinks: body.caseLinks.trim(),
      techStack: body.techStack.trim(),
      budgetRange: body.budgetRange.trim(),
      canInvoice: Boolean(body.canInvoice),
      contactPhone: body.contactPhone.trim(),
      contactWechat: optionalString(body.contactWechat)
    };
  }

  throw new Error("Unsupported lead type");
}

function toFeishuFields(payload) {
  if (payload.type === "demand") {
    return {
      company: payload.company,
      contact_name: payload.contactName,
      industry: payload.industry,
      pain_point: payload.painPoint,
      budget_range: payload.budgetRange,
      expected_delivery: payload.expectedDelivery,
      need_recommend: payload.needRecommend,
      phone: payload.phone || "",
      wechat: payload.wechat || "",
      created_at: Date.now()
    };
  }

  return {
    team_name: payload.teamName,
    direction: payload.direction,
    case_links: payload.caseLinks,
    tech_stack: payload.techStack,
    budget_range: payload.budgetRange,
    can_invoice: payload.canInvoice,
    contact_phone: payload.contactPhone,
    contact_wechat: payload.contactWechat || "",
    created_at: Date.now()
  };
}

function toNotificationText(payload) {
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

function signDingTalkWebhook(webhook, secret) {
  if (!secret) return webhook;
  const timestamp = Date.now();
  const sign = createHmac("sha256", secret)
    .update(`${timestamp}\n${secret}`)
    .digest("base64");
  const url = new URL(webhook);
  url.searchParams.set("timestamp", String(timestamp));
  url.searchParams.set("sign", sign);
  return url.toString();
}

function setCorsHeaders(response, origin) {
  const allowedOrigin = ALLOWED_ORIGINS.includes("*") ? "*" : origin;
  response.setHeader("Access-Control-Allow-Origin", allowedOrigin);
  response.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type, X-Lead-Relay-Secret");
  response.setHeader("Vary", "Origin");
}

function isAllowedOrigin(origin) {
  if (ALLOWED_ORIGINS.includes("*")) return true;
  if (!origin) return true;
  return ALLOWED_ORIGINS.includes(origin);
}

function isValidSecret(input, expected) {
  if (typeof input !== "string") return false;
  const inputBuffer = Buffer.from(input);
  const expectedBuffer = Buffer.from(expected);
  if (inputBuffer.length !== expectedBuffer.length) return false;
  return timingSafeEqual(inputBuffer, expectedBuffer);
}

function readJsonBody(request) {
  return new Promise((resolve, reject) => {
    let raw = "";
    request.setEncoding("utf8");
    request.on("data", (chunk) => {
      raw += chunk;
      if (Buffer.byteLength(raw, "utf8") > MAX_BODY_BYTES) {
        reject(new Error("Request body is too large"));
        request.destroy();
      }
    });
    request.on("end", () => {
      try {
        resolve(JSON.parse(raw || "{}"));
      } catch {
        reject(new Error("Request body must be valid JSON"));
      }
    });
    request.on("error", reject);
  });
}

function sendJson(response, status, body) {
  response.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(body));
}

function sendError(response, status, code, message, requestId) {
  sendJson(response, status, {
    ok: false,
    error: { code, message },
    message,
    requestId
  });
}

function getPathname(url) {
  try {
    return new URL(url || "/", "http://relay.local").pathname;
  } catch {
    return "/";
  }
}

function isJsonRequest(request) {
  const contentType = request.headers["content-type"];
  return typeof contentType === "string" && contentType.toLowerCase().includes("application/json");
}

function getClientKey(request) {
  const forwardedFor = request.headers["x-forwarded-for"];
  if (typeof forwardedFor === "string" && forwardedFor.trim()) return forwardedFor.split(",")[0].trim();
  return request.socket.remoteAddress || "unknown";
}

function consumeRateLimit(key) {
  const now = Date.now();
  const bucket = RATE_LIMIT_BUCKETS.get(key);
  if (!bucket || now > bucket.resetAt) {
    RATE_LIMIT_BUCKETS.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { ok: true, retryAfterMs: 0 };
  }
  if (bucket.count >= RATE_LIMIT_MAX) {
    return { ok: false, retryAfterMs: bucket.resetAt - now };
  }
  bucket.count += 1;
  return { ok: true, retryAfterMs: 0 };
}

function getRequestId() {
  return `lead_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function withTimeout(promise, timeoutMs, message) {
  let timeout;
  const timeoutPromise = new Promise((_, reject) => {
    timeout = setTimeout(() => reject(new Error(message)), timeoutMs);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timeout));
}

function parseChannels(value) {
  return parseList(value).filter((item) => item === "feishu" || item === "wecom" || item === "dingtalk");
}

function parseList(value) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function requireEnv(key) {
  const value = process.env[key];
  if (!value) throw new Error(`Missing env: ${key}`);
  return value;
}

function requireString(value, key) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`Missing field: ${key}`);
  }
}

function requireArray(value, key) {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error(`Missing field: ${key}`);
  }
}

function optionalString(value) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function shutdown(signal) {
  console.log(`Received ${signal}, closing lead relay...`);
  server.close(() => {
    console.log("Lead relay closed");
    process.exit(0);
  });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
