import type { EligibilityBenefitBreakdown } from "@backstop/integrations";

export type EligibilityAlertCode =
  | "eligibility_lapsed"
  | "eligibility_frequency_exceeded"
  | "eligibility_benefit_exhausted"
  | "eligibility_out_of_network";

export interface EligibilityAlert {
  code: EligibilityAlertCode;
  severity: "critical" | "high" | "medium";
  message: string;
  procedure?: string;
}

const BENEFIT_EXHAUSTED_THRESHOLD = 100;

export function analyzeEligibility(
  breakdown: EligibilityBenefitBreakdown,
  procedureCodes: string[] = [],
): EligibilityAlert[] {
  const alerts: EligibilityAlert[] = [];

  if (!breakdown.active) {
    alerts.push({
      code: "eligibility_lapsed",
      severity: "critical",
      message: "Coverage is inactive or lapsed — verify before treatment.",
    });
  }

  if (breakdown.network_status === "out_of_network") {
    alerts.push({
      code: "eligibility_out_of_network",
      severity: "high",
      message: "Patient is out-of-network — higher patient responsibility expected.",
    });
  }

  if (
    breakdown.annual_max > 0 &&
    breakdown.annual_max_remaining <= BENEFIT_EXHAUSTED_THRESHOLD
  ) {
    alerts.push({
      code: "eligibility_benefit_exhausted",
      severity: "high",
      message: `Annual max nearly exhausted — $${breakdown.annual_max_remaining.toFixed(0)} remaining of $${breakdown.annual_max.toFixed(0)}.`,
    });
  }

  for (const limit of breakdown.frequency_limits) {
    if (limit.used >= limit.times_per_year) {
      const matchesRequested =
        procedureCodes.length === 0 || procedureCodes.includes(limit.procedure);
      if (matchesRequested) {
        alerts.push({
          code: "eligibility_frequency_exceeded",
          severity: "high",
          message: `${limit.procedure} frequency exceeded (${limit.used}/${limit.times_per_year} per year).`,
          procedure: limit.procedure,
        });
      }
    }
  }

  return alerts;
}
