import type { ToolDefinition } from "../types.ts";

export interface QueryEligibilityArgs {
  patient_ref: string;
  payer_name?: string;
}

export interface EligibilitySnapshotRow {
  patient_ref: string;
  payer_name: string;
  active: boolean;
  checked_at: string;
  annual_max_remaining: number | null;
  deductible_remaining: number | null;
  breakdown: Record<string, unknown>;
  alerts: string[];
}

export const queryEligibilityTool: ToolDefinition<
  QueryEligibilityArgs,
  EligibilitySnapshotRow | null
> = {
  name: "query_eligibility",
  description: "Read the latest eligibility benefit snapshot for a patient ref.",
  parameters: {
    type: "object",
    properties: {
      patient_ref: { type: "string", description: "Synthetic patient ref e.g. SYN-PAT-001" },
      payer_name: { type: "string", description: "Optional payer filter" },
    },
    required: ["patient_ref"],
  },
  async execute(ctx, args) {
    let query = ctx.db
      .from("eligibility_current")
      .select(
        "patient_ref, payer_name, active, checked_at, annual_max_remaining, deductible_remaining, breakdown, alerts",
      )
      .eq("tenant_id", ctx.tenantId)
      .eq("patient_ref", args.patient_ref)
      .order("checked_at", { ascending: false })
      .limit(1);

    if (args.payer_name) {
      query = query.eq("payer_name", args.payer_name);
    }

    const { data, error } = await query.maybeSingle();
    if (error) {
      throw new Error(`query_eligibility failed: ${error.message}`);
    }

    if (!data) {
      return null;
    }

    return {
      patient_ref: data.patient_ref,
      payer_name: data.payer_name,
      active: data.active,
      checked_at: data.checked_at,
      annual_max_remaining:
        data.annual_max_remaining === null ? null : Number(data.annual_max_remaining),
      deductible_remaining:
        data.deductible_remaining === null ? null : Number(data.deductible_remaining),
      breakdown: (data.breakdown as Record<string, unknown>) ?? {},
      alerts: Array.isArray(data.alerts) ? (data.alerts as string[]) : [],
    };
  },
};
