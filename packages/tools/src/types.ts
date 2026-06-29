import type { BackstopServiceClient } from "@backstop/db";

/** Execution context for agent tools — scoped to tenant/clinic. */
export interface ToolContext {
  db: BackstopServiceClient;
  tenantId: string;
  clinicId: string;
  actorId: string | null;
  agentId: string;
}

export interface ToolParameterSchema {
  type: "object";
  properties: Record<string, { type: string; description?: string }>;
  required?: string[];
}

export interface ToolDefinition<TArgs = Record<string, unknown>, TResult = unknown> {
  name: string;
  description: string;
  parameters: ToolParameterSchema;
  execute: (ctx: ToolContext, args: TArgs) => Promise<TResult>;
}

export interface ToolCallRecord {
  tool: string;
  args: Record<string, unknown>;
  result: unknown;
}

export interface RaiseFlagInput {
  external_claim_id: string;
  line_index?: number | null;
  cdt_code?: string | null;
  flag_type: string;
  severity: "critical" | "high" | "medium" | "low";
  dollar_impact?: number | null;
  reason: string;
  suggested_fix?: string | null;
  raised_by: string;
  rule_id?: string;
}

export interface RaiseFlagResult {
  event_id: string;
  created: boolean;
}

export interface EmitEventInput {
  type: string;
  payload: Record<string, unknown>;
  dedupe_key?: string;
}

export interface EmitEventResult {
  event_id: string;
  created: boolean;
}
