#!/usr/bin/env bash
# Phase 1 end-to-end demo — synthetic data only.
# Usage:
#   npm run demo:e2e              # print manual playbook
#   npm run demo:e2e -- --auto    # seed + headless API click-through
#   npm run demo:e2e -- --verify  # full npm run verify
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

MODE="${1:-manual}"

print_playbook() {
  cat <<'EOF'
╔══════════════════════════════════════════════════════════════════╗
║  Backstop Phase 1 — E2E demo (synthetic only)                    ║
╚══════════════════════════════════════════════════════════════════╝

Prerequisites
  • .env with Supabase URL + keys (see .env.example)
  • npm install

── Automated prep ─────────────────────────────────────────────────
  npm run seed

── Start apps ───────────────────────────────────────────────────
  npm run dev
  npx tsx --env-file=.env scripts/dev-sign-in.ts

  Operator  http://localhost:5173
  Owner     http://localhost:5174

  operator@demo.backstop.local / demo-operator-2026!
  owner@demo.backstop.local    / demo-owner-2026!

── Operator flow ──────────────────────────────────────────────────
  1. /upload — upload data/synthetic/sample-claims.csv (idempotent OK)
  2. / — work queue shows SYN-CLM-002 and SYN-CLM-003
  3. Open SYN-CLM-003 (Cigna / SYN-PAT-003)
     • Eligibility panel — benefit exhausted warning
     • Denial risk panel — moat scores from payer_intelligence
     • Approve or Override flags (override needs a reason)

── Owner flow ─────────────────────────────────────────────────────
  4. / — KPI tiles load (clean-claim rate, denial rate, $ recovered)
  5. Drill-down filters: Open flags → SYN-CLM-002/003; All claims → full list
  6. Upload data/synthetic/sample-outcomes.csv (idempotent OK)

── Headless equivalent ────────────────────────────────────────────
  npm run demo:e2e -- --auto     # seed + API click-through (no browser)
  npm run demo:e2e -- --verify   # full CI self-check

Legacy Next.js prototype (do not extend): npm run dev:legacy → :3000
EOF
}

case "$MODE" in
  manual|"")
    print_playbook
    ;;
  --auto)
    echo "→ WS-09 headless E2E (seed + clickthrough)…"
    npm run seed
    npm run clickthrough
    echo ""
    echo "✓ Headless E2E passed. Run without flags for the manual browser playbook."
    ;;
  --verify)
    echo "→ WS-09 full verify…"
    npm run verify
    ;;
  -h|--help)
    echo "Usage: npm run demo:e2e [-- --auto | --verify | --help]"
    ;;
  *)
    echo "Unknown option: $MODE (try --auto, --verify, or --help)"
    exit 1
    ;;
esac
