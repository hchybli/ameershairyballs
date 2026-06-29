import { SYNTHETIC_ELIGIBILITY_FIXTURES } from "./synthetic-fixtures.ts";
import type {
  EligibilityAdapter,
  EligibilityBenefitBreakdown,
  EligibilityCheckRequest,
} from "./types.ts";

export class SyntheticOnederfulAdapter implements EligibilityAdapter {
  readonly name = "synthetic_onederful";

  async check(request: EligibilityCheckRequest): Promise<EligibilityBenefitBreakdown> {
    const key = `${request.patientRef}|${request.payerName}`;
    const fixture = SYNTHETIC_ELIGIBILITY_FIXTURES[key];
    if (!fixture) {
      return {
        active: false,
        network_status: "unknown",
        annual_max: 0,
        annual_max_remaining: 0,
        deductible: 0,
        deductible_remaining: 0,
        coverage_by_category: {},
        frequency_limits: [],
        waiting_periods: [],
        cob: null,
      };
    }
    return structuredClone(fixture);
  }
}
