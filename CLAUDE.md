# anchortrace-studio: working notes

Commands: `pnpm install --frozen-lockfile`, `pnpm run typecheck`, `pnpm test` (Vitest, `test/`), `pnpm build` (runs `check:pairing`, tsc, vite build), `pnpm preview` (port 4173), `pnpm test:e2e` (builds, then Playwright; set `PW_CHANNEL=chrome` to use installed Chrome, otherwise run `pnpm exec playwright install chromium`).
Constraints: pnpm 11; Node >= 22; TS 7; React 19; Vite 8; exact pins. The SDK comes from `vendor/anas.abubakar-anchortrace-sdk-0.1.1.tgz`; never import from a sibling path. `pairing.json` records the SDK tag, commit, tarball hash, schema versions and vendored schema hashes.
Rules: no reconciliation logic in the studio, no network access (CSP `connect-src 'none'`), no storage, no hard-coded verdicts. Keep "Confirmation on chain is not a bank payout" and the synthetic labels visible. Outcome colours always come with text and glyphs.
Re-pairing the SDK: build + tag the SDK, `pnpm pack`, replace the tarball in `vendor/`, copy `schema/*.json` into `vendor/schema/`, update `pairing.json` (version, tag, commit, hashes), `pnpm install`, run everything.
Commit rules: one logical unit per commit, no AI co-author trailers, author is the repo owner.
Unfinished: hosting, a Web Worker for very large inputs, browsers other than Chrome, screen-reader testing, adoption validation.
