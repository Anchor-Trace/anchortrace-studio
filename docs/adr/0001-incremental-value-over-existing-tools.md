# ADR 0001: What AnchorTrace Studio adds over existing tools

Status: accepted, 2026-10-07. Evidence below is what was read on that date; no tool was executed and this is not a survey of every explorer.

## Context
The SDK (`anchortrace-sdk`) already produces the verdicts. The question for this repository is narrower: why a browser app at all, when there is a CLI, and what do existing browser tools already do for someone investigating an anchor payment?

## Existing tools inspected
- **Stellar Lab** (developers.stellar.org "Lab" page). It is described as a development and testing tool with an API Explorer for Horizon endpoints, a Transaction Dashboard that shows "transaction details including XDR, operations, results, and metadata", saved transactions, and the ability to simulate and submit transactions. It shows what happened on the ledger. It has no concept of an anchor's SEP-24 record, so it cannot say whether a payment agrees with that record, and it can submit transactions, which this studio never does.
- **Stellar Wallet SDK** and **Anchor Platform** (see the SDK repository's ADR 0001 for what was read). Both are building blocks for wallets and anchors, not a place where a support person can drop in a record and a transaction and see why they disagree.
- Block explorers other than Lab were not inspected.

## What the studio adds
1. A place to run the SDK's judgment without installing anything, on data that never leaves the page: the production build ships a Content-Security-Policy with `connect-src 'none'`, so the browser itself refuses any connection from the page, and a test asserts it.
2. Presentation the CLI cannot give: the conflicting operations are highlighted next to the finding that names them, with a field-by-field comparison (expected versus observed, differences emphasised), a timeline that shows collapsed duplicates and out-of-order updates, and redacted exports chosen by category.
3. Synthetic, labelled examples that the SDK generated and that the browser recomputes and compares with the SDK's shipped report on every selection.

## Decision
Build a static, dependency-light single-page app (React, Vite) that bundles a pinned tarball of the SDK, implements no reconciliation logic of its own, and refuses to run when the bundled SDK or its schema versions differ from the recorded pairing. Do not add network access, live Horizon reads, accounts, storage or analytics. If Stellar Lab grows anchor-record reconciliation, this studio's presentation work should be offered there instead.

## Consequences
- Every number and finding on screen is SDK output. A bug in the verdicts is an SDK bug; a bug in the display is a studio bug, and the tests separate the two.
- The studio cannot fetch evidence for you. You paste or upload Horizon JSON, or use the SDK CLI's `--horizon` option and open the saved report here.
- Shipping updates means re-pairing: rebuild the SDK tarball, update `vendor/`, `pairing.json` and the vendored schemas, and run the pairing check.
