import type { createServiceClient } from "../packages/db/src/server.ts";

export type ServiceClient = ReturnType<typeof createServiceClient>;

export {
  deterministicEventId,
  claimIngestedDedupeKey,
  outcomeReceivedDedupeKey,
} from "../packages/events/src/idempotency.ts";

export interface TableCounts {
  tenants: number;
  clinics: number;
  clinic_members: number;
  events: number;
  claims_current: number;
  claim_lines_current: number;
  outcomes: number;
}

export async function fetchTableCounts(db: ServiceClient): Promise<TableCounts> {
  const tables = [
    "tenants",
    "clinics",
    "clinic_members",
    "events",
    "claims_current",
    "claim_lines_current",
    "outcomes",
  ] as const;

  const counts = {} as TableCounts;

  for (const table of tables) {
    const { count, error } = await db.from(table).select("*", { count: "exact", head: true });
    if (error) {
      throw new Error(`Count failed for ${table}: ${error.message}`);
    }
    counts[table] = count ?? 0;
  }

  return counts;
}
