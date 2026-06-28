import { handleIngestClaims } from "../../../packages/handlers/src/ingest-claims.ts";
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

  const form = await req.formData();
  const file = form.get("file");
  const clinicId = form.get("clinic_id");

  if (!(file instanceof File)) {
    return errorResponse("Missing CSV file in form field 'file'.", "VALIDATION", 400);
  }

  if (typeof clinicId !== "string" || !clinicId) {
    return errorResponse("Missing clinic_id.", "VALIDATION", 400);
  }

  const csvText = await file.text();
  const db = createAdminClient();
  const result = await handleIngestClaims(db, authResult.auth, { csvText, clinicId });

  if (!result.ok) {
    return errorResponse(result.error, result.status === 403 ? "FORBIDDEN" : "PARSE_ERROR", result.status, {
      errors: result.errors,
    });
  }

  return jsonResponse(result.data);
});
