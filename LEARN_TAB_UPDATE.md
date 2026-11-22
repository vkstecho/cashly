# Cashly Learn Tab (V4)

- First bottom tab now **Learn**, sourced dynamically from `https://cashly.vkstech.com/blog/manifest.json` (same-origin path `/blog/manifest.json`).
- Uses `posts[]` fields `folder`, `title`, `excerpt`, `date`, `tags`, `cover`, `published`. Only `published !== false` entries with safe folder paths appear.
- Newly published blogs appear after refreshing the tab or reopening the app; no ZIP rebuild is required, but **update and commit `blog/manifest.json`** alongside each article.
- Images must be uploaded to their respective `blog/<folder>/cover.jpg` paths.
- Tap an article to open it inside the app; Back to Learn returns to the list.
- Existing Spends, Splits, More and account screens are preserved. The previous Home screen code remains but is not a bottom tab.
- The app must be hosted at `https://cashly.vkstech.com/app/`, with the public manifest at `/blog/manifest.json`.
- A network connection is required to refresh articles. Errors show Retry. The app shell remains available offline.
- Deploy files from inside `cashly-site/` into the GitHub repository root. Keep all existing blog JPGs already hosted on GitHub.
- PWA service worker cache version was bumped to pick up the new script.
