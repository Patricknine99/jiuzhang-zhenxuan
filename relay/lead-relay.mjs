import { createHmac, randomBytes, randomInt, scryptSync, timingSafeEqual } from "node:crypto";
import { createServer } from "node:http";
import { saveLeadPlaceholder } from "./database.mjs";

const PORT = Number(process.env.PORT || process.env.LEAD_RELAY_PORT || 8787);
const MAX_BODY_BYTES = 64 * 1024;
const REQUEST_TIMEOUT_MS = Number(process.env.LEAD_REQUEST_TIMEOUT_MS || 8000);
const RATE_LIMIT_WINDOW_MS = Number(process.env.LEAD_RATE_LIMIT_WINDOW_MS || 60_000);
const RATE_LIMIT_MAX = Number(process.env.LEAD_RATE_LIMIT_MAX || 20);
const CHANNEL_RETRY_COUNT = Number(process.env.LEAD_CHANNEL_RETRY_COUNT || 1);
const CHANNEL_RETRY_BASE_MS = Number(process.env.LEAD_CHANNEL_RETRY_BASE_MS || 250);
const CAPTCHA_REQUIRED = process.env.LEAD_CAPTCHA_REQUIRED === "true";
const TURNSTILE_SECRET_KEY = process.env.TURNSTILE_SECRET_KEY || "";
const AUTH_CODE_TTL_MS = Number(process.env.AUTH_CODE_TTL_MS || 5 * 60_000);
const AUTH_CODE_MAX_ATTEMPTS = Number(process.env.AUTH_CODE_MAX_ATTEMPTS || 5);

const CHANNELS = parseChannels(process.env.LEAD_CHANNELS || "feishu");
const ALLOWED_ORIGINS = parseList(process.env.LEAD_ALLOWED_ORIGINS || "*");
const SHARED_SECRET = process.env.LEAD_RELAY_SECRET || "";
const DRY_RUN = process.env.LEAD_RELAY_DRY_RUN === "true";
const RATE_LIMIT_BUCKETS = new Map();
const AUTH_CODE_BUCKETS = new Map();
const AUTH_ACCOUNTS = new Map();

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
      rateLimit: {
        windowMs: RATE_LIMIT_WINDOW_MS,
        max: RATE_LIMIT_MAX
      },
      retry: {
        count: CHANNEL_RETRY_COUNT,
        baseMs: CHANNEL_RETRY_BASE_MS
      },
      captcha: {
        required: CAPTCHA_REQUIRED,
        provider: "turnstile",
        configured: Boolean(TURNSTILE_SECRET_KEY)
      },
      auth: {
        codeTtlMs: AUTH_CODE_TTL_MS,
        codeMaxAttempts: AUTH_CODE_MAX_ATTEMPTS,
        passwordRequired: true,
        newDeviceVerification: true,
        oauthReserved: ["wechat", "wecom", "feishu"]
      },
      payments: {
        wechatPayReserved: true,
        configured: hasWechatPayConfig()
      },
      requestId
    });
    return;
  }

  if (pathname === "/api/leads") {
    await handleLeadRequest(request, response, origin, requestId);
    return;
  }

  if (pathname === "/api/auth/code") {
    await handleAuthCodeRequest(request, response, origin, requestId);
    return;
  }

  if (pathname === "/api/auth/session") {
    await handleAuthSessionRequest(request, response, origin, requestId);
    return;
  }

  if (pathname === "/api/payments/wechat/prepay") {
    await handleWechatPrepayRequest(request, response, origin, requestId);
    return;
  }

  if (!["/api/leads", "/api/auth/code", "/api/auth/session", "/api/payments/wechat/prepay"].includes(pathname)) {
    sendError(response, 404, "not_found", "Not found", requestId);
    return;
  }
});

server.listen(PORT, () => {
  console.log(`Lead relay listening on http://127.0.0.1:${PORT}`);
  console.log(`Channels: ${CHANNELS.join(", ") || "none"}${DRY_RUN ? " (dry run)" : ""}`);
});

async function handleLeadRequest(request, response, origin, requestId) {
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
    await verifyCaptchaToken(body.captchaToken, getClientKey(request), requestId);
    const payload = normalizeLeadPayload(body);
    const results = await submitLeadToChannels(payload, CHANNELS);
    const requiredResults = results.filter((result) => result.channel !== "database");
    const allOk = requiredResults.length > 0 && requiredResults.every((result) => result.ok);
    const anyOk = requiredResults.length > 0 && requiredResults.some((result) => result.ok);
    const partialFailure = anyOk && !allOk;
    sendJson(response, anyOk ? 200 : 502, {
      ok: anyOk,
      partialFailure,
      results,
      requestId
    });
  } catch (error) {
    sendError(response, 400, "bad_request", error instanceof Error ? error.message : "Invalid request", requestId);
  }
}

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
        if (channel === "feishu") return await submitWithRetry(channel, () => submitToFeishu(payload), "Feishu request timed out");
        if (channel === "wecom") return await submitWithRetry(channel, () => submitToWeCom(payload), "WeCom request timed out");
        if (channel === "dingtalk") return await submitWithRetry(channel, () => submitToDingTalk(payload), "DingTalk request timed out");
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

async function handleAuthCodeRequest(request, response, origin, requestId) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST, OPTIONS");
    sendError(response, 405, "method_not_allowed", "Method is not allowed", requestId);
    return;
  }
  if (!isAllowedOrigin(origin)) {
    sendError(response, 403, "origin_not_allowed", "Origin is not allowed", requestId);
    return;
  }
  if (!isJsonRequest(request)) {
    sendError(response, 415, "unsupported_media_type", "Content-Type must be application/json", requestId);
    return;
  }
  const rateLimit = consumeRateLimit(`auth:${getClientKey(request)}`);
  if (!rateLimit.ok) {
    response.setHeader("Retry-After", String(Math.ceil(rateLimit.retryAfterMs / 1000)));
    sendError(response, 429, "rate_limited", "Too many auth requests, please retry later", requestId);
    return;
  }

  try {
    const body = await readJsonBody(request);
    await verifyCaptchaToken(body.captchaToken, getClientKey(request), requestId);
    const method = normalizeAuthMethod(body.method);
    const identifier = normalizeAuthIdentifier(method, body.identifier);
    const purpose = body.purpose === "register" ? "register" : "login";
    const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
    AUTH_CODE_BUCKETS.set(getAuthCodeKey(method, identifier, purpose), {
      codeHash: signValue(code),
      expiresAt: Date.now() + AUTH_CODE_TTL_MS,
      attempts: 0
    });

    sendJson(response, 200, {
      ok: true,
      requestId,
      expiresInSeconds: Math.floor(AUTH_CODE_TTL_MS / 1000),
      delivery: DRY_RUN ? "dry_run" : "reserved_provider",
      devCode: DRY_RUN ? code : undefined,
      message: DRY_RUN ? "Dry-run auth code generated. Do not expose devCode in production." : "Auth code accepted by relay."
    });
  } catch (error) {
    sendError(response, 400, "bad_request", error instanceof Error ? error.message : "Invalid auth request", requestId);
  }
}

async function handleAuthSessionRequest(request, response, origin, requestId) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST, OPTIONS");
    sendError(response, 405, "method_not_allowed", "Method is not allowed", requestId);
    return;
  }
  if (!isAllowedOrigin(origin)) {
    sendError(response, 403, "origin_not_allowed", "Origin is not allowed", requestId);
    return;
  }
  if (!isJsonRequest(request)) {
    sendError(response, 415, "unsupported_media_type", "Content-Type must be application/json", requestId);
    return;
  }

  try {
    const body = await readJsonBody(request);
    const method = normalizeAuthMethod(body.method);
    const identifier = normalizeAuthIdentifier(method, body.identifier);
    const purpose = body.purpose === "register" ? "register" : "login";
    const role = body.role === "provider" ? "provider" : "buyer";
    const password = normalizePassword(body.password);
    const deviceId = normalizeDeviceId(body.deviceId);
    const accountKey = getAccountKey(method, identifier);
    const existingAccount = AUTH_ACCOUNTS.get(accountKey);

    if (purpose === "register") {
      if (existingAccount) throw new Error("该账号已注册，请直接登录");
      verifyAuthCode(method, identifier, purpose, body.code);
      const account = createAuthAccount({ method, identifier, role, password, deviceId });
      AUTH_ACCOUNTS.set(accountKey, account);
      sendJson(response, 200, {
        ok: true,
        requestId,
        trustedDevice: true,
        account: toPublicAccount(account)
      });
      return;
    }

    if (!existingAccount) throw new Error(DRY_RUN ? "账号不存在。dry-run 模式请先注册一次。" : "账号或密码不正确");
    if (!verifyPassword(password, existingAccount.passwordHash)) throw new Error("账号或密码不正确");

    const isTrustedDevice = existingAccount.trustedDevices.has(deviceId);
    if (!isTrustedDevice) {
      if (!body.code) {
        sendJson(response, 202, {
          ok: false,
          requestId,
          requiresVerification: true,
          message: "新设备登录需要验证码"
        });
        return;
      }
      verifyAuthCode(method, identifier, purpose, body.code);
      existingAccount.trustedDevices.add(deviceId);
    }

    sendJson(response, 200, {
      ok: true,
      requestId,
      trustedDevice: true,
      account: toPublicAccount(existingAccount)
    });
  } catch (error) {
    sendError(response, 400, "bad_request", error instanceof Error ? error.message : "Invalid auth request", requestId);
  }
}

async function handleWechatPrepayRequest(request, response, origin, requestId) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST, OPTIONS");
    sendError(response, 405, "method_not_allowed", "Method is not allowed", requestId);
    return;
  }
  if (!isAllowedOrigin(origin)) {
    sendError(response, 403, "origin_not_allowed", "Origin is not allowed", requestId);
    return;
  }
  if (!isJsonRequest(request)) {
    sendError(response, 415, "unsupported_media_type", "Content-Type must be application/json", requestId);
    return;
  }

  await readJsonBody(request);
  sendJson(response, hasWechatPayConfig() ? 501 : 503, {
    ok: false,
    requestId,
    error: {
      code: hasWechatPayConfig() ? "wechat_pay_not_implemented" : "wechat_pay_not_configured",
      message: hasWechatPayConfig()
        ? "WeChat Pay configuration is present, but signed prepay request implementation is intentionally not enabled yet."
        : "WeChat Pay is reserved but not configured. Set WECHAT_PAY_* server-side variables before enabling payments."
    }
  });
}

async function submitWithRetry(channel, submit, timeoutMessage) {
  let lastError;
  const maxAttempts = Math.max(1, CHANNEL_RETRY_COUNT + 1);
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const result = await withTimeout(submit(), REQUEST_TIMEOUT_MS, timeoutMessage);
      return attempt > 1 ? { ...result, message: `${result.message} after ${attempt} attempts` } : result;
    } catch (error) {
      lastError = error;
      if (attempt < maxAttempts) await delay(CHANNEL_RETRY_BASE_MS * attempt);
    }
  }
  throw new Error(
    `${channel} failed after ${maxAttempts} attempts: ${lastError instanceof Error ? lastError.message : "Unknown error"}`
  );
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

  // Honeypot detection — reject payloads where a hidden field has been filled.
  if (typeof body["jiuzhang_website_url"] === "string" && body["jiuzhang_website_url"].trim()) {
    throw new Error("Suspicious submission detected");
  }

  if (body.type === "demand") {
    requireString(body.company, "company", 80);
    requireString(body.contactName, "contactName", 40);
    requireString(body.industry, "industry", 40);
    requireString(body.painPoint, "painPoint", 2000);
    requireString(body.budgetRange, "budgetRange", 40);
    requireString(body.expectedDelivery, "expectedDelivery", 40);
    return {
      type: "demand",
      company: cleanString(body.company, 80),
      contactName: cleanString(body.contactName, 40),
      industry: cleanString(body.industry, 40),
      painPoint: cleanString(body.painPoint, 2000),
      budgetRange: cleanString(body.budgetRange, 40),
      expectedDelivery: cleanString(body.expectedDelivery, 40),
      needRecommend: Boolean(body.needRecommend),
      phone: optionalPhone(body.phone, "phone"),
      wechat: optionalString(body.wechat, 80),
      context: optionalString(body.context, 200),
      source: optionalUrl(body.source)
    };
  }

  if (body.type === "application") {
    requireString(body.teamName, "teamName", 80);
    requireArray(body.direction, "direction");
    requireString(body.caseLinks, "caseLinks", 2000);
    requireString(body.techStack, "techStack", 1000);
    requireString(body.budgetRange, "budgetRange", 40);
    requireString(body.contactPhone, "contactPhone", 30);
    return {
      type: "application",
      teamName: cleanString(body.teamName, 80),
      direction: body.direction.map((item) => cleanString(String(item), 40)).filter(Boolean).slice(0, 12),
      caseLinks: cleanString(body.caseLinks, 2000),
      techStack: cleanString(body.techStack, 1000),
      budgetRange: cleanString(body.budgetRange, 40),
      canInvoice: Boolean(body.canInvoice),
      contactPhone: requirePhone(body.contactPhone, "contactPhone"),
      contactWechat: optionalString(body.contactWechat, 80)
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
      context: payload.context || "",
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
      `咨询上下文：${payload.context || "未带入"}`,
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
  // Only set Vary when origin is not wildcard — * is cachable for all origins.
  if (allowedOrigin !== "*") {
    response.setHeader("Vary", "Origin");
  }
}

function isAllowedOrigin(origin) {
  if (ALLOWED_ORIGINS.includes("*")) return true;
  // When using explicit origin list, reject requests with missing origin header.
  // This prevents non-browser clients from bypassing origin checks.
  if (!origin) return false;
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

function cleanupRateLimitBuckets() {
  const now = Date.now();
  for (const [key, bucket] of RATE_LIMIT_BUCKETS.entries()) {
    if (now > bucket.resetAt) RATE_LIMIT_BUCKETS.delete(key);
  }
}

function cleanupAuthCodeBuckets() {
  const now = Date.now();
  for (const [key, bucket] of AUTH_CODE_BUCKETS.entries()) {
    if (now > bucket.expiresAt) AUTH_CODE_BUCKETS.delete(key);
  }
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

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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

async function verifyCaptchaToken(token, remoteIp, requestId) {
  if (!CAPTCHA_REQUIRED) return;
  if (!TURNSTILE_SECRET_KEY) throw new Error("Captcha is required but TURNSTILE_SECRET_KEY is missing");
  if (typeof token !== "string" || !token.trim()) throw new Error("请先完成人机校验");

  const response = await withTimeout(
    fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        secret: TURNSTILE_SECRET_KEY,
        response: token,
        remoteip: remoteIp,
        idempotency_key: requestId
      })
    }),
    REQUEST_TIMEOUT_MS,
    "Captcha verification timed out"
  );
  const data = await response.json().catch(() => null);
  if (!response.ok || !data?.success) throw new Error("人机校验未通过，请刷新后重试");
}

function normalizeAuthMethod(value) {
  if (value === "email" || value === "phone") return value;
  throw new Error("Unsupported auth method");
}

function normalizeAuthIdentifier(method, value) {
  if (typeof value !== "string") throw new Error("Missing auth identifier");
  const normalized = method === "email" ? value.trim().toLowerCase() : value.replace(/\s|-/g, "").trim();
  if (method === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) throw new Error("邮箱格式不正确");
  if (method === "phone" && !/^1[3-9]\d{9}$/.test(normalized)) throw new Error("手机号格式不正确");
  return normalized;
}

function normalizePassword(value) {
  if (typeof value !== "string" || value.length < 8) throw new Error("密码至少需要 8 位");
  if (value.length > 128) throw new Error("密码长度不能超过 128 位");
  return value;
}

function normalizeDeviceId(value) {
  if (typeof value !== "string" || !/^[a-zA-Z0-9_-]{12,80}$/.test(value)) {
    throw new Error("设备标识缺失或格式不正确");
  }
  return value;
}

function getAuthCodeKey(method, identifier, purpose) {
  return `${purpose}:${method}:${identifier}`;
}

function getAccountKey(method, identifier) {
  return `${method}:${identifier}`;
}

function verifyAuthCode(method, identifier, purpose, code) {
  const key = getAuthCodeKey(method, identifier, purpose);
  const stored = AUTH_CODE_BUCKETS.get(key);
  if (!stored || Date.now() > stored.expiresAt) {
    AUTH_CODE_BUCKETS.delete(key);
    throw new Error("验证码已过期，请重新获取");
  }
  if (stored.attempts >= AUTH_CODE_MAX_ATTEMPTS) {
    AUTH_CODE_BUCKETS.delete(key);
    throw new Error("验证码尝试次数过多，请重新获取");
  }
  stored.attempts += 1;
  if (!isValidSecret(signValue(String(code || "")), stored.codeHash)) {
    throw new Error("验证码不正确");
  }
  AUTH_CODE_BUCKETS.delete(key);
}

function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `scrypt:${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  const [scheme, salt, expectedHash] = String(stored || "").split(":");
  if (scheme !== "scrypt" || !salt || !expectedHash) return false;
  const actual = scryptSync(password, salt, 64);
  const expected = Buffer.from(expectedHash, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

function createAuthAccount({ method, identifier, role, password, deviceId }) {
  return {
    id: `acct_${Date.now().toString(36)}_${signValue(identifier).slice(0, 8)}`,
    method,
    identifier,
    displayName: method === "email" ? identifier.split("@")[0] : `${identifier.slice(0, 3)}****${identifier.slice(-4)}`,
    role,
    createdAt: new Date().toISOString(),
    passwordHash: hashPassword(password),
    trustedDevices: new Set([deviceId])
  };
}

function toPublicAccount(account) {
  return {
    id: account.id,
    method: account.method,
    identifier: account.identifier,
    displayName: account.displayName,
    role: account.role,
    createdAt: account.createdAt
  };
}

function signValue(value) {
  return createHmac("sha256", SHARED_SECRET || "jiuzhang-dev-secret").update(value).digest("hex");
}

function hasWechatPayConfig() {
  return Boolean(
    process.env.WECHAT_PAY_APP_ID &&
      process.env.WECHAT_PAY_MCH_ID &&
      process.env.WECHAT_PAY_SERIAL_NO &&
      process.env.WECHAT_PAY_PRIVATE_KEY &&
      process.env.WECHAT_PAY_API_V3_KEY
  );
}

function cleanString(value, maxLength) {
  return String(value)
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .trim()
    .slice(0, maxLength);
}

function requireString(value, key, maxLength = 500) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`Missing field: ${key}`);
  }
  if (cleanString(value, maxLength + 1).length > maxLength) {
    throw new Error(`Field is too long: ${key}`);
  }
}

function requireArray(value, key) {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error(`Missing field: ${key}`);
  }
}

function requirePhone(value, key) {
  const normalized = typeof value === "string" ? value.replace(/\s|-/g, "").trim() : "";
  if (!/^1[3-9]\d{9}$/.test(normalized)) throw new Error(`Invalid phone field: ${key}`);
  return normalized;
}

function optionalPhone(value, key) {
  if (typeof value !== "string" || !value.trim()) return undefined;
  return requirePhone(value, key);
}

function optionalUrl(value) {
  if (typeof value !== "string" || !value.trim()) return undefined;
  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") return undefined;
    return url.toString().slice(0, 500);
  } catch {
    return undefined;
  }
}

function optionalString(value, maxLength = 500) {
  return typeof value === "string" && value.trim() ? cleanString(value, maxLength) : undefined;
}

function shutdown(signal) {
  console.log(`Received ${signal}, closing lead relay...`);
  server.close(() => {
    console.log("Lead relay closed");
    process.exit(0);
  });
}

setInterval(cleanupRateLimitBuckets, Math.min(60_000, RATE_LIMIT_WINDOW_MS)).unref();
setInterval(cleanupAuthCodeBuckets, Math.min(60_000, AUTH_CODE_TTL_MS)).unref();

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
