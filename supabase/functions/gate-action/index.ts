import { handleGateAction } from "../../../packages/handlers/src/gate-action.ts";
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
  const flagId = body?.flag_id ?? body?.flagId;
  const action = body?.action;
  const reason = body?.reason;

  if (!flagId || !action) {
    return errorResponse("flag_id and action are required.", "VALIDATION", 400);
  }

  const db = createAdminClient();
  const result = await handleGateAction(db, authResult.auth, { flagId, action, reason });

  if (!result.ok) {
    return errorResponse(result.error, result.status === 404 ? "NOT_FOUND" : "VALIDATION", result.status);
  }

  return jsonResponse(result.data);
});
