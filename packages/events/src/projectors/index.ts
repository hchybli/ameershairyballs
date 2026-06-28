import { BillingEventType } from "../types.js";
import { deterministicClaimId, deterministicEventId } from "../idempotency.js";
import type {
  ClaimIngestedPayload,
  FlagApprovedPayload,
  FlagOverriddenPayload,
  FlagRaisedPayload,
  OutcomeReceivedPayload,
  StoredEvent,
} from "../types.js";
import {
  claimKey,
  emptyProjectedState,
  payerIntelKey,
  type ProjectedState,
} from "./state.js";

function asPayload<T>(payload: Record<string, unknown>): T {
  return payload as T;
}

function projectClaimIngested(state: ProjectedState, event: StoredEvent): void {
  const p = asPayload<ClaimIngestedPayload>(event.payload);
  const key = claimKey(p.tenant_id, p.external_claim_id);
  const claimId = deterministicClaimId(p.tenant_id, p.external_claim_id);

  state.claims.set(key, {
    id: claimId,
    tenant_id: p.tenant_id,
    clinic_id: p.clinic_id,
    external_claim_id: p.external_claim_id,
    patient_ref: p.patient_ref,
    payer_name: p.payer_name,
    status: "ingested",
    last_event_id: event.id,
    updated_at: event.created_at,
  });

  state.claimLines.set(
    claimId,
    p.lines.map((line, lineIndex) => ({
      claim_id: claimId,
      line_index: lineIndex,
      cdt_code: line.cdt_code,
      fee_billed: line.fee_billed,
      fee_allowed: line.fee_allowed,
      tooth: line.tooth,
      quadrant: line.quadrant,
    })),
  );
}

function projectOutcomeReceived(state: ProjectedState, event: StoredEvent): void {
  const p = asPayload<OutcomeReceivedPayload>(event.payload);
  const key = claimKey(p.tenant_id, p.external_claim_id);
  const claim = state.claims.get(key);
  if (!claim) {
    return;
  }

  state.outcomes.push({
    id: deterministicEventId(`${event.id}:outcome`),
    tenant_id: p.tenant_id,
    claim_id: claim.id,
    result: p.result,
    paid_amount: p.paid_amount,
    remark_code: p.remark_code,
    remark_text: p.remark_text,
    source_event_id: event.id,
  });

  for (const line of state.claimLines.get(claim.id) ?? []) {
    const intelKey = payerIntelKey(p.tenant_id, claim.payer_name, line.cdt_code);
    const existing = state.payerIntelligence.get(intelKey) ?? {
      tenant_id: p.tenant_id,
      payer_name: claim.payer_name,
      cdt_code: line.cdt_code,
      sample_size: 0,
      paid_count: 0,
      denied_count: 0,
      downcoded_count: 0,
      avg_paid_amount: null,
      common_remark_codes: [],
    };

    existing.sample_size += 1;
    if (p.result === "paid") existing.paid_count += 1;
    if (p.result === "denied") existing.denied_count += 1;
    if (p.result === "downcoded") existing.downcoded_count += 1;

    if (p.remark_code && !existing.common_remark_codes.includes(p.remark_code)) {
      existing.common_remark_codes.push(p.remark_code);
    }

    state.payerIntelligence.set(intelKey, existing);
  }
}

function projectFlagRaised(state: ProjectedState, event: StoredEvent): void {
  const p = asPayload<FlagRaisedPayload>(event.payload);
  const key = claimKey(p.tenant_id, p.external_claim_id);
  const claim = state.claims.get(key);
  if (!claim) return;

  const flagId = deterministicEventId(`${event.id}:flag`);
  state.flagsOpen.set(flagId, {
    id: flagId,
    tenant_id: p.tenant_id,
    claim_id: claim.id,
    line_index: p.line_index,
    cdt_code: p.cdt_code,
    flag_type: p.flag_type,
    severity: p.severity,
    dollar_impact: p.dollar_impact,
    reason: p.reason,
    suggested_fix: p.suggested_fix,
    raised_event_id: event.id,
  });
}

function resolveFlag(
  state: ProjectedState,
  event: StoredEvent,
  status: "approved" | "overridden",
  reason: string | null,
): void {
  const p = asPayload<FlagApprovedPayload | FlagOverriddenPayload>(event.payload);
  const open = state.flagsOpen.get(p.flag_id);
  if (!open) return;

  state.flagsOpen.delete(p.flag_id);
  state.flagsResolved.push({
    id: open.id,
    tenant_id: open.tenant_id,
    claim_id: open.claim_id,
    flag_type: open.flag_type,
    severity: open.severity,
    status,
    resolution_reason: reason,
    resolution_event_id: event.id,
  });
}

/** Pure fold: one event → updated in-memory read models. */
export function projectEvent(state: ProjectedState, event: StoredEvent): ProjectedState {
  switch (event.type) {
    case BillingEventType.ClaimIngested:
      projectClaimIngested(state, event);
      break;
    case BillingEventType.OutcomeReceived:
      projectOutcomeReceived(state, event);
      break;
    case BillingEventType.FlagRaised:
      projectFlagRaised(state, event);
      break;
    case BillingEventType.FlagApproved:
      resolveFlag(state, event, "approved", null);
      break;
    case BillingEventType.FlagOverridden:
      resolveFlag(state, event, "overridden", (event.payload as FlagOverriddenPayload).reason);
      break;
    default:
      break;
  }
  return state;
}

export function foldEvents(events: StoredEvent[]): ProjectedState {
  const state = emptyProjectedState();
  const sorted = [...events].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
  );
  for (const event of sorted) {
    projectEvent(state, event);
  }
  return state;
}
