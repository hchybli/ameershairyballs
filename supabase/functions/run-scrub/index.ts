import { handleRunScrub } from "../../../packages/handlers/src/run-scrub.ts";
import { requireAuth, createAdminClient } from "../_shared/auth.ts";
import { corsHeaders, errorResponse, jsonResponse } from "../_shared/http.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return errorResponse("Method not allowed", "VALIDATION", 405);
  }

  const authResult = await requireAuth(req);
  if (!authResult.ok) {
    return authResult.response;
  }

  const body = await req.json();
  const claimIds = body?.claim_ids ?? body?.claimIds ?? [];
  const useLlm = Boolean(body?.use_llm ?? body?.useLlm);

  const db = createAdminClient();
  const result = await handleRunScrub(db, authResult.auth, { claimIds, useLlm });

  if (!result.ok) {
    return errorResponse(result.error, result.status === 404 ? "NOT_FOUND" : "VALIDATION", result.status);
  }

  return jsonResponse(result.data);
});
