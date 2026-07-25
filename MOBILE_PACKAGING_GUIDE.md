# Capacitor Mobile App Packaging Guide (Android & iOS)

This guide documents how the MilkeKhao Angular PWA is packaged into native mobile apps for Android and iOS using Capacitor (MIT Licensed).

## App Details
- **App ID**: `com.milkekhao.app`
- **App Name**: `MilkeKhao`
- **Framework**: Angular 22+ Standalone PWA + Capacitor 7.0 (MIT License)

---

## 1. Prerequisites & Dependencies
Capacitor wraps the existing compiled Angular frontend web bundle (`dist/frontend/browser`).

```bash
# Navigate to frontend directory
cd src/frontend

# Install Capacitor Core & CLI (MIT Licensed)
npm install @capacitor/core
npm install -D @capacitor/cli @capacitor/android @capacitor/ios
```

---

## 2. Android Build & Deployment Procedure
1. Build production Angular web assets:
   ```bash
   npm run build
   ```
2. Initialize and sync Capacitor Android project:
   ```bash
   npx cap add android
   npx cap sync android
   ```
3. Open project in Android Studio and build Debug APK:
   ```bash
   npx cap open android
   ```
4. In Android Studio:
   - Go to **Build** -> **Build Bundle(s) / APK(s)** -> **Build APK(s)**.
   - Output APK location: `android/app/build/outputs/apk/debug/app-debug.apk`.

---

## 3. iOS Xcode Build Procedure (Mac + Xcode)
1. Ensure Xcode 16+ is installed on your Mac.
2. Add and sync Capacitor iOS platform:
   ```bash
   npx cap add ios
   npx cap sync ios
   ```
3. Open project in Xcode:
   ```bash
   npx cap open ios
   ```
4. In Xcode:
   - Select Signing & Capabilities -> choose your Apple Development Team.
   - Select target device (Simulator or connected iPhone) and click **Run (Cmd + R)**.

---

## 4. App Store & Google Play Publishing Developer Fees
> [!IMPORTANT]
> Official App Store publishing fees are mandatory platform costs assessed directly by Google and Apple:
> - **Google Play Store**: One-time **$25 USD** developer registration fee.
> - **Apple App Store**: Annual **$99 USD/year** Apple Developer Program membership.
>
> Neither fee is tied to open-source package licenses; Capacitor and all project dependencies remain 100% free and MIT-licensed for commercial production.
