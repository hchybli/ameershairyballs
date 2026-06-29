export interface EligibilityFrequencyLimit {
  procedure: string;
  description: string;
  times_per_year: number;
  used: number;
}

export interface EligibilityBenefitBreakdown {
  active: boolean;
  network_status: "in_network" | "out_of_network" | "unknown";
  annual_max: number;
  annual_max_remaining: number;
  deductible: number;
  deductible_remaining: number;
  coverage_by_category: Record<string, number>;
  frequency_limits: EligibilityFrequencyLimit[];
  waiting_periods: Array<{ procedure: string; months: number }>;
  cob: { has_secondary: boolean } | null;
}

export interface EligibilityCheckRequest {
  patientRef: string;
  payerName: string;
  procedureCodes?: string[];
}

export interface EligibilityAdapter {
  readonly name: string;
  check(request: EligibilityCheckRequest): Promise<EligibilityBenefitBreakdown>;
}
