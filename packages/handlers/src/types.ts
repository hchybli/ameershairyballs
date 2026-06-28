import type { BackstopRole } from "@backstop/auth";

export interface HandlerAuth {
  userId: string;
  tenantId: string;
  clinicId: string;
  role: BackstopRole;
}

export interface ApiError {
  error: string;
  code: "PARSE_ERROR" | "FORBIDDEN" | "VALIDATION" | "NOT_FOUND";
  details?: Record<string, unknown>;
}
