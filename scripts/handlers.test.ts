import { describe, it, before } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createServiceClient, isServiceClientConfigured } from "../packages/db/src/server.ts";
import { handleAnalyticsKpi, handleIngestClaims } from "../packages/handlers/src/index.ts";

const skip = !isServiceClientConfigured();

let tenantId = "";
let clinicId = "";
let ownerUserId = "";

describe("WS-05 handlers (live)", { skip }, () => {
  before(async () => {
    const db = createServiceClient();
    const { data: tenant } = await db
      .from("tenants")
      .select("id")
      .eq("name", "Synthetic Demo Tenant")
      .single();
    if (!tenant) {
      throw new Error("Seed tenant not found — run npm run seed");
    }
    tenantId = tenant.id;

    const { data: clinic } = await db
      .from("clinics")
      .select("id")
      .eq("tenant_id", tenantId)
      .eq("name", "Sunrise Dental")
      .single();
    if (!clinic) {
      throw new Error("Seed clinic not found — run npm run seed");
    }
    clinicId = clinic.id;

    const { data: users, error } = await db.auth.admin.listUsers();
    if (error) {
      throw error;
    }
    const owner = users.users.find((u) => u.email === "owner@demo.backstop.local");
    if (!owner) {
      throw new Error("Seed owner user not found — run npm run seed");
    }
    ownerUserId = owner.id;
  });

  it("analytics KPI returns tenant-scoped metrics", async () => {
    const db = createServiceClient();
    const kpi = await handleAnalyticsKpi(db, {
      userId: ownerUserId,
      tenantId,
      clinicId,
      role: "owner",
    });

    assert.equal(kpi.metric, "clean_claim_rate");
    assert.ok(kpi.claimsIngested >= 5);
  });

  it("ingest-claims is idempotent for duplicate external ids", async () => {
    const db = createServiceClient();
    const csv = readFileSync(join(process.cwd(), "data/synthetic/sample-claims.csv"), "utf8");
    const auth = {
      userId: ownerUserId,
      tenantId,
      clinicId,
      role: "owner" as const,
    };

    const first = await handleIngestClaims(db, auth, {
      csvText: csv,
      clinicId,
    });
    const second = await handleIngestClaims(db, auth, {
      csvText: csv,
      clinicId,
    });

    assert.equal(first.ok, true);
    assert.equal(second.ok, true);
    if (first.ok && second.ok) {
      assert.equal(first.data.claims_ingested, second.data.claims_ingested);
    }
  });
});

describe("WS-05 handlers (env missing)", { skip: !skip }, () => {
  it("skipped when service role env is missing", () => {
    assert.ok(true);
  });
});
