export type AdminRole = "owner" | "ops" | "support" | "finance" | "auditor";

export type AdminPermission =
  | "leads:read"
  | "leads:assign"
  | "providers:review"
  | "content:edit"
  | "payments:review"
  | "settings:manage"
  | "audit:read";

export type AdminAccount = {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
  permissions: AdminPermission[];
  createdAt: string;
};

export const adminSessionStorageKey = "jiuzhang:admin-session";

export const adminRoleLabels: Record<AdminRole, string> = {
  owner: "超级管理员",
  ops: "运营管理员",
  support: "客服坐席",
  finance: "财务审核",
  auditor: "审计只读"
};

export const permissionLabels: Record<AdminPermission, string> = {
  "leads:read": "查看线索",
  "leads:assign": "分配跟进",
  "providers:review": "审核服务商",
  "content:edit": "编辑内容",
  "payments:review": "查看支付",
  "settings:manage": "系统设置",
  "audit:read": "查看审计"
};

export const rolePermissions: Record<AdminRole, AdminPermission[]> = {
  owner: ["leads:read", "leads:assign", "providers:review", "content:edit", "payments:review", "settings:manage", "audit:read"],
  ops: ["leads:read", "leads:assign", "providers:review", "content:edit", "audit:read"],
  support: ["leads:read", "leads:assign"],
  finance: ["leads:read", "payments:review", "audit:read"],
  auditor: ["leads:read", "audit:read"]
};

export function hasAdminPermission(account: AdminAccount | null, permission: AdminPermission) {
  return Boolean(account?.permissions.includes(permission));
}
