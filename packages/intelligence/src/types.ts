export interface PayerIntelRow {
  payerName: string;
  cdtCode: string;
  sampleSize: number;
  paidCount: number;
  deniedCount: number;
  downcodedCount: number;
  avgPaidAmount: number | null;
  commonRemarkCodes: string[];
  updatedAt: string;
}

export interface PayerScorecard {
  payerName: string;
  sampleSize: number;
  denialRate: number;
  downcodeFrequency: number;
  avgDaysToPay: number | null;
  avgPaidAmount: number | null;
  topDenialReasons: string[];
  cdtCodesTracked: number;
}
