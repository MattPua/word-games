#!/usr/bin/env bash
# Ensures a single, reusable debuggable Chrome is running for chrome-devtools MCP.
# chrome-devtools MCP is configured (~/.cursor/mcp.json) with --browserUrl pointing at
# this instance, so every agent tool call opens a new tab here instead of a new
# Chrome App process. Safe to re-run: no-ops if the debug port already answers.
set -euo pipefail

PORT="${CHROME_DEBUG_PORT:-9222}"
PROFILE_DIR="${CHROME_DEBUG_PROFILE:-$HOME/.cache/chrome-devtools-mcp/agent-profile}"

if curl -fsS "http://127.0.0.1:${PORT}/json/version" >/dev/null 2>&1; then
  echo "Chrome debug endpoint already up on :${PORT}."
  exit 0
fi

echo "Starting shared debug Chrome on :${PORT} (profile: ${PROFILE_DIR})..."
open -na "Google Chrome" --args \
  --remote-debugging-port="${PORT}" \
  --user-data-dir="${PROFILE_DIR}" \
  --no-first-run \
  --no-default-browser-check

for _ in $(seq 1 20); do
  if curl -fsS "http://127.0.0.1:${PORT}/json/version" >/dev/null 2>&1; then
    echo "Chrome debug endpoint ready on :${PORT}."
    exit 0
  fi
  sleep 0.5
done

echo "Chrome did not open the debug port in time; check for a blocked launch." >&2
exit 1
