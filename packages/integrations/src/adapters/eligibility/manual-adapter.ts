import type {
  EligibilityAdapter,
  EligibilityBenefitBreakdown,
  EligibilityCheckRequest,
} from "./types.ts";

/**
 * Future: parse staff-uploaded benefit snapshot (CSV/PDF/form).
 * Option C fallback — not implemented in Phase 1.
 */
export class ManualBenefitSnapshotAdapter implements EligibilityAdapter {
  readonly name = "manual_benefit_snapshot";

  async check(_request: EligibilityCheckRequest): Promise<EligibilityBenefitBreakdown> {
    throw new Error("Manual benefit snapshot adapter is not implemented yet.");
  }
}
