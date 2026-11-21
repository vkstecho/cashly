# Cashly calculator update — 21 November 2026

## Included
- All five calculators start collapsed and open individually; clicking another closes the previous one.
- Added "Can I retire today?" guided questionnaire with salary first, then household expenses, insurance premiums and payment frequency, 3-year device replacement costs, accessible assets, physical gold in grams/tola, property, rent, loans, major goals and investment assumptions.
- Results show current monthly surplus/shortfall, estimated liquid and illiquid assets, net worth, emergency reserve, inflation-adjusted retirement corpus target, conditional yes/no, and a stress test.
- Corrected the existing retirement-corpus calculator's annual/monthly mismatch (the previous formula calculated a corpus based on one month's spending for each year of retirement).
- Gold: attempts to load an indicative XAU/USD international spot reference and USD/INR FX rate using public APIs; the rate is NOT a guaranteed live Indian retail/buyback quote. User can override with a local 24K rate. If the external fetch fails, manually enter a rate; 0 means gold is excluded. No financial answers are transmitted to the APIs.
- Wizard answers stay in page memory only and are cleared when the page reloads.

## Deployment
Upload the contents of `cashly-site/` to the root of your `cashly` GitHub repository. Keep existing blog image JPG files already in GitHub; they are not contained in the original uploaded archive.

## Financial limitations
The retirement tool is an educational projection, not financial advice or a guarantee of lifelong solvency. It excludes self-occupied home and illiquid land from spendable corpus, discounts rental income by 25%, gold by 10%, and deducts debts, goals, and an emergency fund. EPF/PPF/NPS are shown separately until accessible. Salary stops at retirement. Simplifications: no per-loan amortization, no separate medical inflation, no sequence-of-returns simulation, no tax-bracket modelling, and no guaranteed gold API uptime. A conditional YES is not an instruction to retire.
