# Cashly – Capacitor + Native SMS Setup

This scaffold turns the Cashly PWA into an Android app that can **read bank SMS** via a custom Capacitor plugin.

## Prerequisites

- Node.js 18+
- Android Studio (Hedgehog or newer)
- JDK 17
- Physical Android device or emulator (API 26+)

## 1. Install dependencies

```bash
cd moneyflow   # or your repo root
npm install
```

## 2. Add Android platform

```bash
npx cap add android
npx cap sync android
```

## 3. Install the SMS plugin code

Copy the Kotlin plugin into the Android app:

```bash
# From repo root
mkdir -p android/app/src/main/java/com/vkstech/cashly
cp android-sms-plugin/src/main/java/com/vkstech/cashly/SmsInboxPlugin.kt \
   android/app/src/main/java/com/vkstech/cashly/
```

## 4. Register the plugin

Edit `android/app/src/main/java/.../MainActivity.java` (or `.kt`):

**Java:**
```java
import com.vkstech.cashly.SmsInboxPlugin;

// inside onCreate / bridge init:
registerPlugin(SmsInboxPlugin.class);
```

**Kotlin:**
```kotlin
import com.vkstech.cashly.SmsInboxPlugin

// in MainActivity:
registerPlugin(SmsInboxPlugin::class.java)
```

## 5. Permissions

In `android/app/src/main/AndroidManifest.xml` add:

```xml
<uses-permission android:name="android.permission.READ_SMS" />
```

(See `android-sms-plugin/AndroidManifest.snippet.xml`.)

Google Play note: `READ_SMS` is a **restricted permission**. For Play Store you must declare a core use-case (financial SMS parsing) and may need a permissions declaration form. Sideload / internal testing works without that.

## 6. Build & run

```bash
npx cap sync android
npx cap open android
# In Android Studio: Run ▸ app
```

## 7. How the app uses it

- `js/sms-bridge.js` detects Capacitor and calls `SmsInbox.read()`.
- Settings → **Import from SMS** will:
  - On native: request permission → read inbox → parse bank SMS → preview → import
  - On browser/PWA: open paste UI (clipboard)

## 8. Optional: live SMS receiver

For auto-import when a new SMS arrives, add a `BroadcastReceiver` for `android.provider.Telephony.SMS_RECEIVED` and forward the body into the WebView via `bridge.triggerJSEvent`. Not included in this minimal scaffold.

## Plugin API

| Method | Returns |
|--------|---------|
| `SmsInbox.checkPermission()` | `{ status: 'granted' \| 'prompt' \| 'denied' }` |
| `SmsInbox.requestPermission()` | `{ status: 'granted' \| 'denied' }` |
| `SmsInbox.read({ max, bodyContains })` | `{ messages: [{ body, address, date }] }` |

## Troubleshooting

- **Plugin not found**: ensure `registerPlugin` is called and `npx cap sync` was run.
- **Permission always denied**: check Manifest; on Android 6+ user must grant at runtime.
- **Empty messages**: some OEMs (Xiaomi, Oppo) restrict SMS access for non-default SMS apps — test on stock Pixel/emulator first.
