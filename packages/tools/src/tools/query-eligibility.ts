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

/**
 * Reads projected eligibility snapshots (table + projector wired in WS-AGENTS-01).
 * Returns null until eligibility.checked events populate the read model.
 */
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
  async execute(_ctx, args) {
    void args;
    return null;
  },
};
