export type BackstopRole = "operator" | "owner" | "biller" | "admin";

export interface BackstopSession {
  userId: string;
  email: string | undefined;
  tenantId: string;
  clinicId: string;
  role: BackstopRole;
}

const ROLES: BackstopRole[] = ["operator", "owner", "biller", "admin"];

export function isBackstopRole(value: unknown): value is BackstopRole {
  return typeof value === "string" && ROLES.includes(value as BackstopRole);
}

export function parseAppMetadata(metadata: Record<string, unknown> | undefined): {
  tenantId: string;
  clinicId: string;
  role: BackstopRole;
} | null {
  if (!metadata) {
    return null;
  }

  const tenantId = metadata.tenant_id;
  const clinicId = metadata.clinic_id;
  const role = metadata.role;

  if (typeof tenantId !== "string" || typeof clinicId !== "string" || !isBackstopRole(role)) {
    return null;
  }

  return { tenantId, clinicId, role };
}

/** Operator app: operator, biller, or admin */
export const OPERATOR_APP_ROLES: BackstopRole[] = ["operator", "biller", "admin"];

/** Owner app: owner or admin */
export const OWNER_APP_ROLES: BackstopRole[] = ["owner", "admin"];

export function roleAllowed(role: BackstopRole, allowed: readonly BackstopRole[]): boolean {
  return allowed.includes(role);
}
