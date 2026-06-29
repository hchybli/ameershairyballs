import type { ToolDefinition } from "../types.ts";

export interface QueryClaimsArgs {
  claim_id?: string;
  external_claim_id?: string;
  limit?: number;
}

export interface ClaimQueryRow {
  id: string;
  external_claim_id: string;
  patient_ref: string;
  payer_name: string;
  clinic_id: string;
  status: string;
  lines: Array<{
    line_index: number;
    cdt_code: string;
    fee_billed: number;
    fee_allowed: number | null;
    tooth: string | null;
    quadrant: string | null;
  }>;
}

export const queryClaimsTool: ToolDefinition<QueryClaimsArgs, ClaimQueryRow[]> = {
  name: "query_claims",
  description: "Read claims and line items for the current tenant (optionally filter by id).",
  parameters: {
    type: "object",
    properties: {
      claim_id: { type: "string", description: "Internal claim UUID" },
      external_claim_id: { type: "string", description: "External claim id e.g. SYN-CLM-001" },
      limit: { type: "number", description: "Max rows when listing" },
    },
  },
  async execute(ctx, args) {
    let query = ctx.db
      .from("claims_current")
      .select("id, external_claim_id, patient_ref, payer_name, clinic_id, status")
      .eq("tenant_id", ctx.tenantId);

    if (args.claim_id) {
      query = query.eq("id", args.claim_id);
    }
    if (args.external_claim_id) {
      query = query.eq("external_claim_id", args.external_claim_id);
    }

    const limit = args.limit ?? 50;
    const { data: claims, error } = await query.limit(limit);
    if (error) {
      throw new Error(`query_claims failed: ${error.message}`);
    }

    const rows: ClaimQueryRow[] = [];
    for (const claim of claims ?? []) {
      const { data: lines, error: linesError } = await ctx.db
        .from("claim_lines_current")
        .select("line_index, cdt_code, fee_billed, fee_allowed, tooth, quadrant")
        .eq("claim_id", claim.id)
        .order("line_index");

      if (linesError) {
        throw new Error(`query_claims lines failed: ${linesError.message}`);
      }

      rows.push({
        ...claim,
        lines: (lines ?? []).map((line) => ({
          line_index: line.line_index,
          cdt_code: line.cdt_code,
          fee_billed: Number(line.fee_billed),
          fee_allowed: line.fee_allowed === null ? null : Number(line.fee_allowed),
          tooth: line.tooth,
          quadrant: line.quadrant,
        })),
      });
    }

    return rows;
  },
};
