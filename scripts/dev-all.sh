#!/usr/bin/env bash
# Start operator (5173) then owner (5174) on fixed ports — kill anything already bound.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

kill_port() {
  local port=$1
  local pids
  pids=$(lsof -ti "tcp:${port}" -sTCP:LISTEN 2>/dev/null || true)
  if [ -n "$pids" ]; then
    echo "  killing PID(s) on :${port} → ${pids}"
    kill -9 ${pids} 2>/dev/null || true
  fi
}

echo "→ Clearing ports 5173–5178 and stale Vite processes…"
for port in 5173 5174 5175 5176 5177 5178; do
  kill_port "$port"
done
pkill -9 -f "vite" 2>/dev/null || true
sleep 1

echo "→ Starting operator on http://localhost:5173 …"
npm run dev:operator &
OP_PID=$!

echo "→ Waiting for operator to bind :5173…"
for _ in $(seq 1 30); do
  if lsof -ti "tcp:5173" -sTCP:LISTEN >/dev/null 2>&1; then
    break
  fi
  sleep 0.2
done

echo "→ Starting owner on http://localhost:5174 …"
npm run dev:owner &
OWN_PID=$!

cleanup() {
  kill "$OP_PID" "$OWN_PID" 2>/dev/null || true
  wait "$OP_PID" "$OWN_PID" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

sleep 1
echo ""
echo "  Operator → http://localhost:5173"
echo "  Owner    → http://localhost:5174"
echo ""

wait
