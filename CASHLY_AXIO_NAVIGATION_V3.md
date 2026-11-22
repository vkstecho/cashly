# Cashly V3 — Axio video comparison and navigation update

## Implemented
- Bottom tab 2 is **Spends**, with the existing Transactions / Categories / Merchants screen, filtering and transaction editing. Tab 3 remains Splits.
- Tapping the account avatar opens a dedicated **Account** screen, with navigation to the existing profile editor, preferences, statements, SMS import and settings.
- Split cards open a group detail screen with members, equal-share amounts, and manual paid/unpaid status stored in existing split data. This is **not** a payment service or collaborative sync.
- Existing Home and More tabs retained.
- PWA start_url, id, scope remain `/app/`; website links to launch the app should point to `/app/`.
- Fixed share/action URL cleanup to preserve the `/app/` pathname; service worker cache version bumped.

## Installation caveat
An installed Android WebAPK/PWA created from an older manifest or a shortcut to the website root may still launch the old target. After deploying, uninstall the old shortcut/PWA, clear site data only if you have backed up any local data, and install **from https://cashly.vkstech.com/app/**. Chrome controls WebAPK launch URLs; a website ZIP alone cannot forcibly reconfigure an already installed native APK. For native Capacitor APK, rebuild and sign the Android app from the project; this ZIP is website/PWA source, not an APK.

## Scope and limitations
This implements navigation and selected flows inspired by the supplied Axio recording, not a full 1:1 recreation. Axio's banking integrations, remote collaborative splits, card products and third-party services are not included. Existing Firebase configuration and server-side permissions have not been verified. Manual settlement marks do not transfer money.
