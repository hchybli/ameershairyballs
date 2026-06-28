import type { BackstopServiceClient } from "@backstop/db";
import type { HandlerAuth } from "./types.ts";

export async function assertClinicAccess(
  db: BackstopServiceClient,
  auth: HandlerAuth,
  clinicId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { data: clinic, error } = await db
    .from("clinics")
    .select("id, tenant_id")
    .eq("id", clinicId)
    .maybeSingle();

  if (error || !clinic) {
    return { ok: false, error: "Clinic not found." };
  }

  if (clinic.tenant_id !== auth.tenantId) {
    return { ok: false, error: "Clinic not in tenant." };
  }

  if (auth.role === "owner" || auth.role === "admin") {
    return { ok: true };
  }

  const { data: membership } = await db
    .from("clinic_members")
    .select("clinic_id")
    .eq("user_id", auth.userId)
    .eq("clinic_id", clinicId)
    .maybeSingle();

  if (!membership) {
    return { ok: false, error: "Clinic not assigned to user." };
  }

  return { ok: true };
}
