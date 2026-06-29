/**
 * Full self-check: edge imports + deno, builds, unit + integration tests.
 * Stops on first failure.
 */
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

const STEPS: Array<{ label: string; args: string[] }> = [
  { label: "check:edge (import guard + deno check ×5)", args: ["run", "check:edge"] },
  { label: "build:apps", args: ["run", "build:apps"] },
  { label: "test", args: ["run", "test"] },
  { label: "test:events", args: ["run", "test:events"] },
  { label: "test:seed", args: ["run", "test:seed"] },
  { label: "test:handlers", args: ["run", "test:handlers"] },
  { label: "smoke (synthetic E2E + RLS)", args: ["run", "smoke"] },
  { label: "clickthrough (live edge HTTP + RLS)", args: ["run", "clickthrough"] },
];

function runStep(label: string, args: string[]): void {
  console.log(`\n▶ ${label}`);
  const result = spawnSync("npm", args, { cwd: ROOT, stdio: "inherit", env: process.env });
  if (result.status !== 0) {
    console.error(`\n✗ verify failed at: ${label}`);
    process.exit(result.status ?? 1);
  }
}

console.log("Backstop verify — synthetic only, full self-check\n");

for (const step of STEPS) {
  runStep(step.label, step.args);
}

console.log("\n✓ verify passed — all checks green.\n");
