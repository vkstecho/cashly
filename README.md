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
The official YouTube channel is @cashlybyVKS. The website and Learn read the same verified catalog at `content/videos.json`.

## Admin
Firebase phone OTP (project `moneyflow-vkstech`). Only `+918929397949`.

## Deploy
Static host (Firebase Hosting, Cloudflare Pages, Vercel, GitHub Pages).  
Point domain root to this folder. App lives at `/app/`.

## YouTube catalog release

The website and Cashly Learn use the same API-generated catalog. See the [YouTube acceptance and rollout guide](CASHLY_YOUTUBE_RELEASE.md).
