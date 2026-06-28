/** Phase 1 billing domain events. Reserved: clinical.*, schedule.*, comms.* */
export const BillingEventType = {
  ClaimIngested: "claim.ingested",
  FlagRaised: "flag.raised",
  FlagApproved: "flag.approved",
  FlagOverridden: "flag.overridden",
  FixApplied: "fix.applied",
  OutcomeReceived: "outcome.received",
} as const;

export type BillingEventTypeName = (typeof BillingEventType)[keyof typeof BillingEventType];

export interface ClaimLinePayload {
  cdt_code: string;
  fee_billed: number;
  fee_allowed: number | null;
  tooth: string | null;
  quadrant: string | null;
}

export interface ClaimIngestedPayload {
  event_schema_version: number;
  tenant_id: string;
  clinic_id: string;
  external_claim_id: string;
  patient_ref: string;
  payer_name: string;
  lines: ClaimLinePayload[];
  source: string;
  ingested_at: string;
  dedupe_key?: string;
}

export interface OutcomeReceivedPayload {
  event_schema_version: number;
  tenant_id: string;
  clinic_id: string;
  external_claim_id: string;
  result: "paid" | "denied" | "downcoded";
  paid_amount: number;
  remark_code: string | null;
  remark_text: string | null;
  received_at: string;
  dedupe_key?: string;
}

export interface FlagRaisedPayload {
  event_schema_version: number;
  tenant_id: string;
  clinic_id: string;
  claim_id?: string;
  external_claim_id: string;
  line_index: number | null;
  cdt_code: string | null;
  flag_type: string;
  severity: string;
  dollar_impact: number | null;
  reason: string;
  suggested_fix: string | null;
  raised_by: string;
  rule_id?: string;
}

export interface FlagApprovedPayload {
  event_schema_version: number;
  tenant_id: string;
  flag_id: string;
  claim_id: string;
  actor_id: string;
  actor_role: string;
}

export interface FlagOverriddenPayload {
  event_schema_version: number;
  tenant_id: string;
  flag_id: string;
  claim_id: string;
  actor_id: string;
  actor_role: string;
  reason: string;
}

export interface StoredEvent {
  id: string;
  tenant_id: string;
  clinic_id: string | null;
  type: string;
  payload: Record<string, unknown>;
  actor_id: string | null;
  created_at: string;
}

export interface EmitInput {
  tenantId: string;
  clinicId: string;
  type: BillingEventTypeName | string;
  payload: Record<string, unknown>;
  actorId?: string | null;
  dedupeKey?: string;
}

export interface EmitResult {
  id: string;
  created: boolean;
}
