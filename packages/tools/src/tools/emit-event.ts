import { emit } from "@backstop/events";
import type { EmitEventInput, EmitEventResult, ToolDefinition } from "../types.ts";

const ALLOWED_AGENT_EVENT_TYPES = new Set([
  "eligibility.checked",
  "prediction.scored",
  "fix.applied",
]);

export const emitEventTool: ToolDefinition<EmitEventInput, EmitEventResult> = {
  name: "emit_event",
  description: "Emit an append-only domain event (allowlisted types for agents).",
  parameters: {
    type: "object",
    properties: {
      type: { type: "string", description: "Event type e.g. eligibility.checked" },
      payload: { type: "object", description: "Event payload (tenant/clinic injected)" },
      dedupe_key: { type: "string", description: "Optional idempotency key" },
    },
    required: ["type", "payload"],
  },
  async execute(ctx, args) {
    if (!ALLOWED_AGENT_EVENT_TYPES.has(args.type)) {
      throw new Error(`emit_event: type not allowlisted: ${args.type}`);
    }

    const result = await emit(ctx.db, {
      tenantId: ctx.tenantId,
      clinicId: ctx.clinicId,
      type: args.type,
      actorId: ctx.actorId,
      dedupeKey: args.dedupe_key,
      payload: args.payload,
    });

    return { event_id: result.id, created: result.created };
  },
};
