#!/usr/bin/env bash
# Start operator (5173) + owner (5174) after clearing stale Vite processes.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "→ Stopping stale Vite processes…"
pkill -f vite 2>/dev/null || true
sleep 0.5

echo "→ Starting operator (http://localhost:5173) and owner (http://localhost:5174)…"
npm run dev:operator &
OP_PID=$!
npm run dev:owner &
OWN_PID=$!

cleanup() {
  kill "$OP_PID" "$OWN_PID" 2>/dev/null || true
  wait "$OP_PID" "$OWN_PID" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

wait
