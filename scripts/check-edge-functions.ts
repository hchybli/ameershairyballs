/**
 * Pre-deploy guardrail: extensionless-import check + deno check all functions
 * WITHOUT sloppy-imports (matches Supabase remote bundler behavior).
 */
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { findExtensionlessImports } from "./fix-edge-import-extensions.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const FUNCTIONS_DIR = join(ROOT, "supabase/functions");
const DENO_JSON = join(FUNCTIONS_DIR, "deno.json");

const FUNCTIONS = [
  "ingest-claims",
  "run-scrub",
  "gate-action",
  "ingest-outcomes",
  "analytics-kpi",
] as const;

async function main() {
  console.log("→ Checking edge-package relative imports have .ts extensions…");
  const violations = await findExtensionlessImports();
  if (violations.length > 0) {
    console.error("\nExtensionless relative imports (Supabase deploy will fail):\n");
    for (const v of violations) {
      console.error(`  ${v.file}: "${v.spec}"`);
    }
    console.error("\nRun: npm run fix:edge-imports\n");
    process.exit(1);
  }
  console.log("✓ Edge-package imports OK");

  let failed = false;
  for (const fn of FUNCTIONS) {
    console.log(`→ deno check ${fn}…`);
    const result = spawnSync(
      "deno",
      ["check", "--config", DENO_JSON, "--import-map", DENO_JSON, join(FUNCTIONS_DIR, fn, "index.ts")],
      { cwd: ROOT, stdio: "inherit" },
    );
    if (result.status !== 0) failed = true;
  }

  if (failed) {
    console.error("\nEdge function deno check failed.");
    process.exit(1);
  }

  console.log("\n✓ All edge functions pass deploy-compatible deno check.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
