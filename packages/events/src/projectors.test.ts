import { describe, test } from "node:test";
import assert from "node:assert/strict";
import {
  BillingEventType,
  foldEvents,
  claimKey,
} from "./index";

describe("projectors (pure)", () => {
  test("claim.ingested + outcome.received fold into expected read models", () => {
    const tenantId = "11111111-1111-4111-8111-111111111111";
    const clinicId = "22222222-2222-4222-8222-222222222222";
    const events = foldEvents([
      {
        id: "e1",
        tenant_id: tenantId,
        clinic_id: clinicId,
        type: BillingEventType.ClaimIngested,
        actor_id: null,
        created_at: "2026-06-28T12:00:00.000Z",
        payload: {
          event_schema_version: 1,
          tenant_id: tenantId,
          clinic_id: clinicId,
          external_claim_id: "SYN-CLM-001",
          patient_ref: "SYN-PAT-001",
          payer_name: "Delta Dental",
          lines: [{ cdt_code: "D1110", fee_billed: 125, fee_allowed: 95, tooth: null, quadrant: null }],
          source: "csv_dentrix",
          ingested_at: "2026-06-28T12:00:00.000Z",
        },
      },
      {
        id: "e2",
        tenant_id: tenantId,
        clinic_id: clinicId,
        type: BillingEventType.OutcomeReceived,
        actor_id: null,
        created_at: "2026-06-28T12:01:00.000Z",
        payload: {
          event_schema_version: 1,
          tenant_id: tenantId,
          clinic_id: clinicId,
          external_claim_id: "SYN-CLM-001",
          result: "paid",
          paid_amount: 123,
          remark_code: null,
          remark_text: null,
          received_at: "2026-06-28T12:01:00.000Z",
        },
      },
    ]);

    assert.equal(events.claims.size, 1);
    assert.equal(events.claimLines.size, 1);
    assert.equal(events.outcomes.length, 1);
    const claim = events.claims.get(claimKey(tenantId, "SYN-CLM-001"));
    assert.ok(claim);
    assert.equal(claim!.payer_name, "Delta Dental");
    assert.equal(events.outcomes[0]!.result, "paid");
  });
});
