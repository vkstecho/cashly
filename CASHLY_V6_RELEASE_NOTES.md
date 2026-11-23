# Cashly V6 — Bilingual Grouped Retirement Planner + In-App Calculators

Based on Cashly V5. Upload the contents of `cashly-site/` to the repository root, preserving existing blog JPG assets.

## Changes
- Retirement planner consolidated from 42 separate screens into 8 grouped screens.
- English / Hindi selector within the retirement calculator; headings, field labels and navigation localized. Some detailed financial report explanatory notes remain in English.
- Health and term insurance premium + frequency appear together; gold weight/unit/purity/rate together.
- Compact contextual help, sticky progress mood, and result-page inline editing with recalculation.
- Existing retirement calculation assumptions preserved; model remains an estimate, not financial advice.
- Cashly PWA Learn tab now has a top Calculators shortcut. It opens the existing website calculator page inside the app via same-origin iframe with a back button.
- Existing blog feed, Spends, Splits, Profile, PWA and website pages retained.

## Limitations
- Hindi localization covers the new guided input experience and key report headings, not every paragraph in the legacy detailed report or the other four calculators.
- Financial answers stay in page memory and are not synced; reloading resets the calculator.
- In-app calculators require access to the same-origin `/calculators.html` and browser iframe support.
- Gold spot reference requires internet; local Indian resale price must be verified.
- JavaScript syntax and archive checks are performed; live device tests and production finance validation remain necessary.
