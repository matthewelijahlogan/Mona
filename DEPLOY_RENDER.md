Render deployment checklist — MONA backend

Goal: get the merged backend changes live on Render and verify quickly by visiting your Render URL.

Prerequisites:
- You have access to the Render dashboard for the Mona service and an API key if you want to trigger deploys programmatically.
- The repository's main branch contains the merged changes (already done).

Required environment variables (set in Render service settings -> Environment):
- AUTH0_ISSUER_BASE_URL (e.g. https://your-tenant.us.auth0.com)
- AUTH0_AUDIENCE (the API audience configured in Auth0)
- (Optional) SUPABASE_URL
- (Optional) SUPABASE_SERVICE_ROLE_KEY
- (Optional) MONA_LEADERBOARD_PATH (if you want the JSON file stored elsewhere)

Manual deploy steps in Render UI:
1. Open your Render service for the Mona backend.
2. Confirm the service is set to deploy from branch: main.
3. Add the environment variables listed above (Environment -> Environment Variables).
4. Trigger Manual Deploy (Deploys -> Manual Deploy) or wait for the auto-deploy on merge.
5. Open the service URL (e.g., https://mona-cancer-api.onrender.com) in the browser and append /status to see health info: https://<your-render-url>/status

Programmatic deploy (optional):
- Use the Render API to trigger a deploy. Replace <SERVICE_ID> and <RENDER_API_KEY>:

  curl -X POST "https://api.render.com/deploys" \
    -H "Authorization: Bearer <RENDER_API_KEY>" \
    -H "Content-Type: application/json" \
    -d '{"serviceId":"<SERVICE_ID>"}'

- To find SERVICE_ID, view the service details in Render or use the Render API to list services.

Quick verification (curl) — from your machine:

# Replace RENDER_URL with your service URL (no trailing slash), e.g. https://mona-cancer-api.onrender.com
RENDER_URL="https://mona-cancer-api.onrender.com"

# 1) Health
curl -s $RENDER_URL/status | jq .

# 2) Elements (should return a list of element symbols)
curl -s $RENDER_URL/elements | jq .

# 3) Leaderboard (should return entries or an empty list)
curl -s "$RENDER_URL/leaderboard" | jq .

# 4) Submit a smoke test (no auth):
curl -s -X POST "$RENDER_URL/leaderboard/submit" -H 'Content-Type: application/json' \
  -d '{"recipe_name":"Smoke Test","submitted_by":"auto-smoke","cancer_type":"generic","elements":{"H":1}}' | jq .

Notes on Auth0 testing:
- To test an authenticated request, obtain an access token from Auth0 (Client Credentials grant or authorize a test user). Example (Client Credentials — replace DOMAIN, CLIENT_ID, CLIENT_SECRET, AUDIENCE):

  curl --request POST "https://<DOMAIN>/oauth/token" \
    --header "content-type: application/json" \
    --data '{"client_id":"<CLIENT_ID>","client_secret":"<CLIENT_SECRET>","audience":"<AUDIENCE>","grant_type":"client_credentials"}'

- Use the returned access token as: Authorization: Bearer <token> in the /leaderboard/submit request.

If you want, run the included scripts/smoke_test.sh script from the repo (it will try to discover elements and cancer types automatically). Usage:

  ./scripts/smoke_test.sh https://mona-cancer-api.onrender.com

If any step fails, open the Render deploy logs (service -> Deploys -> View Logs) and paste any errors here and I'll diagnose.