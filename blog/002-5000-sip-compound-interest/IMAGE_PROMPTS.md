# Image prompts for this blog post

**Image format used everywhere in this post: JPEG (`.jpg`) — not PNG.**


Generate in any AI image tool (Grok Imagine, Midjourney, Ideogram, etc.).
**Every image:** Cashly logo top corner (green C + “Cashly”).
**Where face needed:** attach your photo and write “face of the attached man”.

## cover.jpg (16:9) — replace cover slot
Premium personal-finance cover, 16:9. Light mint-to-white gradient. Large bold text: “₹5,000 / month → ₹3 Crore”. Subtitle: “10 साल की देरी ≈ ₹2 Crore का नुकसान”. Green upward compound curve into rupee coin stacks. Optional: face of the attached man, confident, casual formal. Top-right Cashly logo. Clean Indian fintech / NerdWallet style.

## info-simple-vs-compound.jpg
Two panels. Left: “Simple Interest” + flat grey line + small coins. Right: “Compound Interest” + steep teal curve + growing coins. Caption: “ब्याज पर ब्याज = तेज़ रफ्तार बाद में”. Cashly logo top-right. Vector, no photo faces.

## info-sip-timeline.jpg
Horizontal timeline. Title: “₹5,000 महीना SIP — समय का जादू”. Points: 10 yrs ~₹12 Lakh · 20 yrs ~₹50 Lakh · ~35 yrs ~₹3 Crore+. Rising green curve. Cashly logo. Large numbers.

## info-early-vs-late.jpg
Comparison. Left “जल्दी शुरू” tall green bar / big corpus. Right “10 साल बाद” shorter bar. Center badge “~₹2 Cr gap” or “देरी की कीमत”. Optional face of attached man on early side. Cashly logo.

## info-rule-of-72.jpg (optional, square/4:5)
Giant “72 ÷ रिटर्न% ≈ डबल”. Chips: 12% → ~6 yrs, 9% → ~8 yrs. Teal accents, Cashly logo.

## After generating
1. Save files in this folder with names above.
2. In index.html:
   - Cover: `<div class="cover"><img src="cover.jpg" alt="₹5,000 SIP to ₹3 crore"></div>`
   - Each infographic-slot: replace whole div with `<img src="info-....jpg" alt="..." style="width:100%;border-radius:14px;margin:18px 0;border:1px solid var(--line)">`
3. Optional: set manifest cover to full URL of cover.jpg after deploy.
