export { createBrowserClient, isBrowserClientConfigured, type BackstopSupabaseClient } from "./client.js";
export { createServiceClient, isServiceClientConfigured, type BackstopServiceClient } from "./server.js";
export {
  tenantScope,
  TENANT_SCOPED_TABLES,
  type TenantScopedTable,
  type TenantScopedRow,
  type TenantScopedInsert,
} from "./tenant.js";
export type { Database, Json, Tables, TablesInsert, TablesUpdate } from "./database.types.js";
