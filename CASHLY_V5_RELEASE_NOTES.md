# Cashly V5 — PWA mobile fixes

Based on the supplied Cashly and Axio screen recordings.

- OTP: six boxes now use a responsive 6-column grid within the login card; reduced oversized login artwork.
- OTP autofill: retains WebOTP with an AbortController, accepts full-code paste/autofill. **Automatic retrieval requires a compatible origin-bound SMS** such as `@cashly.vkstech.com #123456`. Firebase's default SMS text may not have this format. PWA cannot access the SMS inbox directly. Do not promise automatic OTP detection without verifying SMS template/provider behavior.
- Installed PWA: app manifest start URL set to `/app/index.html`; root website standalone redirect added for legacy shortcuts installed from root. Service worker cache version bumped. Reinstall may be required to update an existing launcher shortcut.
- Login: Firebase auth state now gates restored sessions, rather than trusting only localStorage.
- Spends and Reports: six-month income/spending chart computed from recorded transactions; no fabricated values.
- Visual polish: smaller typography, responsive row overflow protection, compact bottom navigation.

## Deployment
Upload contents of `cashly-site/` into GitHub repository root. Preserve existing blog JPGs. Test with actual Android Chrome installation. Before reinstalling, export or back up any data that exists only on-device; uninstalling can clear storage.

## Limitations
No real-device/browser testing, Firebase OTP provider configuration changes, or Google Play approval performed. Axio proprietary integrations are not reproduced.
