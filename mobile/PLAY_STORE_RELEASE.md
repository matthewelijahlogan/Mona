# Mona Android Release

This app now refuses Play-style release builds unless a real upload key is configured. That keeps us from accidentally shipping a debug-signed bundle.

## 1. Generate an upload keystore

Run this from `mobile/`:

```powershell
keytool -genkeypair -v `
  -storetype PKCS12 `
  -keystore android/app/mona-upload-key.keystore `
  -alias upload `
  -keyalg RSA `
  -keysize 2048 `
  -validity 10000
```

If you already have a Play upload key, use that instead.

## 2. Configure signing

Create `mobile/keystore.properties` using the values in `mobile/keystore.properties.example`.

Use either:

- a relative keystore path such as `android/app/mona-upload-key.keystore`
- an absolute path if you store the keystore elsewhere

## 3. Build the Play bundle

From `mobile/`:

```powershell
$env:EXPO_PUBLIC_API_BASE_URL="https://your-render-service.onrender.com"
npm run android:bundle
```

Expected output:

`mobile/android/app/build/outputs/bundle/release/app-release.aab`

If you want the hosted backend enabled in the production app, replace the example URL above with the actual
Render service URL before building.

For a standalone phone test that works without Metro, use:

```powershell
npm run android:standalone
npm run android:standalone:install
```

That standalone APK embeds the JavaScript bundle and signs with the local debug keystore, so it is safe for device testing but not valid for Play upload.

## 4. Upload in Play Console

- Create or open the `Mona` app listing.
- Finish `App content` sections such as privacy policy, Data safety, ads, content rating, and target audience.
- Start with `Internal testing` or `Closed testing` unless this account is already production-ready.
- Upload `app-release.aab` to a new release.

## 5. Privacy policy URL

- A Play-safe starter page now lives at `docs/privacy-policy.html`.
- If you host this repo with GitHub Pages from `/docs`, the URL will be:
  `https://<your-github-username>.github.io/<your-repo-name>/privacy-policy.html`
- You can also upload the same file to your own site, for example:
  `https://touchofdavincistudios.com/privacy/mona`

## Notes

- The Android manifest now blocks `READ_EXTERNAL_STORAGE`, `WRITE_EXTERNAL_STORAGE`, and `SYSTEM_ALERT_WINDOW` to reduce Play review risk.
- The mobile project now keeps `android/` source files in version control while still ignoring generated build output.
