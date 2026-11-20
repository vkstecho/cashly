# Cashly brand site + app

Deploy this folder to **cashly.vkstech.com** (or your Cashly domain).

| Path | What |
|------|------|
| `/` | Premium landing |
| `/blog.html` + `/blog/` | Auto blog list from `blog/manifest.json` |
| `/videos.html` | Auto YouTube list from @cashlybyVks |
| `/app/` | Cashly web app (PWA) |
| `/admin.html` | Blog admin — OTP to **8929397949** |

## Blog
Numbered folders + `manifest.json`. See `blog/PUBLISH.md`.

## YouTube
Channel ID `UCfhIm-gZXMWel81oPMSm2qQ` (@cashlybyVks). RSS via public proxy — no API key.

## Admin
Firebase phone OTP (project `moneyflow-vkstech`). Only `+918929397949`.

## Deploy
Static host (Firebase Hosting, Cloudflare Pages, Vercel, GitHub Pages).  
Point domain root to this folder. App lives at `/app/`.
