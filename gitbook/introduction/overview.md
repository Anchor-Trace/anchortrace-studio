# Overview

Hosted demo: https://anchortrace-studio-anasamasama.vercel.app

Investigate an anchor payment in your browser. Paste a SEP-24 transaction record and the Stellar evidence; see why they agree or not, with the conflicting operations highlighted. Nothing leaves the page.

> **Confirmation on chain is not a bank payout.** For a withdrawal, a matching Stellar payment shows only the wallet-side transfer. The anchor's bank or cash payout cannot be observed here, and every result says so.

This is the browser front end of [anchortrace-sdk](https://github.com/Anchor-Trace/anchortrace-sdk). It contains no reconciliation logic of its own: it bundles a pinned build of the SDK and displays the SDK's report.

![Wrong issuer example](https://raw.githubusercontent.com/Anchor-Trace/anchortrace-studio/main/docs/evidence/screenshots/02-wrong-issuer-desktop.png)

Screenshots in `docs/evidence/screenshots/` were taken from the production build with Playwright (`01` is the empty state).

Source: [anchortrace-studio on GitHub](https://github.com/Anchor-Trace/anchortrace-studio). Releases: [GitHub releases](https://github.com/Anchor-Trace/anchortrace-studio/releases).
