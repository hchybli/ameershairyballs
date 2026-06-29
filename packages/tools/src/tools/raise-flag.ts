import { BillingEventType, emit, flagRaisedDedupeKey } from "@backstop/events";
import type { RaiseFlagInput, RaiseFlagResult, ToolDefinition } from "../types.ts";

export const raiseFlagTool: ToolDefinition<RaiseFlagInput, RaiseFlagResult> = {
  name: "raise_flag",
  description: "Emit a flag.raised event (append-only). Agents never write flags_open directly.",
  parameters: {
    type: "object",
    properties: {
      external_claim_id: { type: "string" },
      line_index: { type: "number" },
      cdt_code: { type: "string" },
      flag_type: { type: "string" },
      severity: { type: "string" },
      dollar_impact: { type: "number" },
      reason: { type: "string" },
      suggested_fix: { type: "string" },
      raised_by: { type: "string" },
      rule_id: { type: "string" },
    },
    required: ["external_claim_id", "flag_type", "severity", "reason", "raised_by"],
  },
  async execute(ctx, args) {
    const dedupeKey = flagRaisedDedupeKey(
      ctx.tenantId,
      args.external_claim_id,
      args.line_index ?? null,
      args.flag_type,
    );

    const result = await emit(ctx.db, {
      tenantId: ctx.tenantId,
      clinicId: ctx.clinicId,
      type: BillingEventType.FlagRaised,
      actorId: ctx.actorId,
      dedupeKey,
      payload: {
        external_claim_id: args.external_claim_id,
        line_index: args.line_index ?? null,
        cdt_code: args.cdt_code ?? null,
        flag_type: args.flag_type,
        severity: args.severity,
        dollar_impact: args.dollar_impact ?? null,
        reason: args.reason,
        suggested_fix: args.suggested_fix ?? null,
        raised_by: args.raised_by,
        rule_id: args.rule_id ?? args.flag_type,
      },
    });

    return { event_id: result.id, created: result.created };
  },
};
