# How it was verified

Run on 2026-10-07: Vitest 20 tests; Playwright 58 tests against the production build, passing both in Playwright's Chromium (headless shell 153, the path CI uses) and in an installed Google Chrome 154. They include axe-core accessibility scans (light and dark), keyboard operation, the CSP check, all 18 examples, redaction downloads, the 5 MB limit and no horizontal scrolling at 375, 768 and 1440 px. Transcripts: `docs/evidence/vitest.txt`, `docs/evidence/e2e-playwright-chromium.txt`, `docs/evidence/e2e-google-chrome-154.txt`, `docs/evidence/check-pairing.txt`.
