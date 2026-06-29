/**
 * Dev-only: sign into operator + owner apps in a visible browser.
 * Usage: npx tsx --env-file=.env scripts/dev-sign-in.ts
 */
import { execSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createBrowserClient } from "../packages/db/src/client.ts";

const APPS = [
  {
    name: "Operator",
    origin: "http://localhost:5173",
    email: "operator@demo.backstop.local",
    password: "demo-operator-2026!",
  },
  {
    name: "Owner",
    origin: "http://localhost:5174",
    email: "owner@demo.backstop.local",
    password: "demo-owner-2026!",
  },
] as const;

function storageKey(): string {
  const url = process.env.VITE_SUPABASE_URL ?? "";
  const ref = new URL(url).hostname.split(".")[0];
  return `sb-${ref}-auth-token`;
}

async function fetchSession(email: string, password: string) {
  const client = createBrowserClient();
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error || !data.session) {
    throw new Error(`Sign-in failed for ${email}: ${error?.message ?? "no session"}`);
  }
  return data.session;
}

async function main() {
  const sessions = await Promise.all(
    APPS.map(async (app) => ({
      ...app,
      session: await fetchSession(app.email, app.password),
    })),
  );

  const key = storageKey();
  const payload = JSON.stringify(
    sessions.map((s) => ({
      origin: s.origin,
      name: s.name,
      storage: {
        [key]: JSON.stringify({
          access_token: s.session.access_token,
          refresh_token: s.session.refresh_token,
          expires_at: s.session.expires_at,
          expires_in: s.session.expires_in,
          token_type: s.session.token_type,
          user: s.session.user,
        }),
      },
    })),
  );

  const pwDir = mkdtempSync(join(tmpdir(), "backstop-pw-"));
  execSync("npm init -y && npm install playwright@1.51.1 --silent", {
    cwd: pwDir,
    stdio: "ignore",
  });

  const runner = join(pwDir, "run.mjs");
  writeFileSync(
    runner,
    `
import { chromium } from "playwright";

const apps = ${payload};

const browser = await chromium.launch({ headless: false });
for (const app of apps) {
  const context = await browser.newContext();
  await context.addInitScript(({ storage }) => {
    for (const [k, v] of Object.entries(storage)) {
      localStorage.setItem(k, v);
    }
  }, { storage: app.storage });
  const page = await context.newPage();
  await page.goto(app.origin + "/", { waitUntil: "networkidle" });
  console.log("✓ " + app.name + " → " + page.url());
}

console.log("Signed in — browser windows left open.");
await new Promise(() => {});
`,
  );

  execSync(`node ${runner}`, {
    cwd: pwDir,
    env: { ...process.env, NODE_PATH: join(pwDir, "node_modules") },
    stdio: "inherit",
  });
}

void main().catch((err) => {
  console.error(err);
  process.exit(1);
});
