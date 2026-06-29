import { handlePredictDenial } from "../../../packages/handlers/src/predict-denial.ts";
import { requireAuth, createAdminClient } from "../_shared/auth.ts";
import { corsPreflightResponse, errorResponse, jsonResponse } from "../_shared/http.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return corsPreflightResponse();
  }

  try {
    if (req.method !== "POST") {
      return errorResponse("Method not allowed", "VALIDATION", 405);
    }

    const authResult = await requireAuth(req);
    if (!authResult.ok) {
      return authResult.response;
    }

    const body = await req.json();
    const externalClaimId = body?.external_claim_id ?? body?.externalClaimId;
    const payerName = body?.payer_name ?? body?.payerName;
    const lines = body?.lines ?? [];

    if (!externalClaimId || !payerName) {
      return errorResponse("external_claim_id and payer_name are required.", "VALIDATION", 400);
    }

    const db = createAdminClient();
    const result = await handlePredictDenial(db, authResult.auth, {
      external_claim_id: externalClaimId,
      payer_name: payerName,
      lines: Array.isArray(lines)
        ? lines.map((line: Record<string, unknown>, index: number) => ({
            line_index: Number(line.line_index ?? line.lineIndex ?? index),
            cdt_code: String(line.cdt_code ?? line.cdtCode ?? ""),
            fee_billed: Number(line.fee_billed ?? line.feeBilled ?? 0),
          }))
        : [],
    });

    if (!result.ok) {
      return errorResponse(result.error, "VALIDATION", result.status);
    }

    return jsonResponse(result.data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    console.error("predict-denial:", err);
    return errorResponse(message, "INTERNAL", 500);
  }
});
