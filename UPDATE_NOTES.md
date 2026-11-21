# Cashly update — 21 November 2026

## Applied
- Replaced all four blog image placeholders with actual local JPEG image elements and accessible branded fallbacks.
- Updated blog listing manifest to use local cover.jpg files instead of external YouTube thumbnails.
- Added the user-supplied Cashly green logo as website/favicon/PWA icons.
- Corrected `/app/` PWA scope, start URL, shortcuts, service worker registration and offline cache paths.
- Limited service worker caching to known static shell assets, not finance records or API responses.
- Added canonical links and Open Graph metadata to blog posts.

## IMPORTANT — images not included in source ZIP
The original ZIP contains **no blog JPG images**. Your GitHub screenshot shows images uploaded separately. Keep those JPG files in GitHub when deploying this update; do not delete them. The blog HTML now displays them automatically when present. Missing images show a branded fallback.

## Requires separate verification
- Firebase production security rules and authorization cannot be verified from the static ZIP; audit before launch.
- Android SMS permissions, Play Store policies, account deletion, and real-device PWA testing require deployment/runtime review.
- New article dates, investment calculations, third-party customer service details and SEO content require editorial review.
- GitHub Pages/custom hosting must serve `/app/` from the site root for the absolute app paths used here.

## Deployment
Merge the contents of `cashly-site/` into the GitHub repository root (do not remove existing blog JPGs). Commit, deploy, hard-refresh. If the old service worker is installed at `/sw.js`, unregister it once using browser DevTools > Application > Service Workers to avoid old root-scope cache interference.
