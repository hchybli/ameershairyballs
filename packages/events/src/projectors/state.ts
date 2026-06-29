import type { StoredEvent } from "../types.ts";

export interface ProjectedClaim {
  id: string;
  tenant_id: string;
  clinic_id: string;
  external_claim_id: string;
  patient_ref: string;
  payer_name: string;
  status: string;
  last_event_id: string;
  updated_at: string;
}

export interface ProjectedClaimLine {
  claim_id: string;
  line_index: number;
  cdt_code: string;
  fee_billed: number;
  fee_allowed: number | null;
  tooth: string | null;
  quadrant: string | null;
}

export interface ProjectedFlagOpen {
  id: string;
  tenant_id: string;
  claim_id: string;
  line_index: number | null;
  cdt_code: string | null;
  flag_type: string;
  severity: string;
  dollar_impact: number | null;
  reason: string;
  suggested_fix: string | null;
  raised_event_id: string;
}

export interface ProjectedFlagResolved {
  id: string;
  tenant_id: string;
  claim_id: string;
  flag_type: string;
  severity: string;
  status: "approved" | "overridden";
  resolution_reason: string | null;
  resolution_event_id: string;
}

export interface ProjectedOutcome {
  id: string;
  tenant_id: string;
  claim_id: string;
  result: string;
  paid_amount: number;
  remark_code: string | null;
  remark_text: string | null;
  source_event_id: string;
}

export interface ProjectedPayerIntel {
  tenant_id: string;
  payer_name: string;
  cdt_code: string;
  sample_size: number;
  paid_count: number;
  denied_count: number;
  downcoded_count: number;
  avg_paid_amount: number | null;
  common_remark_codes: string[];
  prediction_count: number;
}

export interface ProjectedEligibility {
  id: string;
  tenant_id: string;
  clinic_id: string;
  patient_ref: string;
  payer_name: string;
  active: boolean;
  checked_at: string;
  annual_max_remaining: number | null;
  deductible_remaining: number | null;
  breakdown: Record<string, unknown>;
  alerts: string[];
  source_event_id: string;
}

export interface ProjectedState {
  claims: Map<string, ProjectedClaim>;
  claimLines: Map<string, ProjectedClaimLine[]>;
  flagsOpen: Map<string, ProjectedFlagOpen>;
  flagsResolved: ProjectedFlagResolved[];
  outcomes: ProjectedOutcome[];
  payerIntelligence: Map<string, ProjectedPayerIntel>;
  eligibility: Map<string, ProjectedEligibility>;
}

export function emptyProjectedState(): ProjectedState {
  return {
    claims: new Map(),
    claimLines: new Map(),
    flagsOpen: new Map(),
    flagsResolved: [],
    outcomes: [],
    payerIntelligence: new Map(),
    eligibility: new Map(),
  };
}

export function claimKey(tenantId: string, externalClaimId: string): string {
  return `${tenantId}:${externalClaimId}`;
}

export function eligibilityKey(
  tenantId: string,
  clinicId: string,
  patientRef: string,
  payerName: string,
): string {
  return `${tenantId}:${clinicId}:${patientRef}:${payerName}`;
}

export function payerIntelKey(tenantId: string, payerName: string, cdtCode: string): string {
  return `${tenantId}:${payerName}:${cdtCode}`;
}

export function toStoredEvent(row: {
  id: string;
  tenant_id: string;
  type: string;
  payload: Record<string, unknown>;
  actor_id: string | null;
  created_at: string;
}): StoredEvent {
  const clinicId =
    typeof row.payload.clinic_id === "string" ? row.payload.clinic_id : null;
  return {
    id: row.id,
    tenant_id: row.tenant_id,
    clinic_id: clinicId,
    type: row.type,
    payload: row.payload,
    actor_id: row.actor_id,
    created_at: row.created_at,
  };
}
