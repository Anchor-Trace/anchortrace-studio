# What you can do

- Pick one of 18 **synthetic examples** (a made-up SEP-24 record around a recorded Stellar testnet transaction): matched, wrong destination, wrong issuer, wrong amount, ambiguous multi-operation, path payment, claimable balance, Soroban transfer, pending, missing evidence, reordered and duplicate status updates, and more. The browser re-runs the SDK on the example and checks the result equals the report the SDK generated.
- Paste or upload your own record and Horizon evidence (an AnchorTrace evidence file, or a raw `{ "transaction": ..., "operations": ... }` pair taken from `/transactions/<hash>` and `/transactions/<hash>/operations`), choose the fee policy and other verdict options, and press Reconcile.
- Read the status timeline, the findings, what the record implies on chain, and each operation considered with an expected-versus-observed table. A finding's button highlights the operations it names.
- Open a report saved by the SDK's CLI.
- Download a **redacted** report (accounts, memos, emails by default; issuers and hashes optional) as JSON or Markdown.

Outcomes: `matched`, `pending`, `discrepant`, `ambiguous`, `unsupported`, `insufficient_evidence` (definitions in the SDK's README and SPEC).
