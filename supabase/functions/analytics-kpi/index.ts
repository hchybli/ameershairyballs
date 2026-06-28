import { handleAnalyticsKpi } from "../../../packages/handlers/src/analytics-kpi.ts";
import { requireAuth, createAdminClient } from "../_shared/auth.ts";
import { corsHeaders, errorResponse, jsonResponse } from "../_shared/http.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "GET") {
    return errorResponse("Method not allowed", "VALIDATION", 405);
  }

  const authResult = await requireAuth(req);
  if (!authResult.ok) {
    return authResult.response;
  }

  const db = createAdminClient();
  const data = await handleAnalyticsKpi(db, authResult.auth);
  return jsonResponse(data);
});
