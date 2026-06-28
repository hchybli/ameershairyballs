import type { BackstopServiceClient } from "@backstop/db";
import { BillingEventType, emit } from "@backstop/events";
import type { HandlerAuth } from "./types.js";

export interface GateActionInput {
  flagId: string;
  action: "approve" | "override";
  reason?: string;
}

export async function handleGateAction(
  db: BackstopServiceClient,
  auth: HandlerAuth,
  input: GateActionInput,
): Promise<
  | { ok: true; data: { event_id: string; status: "approved" | "overridden" } }
  | { ok: false; status: number; error: string }
> {
  if (input.action !== "approve" && input.action !== "override") {
    return { ok: false, status: 400, error: "action must be approve or override." };
  }

  if (input.action === "override" && !input.reason?.trim()) {
    return { ok: false, status: 400, error: "Override requires a reason." };
  }

  const { data: flag, error } = await db
    .from("flags_open")
    .select("id, claim_id, tenant_id")
    .eq("id", input.flagId)
    .eq("tenant_id", auth.tenantId)
    .maybeSingle();

  if (error || !flag) {
    return { ok: false, status: 404, error: "Flag not found." };
  }

  const eventType =
    input.action === "approve" ? BillingEventType.FlagApproved : BillingEventType.FlagOverridden;

  const payload =
    input.action === "approve"
      ? {
          flag_id: flag.id,
          claim_id: flag.claim_id,
          actor_id: auth.userId,
          actor_role: auth.role,
        }
      : {
          flag_id: flag.id,
          claim_id: flag.claim_id,
          actor_id: auth.userId,
          actor_role: auth.role,
          reason: input.reason!.trim(),
        };

  const { data: claim } = await db
    .from("claims_current")
    .select("clinic_id")
    .eq("id", flag.claim_id)
    .single();

  const result = await emit(db, {
    tenantId: auth.tenantId,
    clinicId: claim?.clinic_id ?? auth.clinicId,
    type: eventType,
    actorId: auth.userId,
    payload,
  });

  return {
    ok: true,
    data: {
      event_id: result.id,
      status: input.action === "approve" ? "approved" : "overridden",
    },
  };
}
