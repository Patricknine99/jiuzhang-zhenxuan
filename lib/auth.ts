export type AuthMethod = "email" | "phone" | "wechat" | "wecom" | "feishu";

export type LocalAccount = {
  id: string;
  method: AuthMethod;
  identifier: string;
  displayName: string;
  role: "buyer" | "provider";
  createdAt: string;
};

export const authStorageKey = "jiuzhang:account";

export function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export function normalizePhone(value: string) {
  return value.replace(/\s|-/g, "").trim();
}

export function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(value));
}

export function isValidPhone(value: string) {
  return /^1[3-9]\d{9}$/.test(normalizePhone(value));
}

export function createLocalAccount(method: "email" | "phone", identifier: string, role: LocalAccount["role"]): LocalAccount {
  const normalized = method === "email" ? normalizeEmail(identifier) : normalizePhone(identifier);
  return {
    id: `acct_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    method,
    identifier: normalized,
    displayName: method === "email" ? normalized.split("@")[0] : `${normalized.slice(0, 3)}****${normalized.slice(-4)}`,
    role,
    createdAt: new Date().toISOString()
  };
}
