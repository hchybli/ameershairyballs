import type { BackstopSupabaseClient } from "./client";
import type { Database } from "./database.types";

/** Tables with a direct tenant_id column — safe for tenantScope(). */
export const TENANT_SCOPED_TABLES = [
  "clinics",
  "events",
  "claims_current",
  "flags_open",
  "flags_resolved",
  "outcomes",
  "payer_intelligence",
] as const;

export type TenantScopedTable = (typeof TENANT_SCOPED_TABLES)[number];

/**
 * Returns a query builder pre-filtered to one tenant.
 * RLS also enforces isolation; this helper is for explicit server-side filtering.
 */
export function tenantScope(
  client: BackstopSupabaseClient,
  table: TenantScopedTable,
  tenantId: string,
) {
  return client.from(table).select("*").eq("tenant_id", tenantId);
}

export type TenantScopedRow<T extends TenantScopedTable> =
  Database["public"]["Tables"][T]["Row"];

export type TenantScopedInsert<T extends TenantScopedTable> =
  Database["public"]["Tables"][T]["Insert"];
