#!/usr/bin/env bash
# predeploy guardrail + deploy all Phase 1 edge functions (synthetic project).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

PROJECT_REF="ndgembdlqevybokxikkd"
FUNCTIONS="ingest-claims run-scrub gate-action ingest-outcomes analytics-kpi"

echo "→ Running predeploy:edge…"
npm run predeploy:edge

if ! command -v supabase >/dev/null 2>&1; then
  echo ""
  echo "✗ supabase CLI not found."
  echo "  Install: https://supabase.com/docs/guides/cli"
  exit 1
fi

echo "→ Checking Supabase CLI auth…"
if ! supabase projects list >/dev/null 2>&1; then
  echo ""
  echo "✗ Supabase CLI is not authenticated."
  echo "  Run: supabase login"
  echo "  Then retry: npm run deploy:edge"
  exit 1
fi

echo "→ Deploying edge functions to ${PROJECT_REF}…"
set +e
DEPLOY_OUT=$(supabase functions deploy $FUNCTIONS --project-ref "$PROJECT_REF" 2>&1)
DEPLOY_STATUS=$?
set -e

if [ "$DEPLOY_STATUS" -ne 0 ]; then
  echo "$DEPLOY_OUT"
  if echo "$DEPLOY_OUT" | grep -qiE 'access token|not logged|login|unauthorized|401|NotFound.*profile'; then
    echo ""
    echo "✗ Deploy failed — Supabase CLI auth required."
    echo "  Run: supabase login"
    echo "  Then retry: npm run deploy:edge"
  else
    echo ""
    echo "✗ Deploy failed (exit $DEPLOY_STATUS). See output above."
  fi
  exit "$DEPLOY_STATUS"
fi

echo "$DEPLOY_OUT"
echo ""
echo "✓ Edge functions deployed to ${PROJECT_REF}."
