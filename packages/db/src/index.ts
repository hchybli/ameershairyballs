export { createBrowserClient, isBrowserClientConfigured, type BackstopSupabaseClient } from "./client";
export { createServiceClient, isServiceClientConfigured, type BackstopServiceClient } from "./server";
export {
  tenantScope,
  TENANT_SCOPED_TABLES,
  type TenantScopedTable,
  type TenantScopedRow,
  type TenantScopedInsert,
} from "./tenant";
export type { Database, Json, Tables, TablesInsert, TablesUpdate } from "./database.types";
