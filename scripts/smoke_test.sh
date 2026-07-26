#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${1:-${RENDER_URL:-}}"
if [ -z "$BASE_URL" ]; then
  echo "Usage: $0 <BASE_URL>  (or set RENDER_URL env var)"
  exit 2
fi

echo "Using base URL: $BASE_URL"

echo "\n1) Checking /status"
curl -s "$BASE_URL/status" | jq . || true

echo "\n2) Fetching /elements (will pick first symbol)"
ELEMENT=$(curl -s "$BASE_URL/elements" | jq -r '.[0] // "H"')
echo "Found element: $ELEMENT"

echo "\n3) Fetching /cancer-types (will pick first name)"
CANCER=$(curl -s "$BASE_URL/cancer-types" | jq -r '.[0].name // "generic"')
echo "Using cancer type: $CANCER"

echo "\n4) Submitting a smoke test to /leaderboard/submit"
PAYLOAD=$(jq -n --arg rn "Smoke Test" --arg sb "auto-smoke" --arg ct "$CANCER" --arg el "$ELEMENT" '{recipe_name:$rn, submitted_by:$sb, cancer_type:$ct, elements: {($el):1}}')

echo "Payload: $PAYLOAD"

curl -s -X POST "$BASE_URL/leaderboard/submit" -H 'Content-Type: application/json' -d "$PAYLOAD" | jq . || true

echo "\n5) Fetching /leaderboard"
curl -s "$BASE_URL/leaderboard" | jq . || true

echo "\nSmoke test completed. If the calls succeeded, backend is responding."