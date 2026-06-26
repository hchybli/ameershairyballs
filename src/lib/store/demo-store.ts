import type { ParsedClaim } from "@/lib/types";
import type { ParsedOutcome } from "@/lib/outcomes/types";
import type { ScrubResult } from "@/lib/rules/types";

/** In-memory store for local demo — resets on server restart. Supabase is source of truth when configured. */

export interface StoredClaim {
  externalClaimId: string;
  patientRef: string;
  payerName: string;
  lines: ParsedClaim["lines"];
  scrub: ScrubResult;
  autoFixes: string[];
  ingestedAt: string;
}

export interface StoredOutcome extends ParsedOutcome {
  observedAt: string;
}

interface DemoStore {
  claims: Map<string, StoredClaim>;
  outcomes: StoredOutcome[];
}

const globalStore = globalThis as typeof globalThis & { __backstopStore?: DemoStore };

function getStore(): DemoStore {
  if (!globalStore.__backstopStore) {
    globalStore.__backstopStore = {
      claims: new Map(),
      outcomes: [],
    };
  }
  return globalStore.__backstopStore;
}

export function recordClaims(
  claims: ParsedClaim[],
  scrubResults: Map<string, ScrubResult>,
  autoFixesByClaim: Map<string, string[]>,
): void {
  const store = getStore();
  const now = new Date().toISOString();

  for (const claim of claims) {
    store.claims.set(claim.externalClaimId, {
      externalClaimId: claim.externalClaimId,
      patientRef: claim.patientRef,
      payerName: claim.payerName,
      lines: claim.lines,
      scrub: scrubResults.get(claim.externalClaimId) ?? {
        flags: [],
        summary: {
          claimsChecked: 0,
          linesChecked: 0,
          flagsOpen: 0,
          highOrCritical: 0,
          estimatedDollarAtRisk: 0,
        },
      },
      autoFixes: autoFixesByClaim.get(claim.externalClaimId) ?? [],
      ingestedAt: now,
    });
  }
}

export function getKnownClaimIds(): Set<string> {
  return new Set(getStore().claims.keys());
}

export function recordOutcomes(outcomes: ParsedOutcome[]): number {
  const store = getStore();
  const now = new Date().toISOString();
  let added = 0;

  for (const outcome of outcomes) {
    store.outcomes.push({ ...outcome, observedAt: now });
    added += 1;
  }

  return added;
}

export function getDashboardData() {
  const store = getStore();
  const claims = Array.from(store.claims.values());
  const outcomes = store.outcomes;

  const allFlags = claims.flatMap((c) => c.scrub.flags);
  const openFlags = allFlags.filter((f) => f.status === "open");
  const autoFixCount = claims.reduce((n, c) => n + c.autoFixes.length, 0);

  const flagTypeCounts = new Map<string, number>();
  for (const flag of allFlags) {
    flagTypeCounts.set(flag.type, (flagTypeCounts.get(flag.type) ?? 0) + 1);
  }

  const topFlagTypes = Array.from(flagTypeCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([type, count]) => ({ type, count }));

  const paid = outcomes.filter((o) => o.result === "paid");
  const denied = outcomes.filter((o) => o.result === "denied");
  const downcoded = outcomes.filter((o) => o.result === "downcoded");
  const adjudicated = outcomes.length;
  const denialRate = adjudicated > 0 ? denied.length / adjudicated : 0;

  const totalPaid = outcomes.reduce((sum, o) => sum + o.paidAmount, 0);
  const dollarsFlagged = openFlags.reduce((sum, f) => sum + (f.dollarImpact ?? 0), 0);

  const claimIdsWithOutcomes = new Set(outcomes.map((o) => o.externalClaimId));
  const flaggedClaimIds = new Set(
    claims.filter((c) => c.scrub.summary.flagsOpen > 0).map((c) => c.externalClaimId),
  );
  const flaggedThenPaid = outcomes.filter(
    (o) => o.result === "paid" && flaggedClaimIds.has(o.externalClaimId),
  );
  const dollarsRecovered = flaggedThenPaid.reduce((sum, o) => sum + o.paidAmount, 0);

  return {
    claimsIngested: claims.length,
    linesIngested: claims.reduce((s, c) => s + c.lines.length, 0),
    flagsOpen: openFlags.length,
    flagsTotal: allFlags.length,
    autoFixesApplied: autoFixCount,
    dollarsFlagged,
    outcomesRecorded: outcomes.length,
    paidCount: paid.length,
    deniedCount: denied.length,
    downcodedCount: downcoded.length,
    denialRate,
    totalPaid,
    dollarsRecovered,
    topFlagTypes,
    recentOutcomes: outcomes.slice(-10).reverse(),
    claimsWithoutOutcomes: claims
      .filter((c) => !claimIdsWithOutcomes.has(c.externalClaimId))
      .map((c) => c.externalClaimId),
  };
}

export function resetDemoStore(): void {
  globalStore.__backstopStore = { claims: new Map(), outcomes: [] };
}
