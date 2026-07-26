MONA Frontend (scaffold)

This folder contains a Next.js + Tailwind scaffold for the MONA frontend with a minimal Auth0 integration and API proxy routes that forward to your existing backend.

Environment variables (add in Render or Vercel):
- AUTH0_SECRET, AUTH0_BASE_URL, AUTH0_ISSUER_BASE_URL, AUTH0_CLIENT_ID, AUTH0_CLIENT_SECRET (for @auth0/nextjs-auth0)
- NEXT_PUBLIC_API_URL or MONA_API_URL — URL of the existing Mona API (e.g., https://mona-cancer-api.onrender.com)
- SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (if using Supabase from backend)

Commands:
  cd frontend
  npm install
  npm run dev

Notes:
- This scaffold intentionally provides proxy API endpoints at /api/* that forward to an upstream API. You can replace or extend them with server-side logic.
- Do NOT commit secrets. Add them as Render/GitHub secrets.
- Tailwind is configured; run the normal install steps after cloning.
