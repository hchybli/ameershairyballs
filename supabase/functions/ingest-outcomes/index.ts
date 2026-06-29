import { handleIngestOutcomes } from "../../../packages/handlers/src/ingest-outcomes.ts";
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

    const form = await req.formData();
    const file = form.get("file");

    if (!(file instanceof File)) {
      return errorResponse("Missing CSV file in form field 'file'.", "VALIDATION", 400);
    }

    const db = createAdminClient();
    const result = await handleIngestOutcomes(db, authResult.auth, await file.text());

    if (!result.ok) {
      return errorResponse(result.error, "PARSE_ERROR", result.status, { errors: result.errors });
    }

    return jsonResponse(result.data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    console.error("ingest-outcomes:", err);
    return errorResponse(message, "INTERNAL", 500);
  }
});
