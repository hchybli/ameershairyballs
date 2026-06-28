import type { ClaimFlag, ScrubResult, StoredClaim, StoredOutcome } from "@backstop/core";
import type { ParsedClaim, ParsedOutcome, QueueRow } from "@backstop/core";
import type { FlagSeverity } from "@backstop/core";
import {
  groupAutoFixesByClaim,
  scrubClaimsWithAutoFix,
  splitScrubByClaim,
} from "@backstop/agents";

const SEVERITY_RANK: Record<FlagSeverity, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

interface StoreState {
  claims: Map<string, StoredClaim>;
  outcomes: StoredOutcome[];
  events: Array<{ type: string; at: string; payload: Record<string, unknown> }>;
}

const globalStore = globalThis as typeof globalThis & { __backstopV2Store?: StoreState };

function getState(): StoreState {
  if (!globalStore.__backstopV2Store) {
    globalStore.__backstopV2Store = {
      claims: new Map(),
      outcomes: [],
      events: [],
    };
  }
  return globalStore.__backstopV2Store;
}

function emit(type: string, payload: Record<string, unknown>) {
  getState().events.push({ type, at: new Date().toISOString(), payload });
}

function openFlags(scrub: ScrubResult): ClaimFlag[] {
  return scrub.flags.filter((f) => f.status === "open");
}

function topOpenFlag(flags: ClaimFlag[]): ClaimFlag | null {
  const open = flags.filter((f) => f.status === "open");
  if (open.length === 0) return null;
  return open.sort((a, b) => SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity])[0]!;
}

export function ingestClaims(claims: ParsedClaim[]) {
  const { flags, summary, autoFixes, claims: fixedClaims } = scrubClaimsWithAutoFix(claims);
  const scrubMap = splitScrubByClaim(fixedClaims, { flags, summary });
  const autoFixMap = groupAutoFixesByClaim(fixedClaims, autoFixes);
  const now = new Date().toISOString();
  const state = getState();

  for (const claim of fixedClaims) {
    const scrub = scrubMap.get(claim.externalClaimId)!;
    state.claims.set(claim.externalClaimId, {
      externalClaimId: claim.externalClaimId,
      patientRef: claim.patientRef,
      payerName: claim.payerName,
      lines: claim.lines,
      scrub,
      autoFixes: autoFixMap.get(claim.externalClaimId) ?? [],
      ingestedAt: now,
    });
    emit("claim.ingested", { externalClaimId: claim.externalClaimId });
    for (const flag of scrub.flags) {
      emit("flag.raised", { flagId: flag.id, type: flag.type, severity: flag.severity });
    }
  }

  return {
    claimsIngested: fixedClaims.length,
    linesIngested: fixedClaims.reduce((s, c) => s + c.lines.length, 0),
    flagsRaised: flags.length,
  };
}

export function getQueue(): QueueRow[] {
  const rows: QueueRow[] = [];
  for (const claim of getState().claims.values()) {
    const open = openFlags(claim.scrub);
    if (open.length === 0) continue;
    const top = topOpenFlag(claim.scrub.flags)!;
    const dollarImpactAtRisk = open.reduce((s, f) => s + (f.dollarImpact ?? 0), 0);
    const urgency = SEVERITY_RANK[top.severity];
    rows.push({
      externalClaimId: claim.externalClaimId,
      patientRef: claim.patientRef,
      payerName: claim.payerName,
      feeTotal: claim.lines.reduce((s, l) => s + l.feeBilled, 0),
      dollarImpactAtRisk,
      priorityScore: Math.max(dollarImpactAtRisk, 1) * urgency,
      flagsOpen: open.length,
      topFlagType: top.type,
      topFlagReason: top.reason,
      topSeverity: top.severity,
      ingestedAt: claim.ingestedAt,
    });
  }
  return rows.sort((a, b) => b.priorityScore - a.priorityScore);
}

export function getClaim(externalClaimId: string): StoredClaim | null {
  return getState().claims.get(externalClaimId) ?? null;
}

export function gateAction(
  externalClaimId: string,
  flagId: string,
  action: "approve" | "override",
  reason?: string,
): { ok: true } | { ok: false; error: string } {
  const claim = getState().claims.get(externalClaimId);
  if (!claim) return { ok: false, error: "Claim not found." };

  const flag = claim.scrub.flags.find((f) => f.id === flagId);
  if (!flag) return { ok: false, error: "Flag not found." };
  if (flag.status !== "open") return { ok: false, error: "Flag already resolved." };

  if (action === "override" && !reason?.trim()) {
    return { ok: false, error: "Override requires a reason." };
  }

  flag.status = action === "approve" ? "approved" : "overridden";
  if (action === "override") flag.overrideReason = reason!.trim();

  const open = openFlags(claim.scrub);
  claim.scrub.summary = {
    ...claim.scrub.summary,
    flagsOpen: open.length,
    highOrCritical: open.filter((f) => f.severity === "high" || f.severity === "critical").length,
    estimatedDollarAtRisk: open.reduce((s, f) => s + (f.dollarImpact ?? 0), 0),
  };

  emit(action === "approve" ? "flag.approved" : "flag.overridden", {
    externalClaimId,
    flagId,
    reason: reason ?? null,
  });

  return { ok: true };
}

export function recordOutcomes(outcomes: ParsedOutcome[]): number {
  const now = new Date().toISOString();
  let added = 0;
  for (const outcome of outcomes) {
    getState().outcomes.push({ ...outcome, observedAt: now });
    emit("outcome.received", { externalClaimId: outcome.externalClaimId, result: outcome.result });
    added += 1;
  }
  return added;
}

export function getKnownClaimIds(): Set<string> {
  return new Set(getState().claims.keys());
}

export function getAllClaims(): StoredClaim[] {
  return Array.from(getState().claims.values());
}

export function getOutcomes(): StoredOutcome[] {
  return getState().outcomes;
}

export function getEvents() {
  return getState().events;
}

export function resetStore() {
  globalStore.__backstopV2Store = { claims: new Map(), outcomes: [], events: [] };
}
