# How to publish a Cashly blog post

## Folder rule (sequential)

Create a folder under `blog/`:

```text
blog/002-salary-day-in-india/
  index.html
  cover.jpg    (optional)
```

Use a **numeric prefix** so order stays clear: `001-…`, `002-…`, `003-…`.

## Register in manifest

Edit `blog/manifest.json` (or use **Admin** at `/admin.html` → download updated manifest → replace file in repo):

```json
{
  "posts": [
    {
      "id": "002",
      "slug": "salary-day-in-india",
      "folder": "002-salary-day-in-india",
      "title": "Salary day routine that actually works",
      "excerpt": "A 20-minute flow after salary credit.",
      "date": "2026-11-20",
      "tags": ["salary", "budget"],
      "cover": "",
      "published": true
    }
  ]
}
```

Commit + deploy. The site lists posts automatically (newest number first).

## Admin OTP

Open: `https://cashly.vkstech.com/admin.html`  
OTP is sent only to **+91 8929397949** (Firebase phone auth, same project as the app).

Static hosting cannot write files — Admin downloads a new `manifest.json` for you to commit.
