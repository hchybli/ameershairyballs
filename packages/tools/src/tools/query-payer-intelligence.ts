import { readPayerIntelligence } from "@backstop/intelligence";
import type { ToolDefinition } from "../types.ts";

export interface QueryPayerIntelArgs {
  payer_name?: string;
  cdt_code?: string;
}

export const queryPayerIntelligenceTool: ToolDefinition<QueryPayerIntelArgs> = {
  name: "query_payer_intelligence",
  description: "Read payer × CDT outcome intelligence (denial rates, remark codes) for the tenant moat.",
  parameters: {
    type: "object",
    properties: {
      payer_name: { type: "string", description: "Filter by payer name" },
      cdt_code: { type: "string", description: "Filter by CDT code" },
    },
  },
  async execute(ctx, args) {
    let rows = await readPayerIntelligence(ctx.db, ctx.tenantId);
    if (args.payer_name) {
      rows = rows.filter((r) => r.payerName === args.payer_name);
    }
    if (args.cdt_code) {
      rows = rows.filter((r) => r.cdtCode === args.cdt_code);
    }
    return rows;
  },
};
