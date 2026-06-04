# Tonight Deploy Checklist

This repo is set up for three parallel goals:

1. Push the code to GitHub.
2. Create the FastAPI backend on Render.
3. Upload the Android app to Google Play.

## 1. GitHub

- Remote: `https://github.com/matthewelijahlogan/Mona.git`
- The Android app package is `com.touchofdavincistudios.mona`.
- The privacy policy page is `docs/privacy-policy.html`.

## 2. Render backend

Recommended first pass:

- Service type: `Web Service`
- Runtime: `Python`
- Branch: `main`
- Build command: `pip install -r requirements.minimal.txt`
- Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
- Health check path: `/status`

Files already prepared for Render:

- `render.yaml`
- `requirements.minimal.txt`
- `main.py`

Important note:

- The leaderboard writes to `MONA_LEADERBOARD_PATH`.
- On Render's default ephemeral filesystem, leaderboard submissions can reset on redeploy.
- For persistence, attach a disk at `/opt/render/project/src/render-data`.

## 3. Mobile app build for Play

Before the final Play build, set the backend URL for the app:

```powershell
$env:EXPO_PUBLIC_API_BASE_URL="https://your-render-service.onrender.com"
cd mobile
npm run android:bundle
```

The release bundle output is:

`mobile/android/app/build/outputs/bundle/release/app-release.aab`

For a standalone phone build without Metro:

```powershell
cd mobile
npm run android:standalone
npm run android:standalone:install
```

## 4. Privacy policy URL

The file is ready at:

- `docs/privacy-policy.html`

To use it in Play Console, host it publicly. Easiest path:

- push repo to GitHub
- enable GitHub Pages from `/docs`
- use `https://<your-github-username>.github.io/<repo-name>/privacy-policy.html`

## 5. Play Console

Use:

- App package: `com.touchofdavincistudios.mona`
- Developer/company name: `Touch Of Davinci Studios`

If this is a new personal Play developer account, production access may still require a closed test before public launch.
