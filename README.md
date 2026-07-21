# Max — Robot Control App

## Setup (run these in order)

```bash
npm install
npm run dev           # test in browser
npm run build         # build for Android
npx cap add android   # first time only
npx cap sync          # every time after build
npx cap open android  # open in Android Studio
```

## Android Studio — before running on phone
1. Open `android/app/src/main/AndroidManifest.xml` — already has all permissions
2. Connect phone via USB, enable USB debugging
3. Hit Run ▶

## WiFi Flow (what works on Android)
- App requests location permission on launch (required for WiFi scan)
- Tap Connect → Android shows system dialog to join MAXBOT_SETUP
- App talks to ESP @ 192.168.4.1, gets network list
- User picks network + enters password
- App sends credentials to ESP securely
- ESP connects to home WiFi, shows IP on its display
- User types IP → connected

## In browser (npm run dev)
- All screens work
- WiFi connect uses mock data (no real ESP)
- Storage uses localStorage instead of Capacitor Preferences
- Everything else works identically

## Package ID
`com.maxbot.prototype`
