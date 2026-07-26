MONA Frontend (scaffold)

This folder contains a Next.js + Tailwind scaffold for the MONA frontend with a minimal Auth0 integration and API proxy routes that forward to your existing backend.

Environment variables (add in Render or Vercel):
- AUTH0_SECRET, AUTH0_BASE_URL, AUTH0_ISSUER_BASE_URL, AUTH0_CLIENT_ID, AUTH0_CLIENT_SECRET (for @auth0/nextjs-auth0)
- NEXT_PUBLIC_API_URL or MONA_API_URL — URL of the existing Mona API (e.g., https://mona-cancer-api.onrender.com)
- SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (if using Supabase from backend)

CI / Auto-deploy to Render (recommended):
- Add these repository secrets in GitHub (Settings → Secrets → Actions):
  - RENDER_API_KEY — a Render API key with deploy permissions (keep secret)
  - RENDER_FRONTEND_SERVICE_ID — the Render service ID for the frontend service (found in Render dashboard)

When those secrets are present, the GitHub Action `Build & Deploy Frontend to Render` will build the frontend and call the Render API to trigger a deploy automatically whenever main is updated.

Commands:
  cd frontend
  npm install
  npm run dev

Notes:
- Do NOT commit secrets.
- Tailwind is configured; run the normal install steps after cloning.
