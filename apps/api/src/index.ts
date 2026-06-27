import cors from "cors";
import express from "express";
import multer from "multer";
import { computeCleanClaimRate } from "@backstop/analytics";
import { parseClaimsCsv, parseOutcomesCsv } from "@backstop/integrations";
import {
  gateAction,
  getAllClaims,
  getClaim,
  getKnownClaimIds,
  getQueue,
  ingestClaims,
  recordOutcomes,
} from "@backstop/store";

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/api/queue", (_req, res) => {
  res.json({ rows: getQueue() });
});

app.get("/api/claims/:id", (req, res) => {
  const claim = getClaim(req.params.id);
  if (!claim) {
    res.status(404).json({ error: "Claim not found." });
    return;
  }
  res.json({ claim });
});

app.post("/api/ingest-claims", upload.single("file"), (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: "Missing CSV file in form field 'file'." });
    return;
  }

  const csvText = req.file.buffer.toString("utf-8");
  const parsed = parseClaimsCsv(csvText);

  if (parsed.claims.length === 0) {
    res.status(400).json({ error: "No valid claims parsed.", errors: parsed.errors });
    return;
  }

  const result = ingestClaims(parsed.claims);
  res.json({
    ...result,
    errors: parsed.errors,
    message: `Ingested ${result.claimsIngested} claim(s), ${result.flagsRaised} flag(s) raised.`,
  });
});

app.post("/api/gate-action", (req, res) => {
  const { externalClaimId, flagId, action, reason } = req.body ?? {};

  if (!externalClaimId || !flagId || !action) {
    res.status(400).json({ error: "externalClaimId, flagId, and action are required." });
    return;
  }

  if (action !== "approve" && action !== "override") {
    res.status(400).json({ error: "action must be approve or override." });
    return;
  }

  const result = gateAction(externalClaimId, flagId, action, reason);
  if (!result.ok) {
    res.status(400).json({ error: result.error });
    return;
  }

  res.json({ status: action === "approve" ? "approved" : "overridden" });
});

app.post("/api/ingest-outcomes", upload.single("file"), (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: "Missing CSV file in form field 'file'." });
    return;
  }

  const parsed = parseOutcomesCsv(req.file.buffer.toString("utf-8"));
  if (parsed.outcomes.length === 0) {
    res.status(400).json({ error: "No valid outcomes parsed.", errors: parsed.errors });
    return;
  }

  const known = getKnownClaimIds();
  const warnings: string[] = [];
  if (known.size === 0) {
    warnings.push("No claims ingested yet — ingest claims first.");
  }
  for (const outcome of parsed.outcomes) {
    if (known.size > 0 && !known.has(outcome.externalClaimId)) {
      warnings.push(`Outcome for ${outcome.externalClaimId} has no matching claim.`);
    }
  }

  const outcomesRecorded = recordOutcomes(parsed.outcomes);
  res.json({
    outcomesRecorded,
    errors: parsed.errors,
    warnings,
    message: `Recorded ${outcomesRecorded} outcome(s).`,
  });
});

app.get("/api/analytics-kpi", (_req, res) => {
  const kpi = computeCleanClaimRate(getAllClaims());
  res.json({ metric: "clean_claim_rate", ...kpi });
});

const PORT = Number(process.env.PORT ?? 3001);
app.listen(PORT, () => {
  console.log(`Backstop API listening on http://localhost:${PORT}`);
});
