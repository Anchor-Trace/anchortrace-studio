# AnchorTrace Studio: specification (v1)

## 1. User
A support or operations person (or a developer) investigating one anchor transaction who already has, or can obtain, the SEP-24 record and the Horizon transaction and operations JSON. They want to see why the record and the chain agree or disagree, share a case without leaking customer details, and not trust a web service with the data.

## 2. Scope
In scope: choose a synthetic example, paste or upload a SEP-24 record and Horizon evidence, set the explicit verdict options (fee policy, expected asset, anchor account, tolerance, network), run the SDK in the page, read the timeline, findings, expected leg and operations, open a saved report, download redacted or full reports.
Non-goals: network access of any kind (no live Horizon reads, no telemetry), accounts, persistence (nothing is stored: no localStorage, cookies or IndexedDB), editing verdicts, signing or payments, a reconciliation engine of its own, rendering of anything the SDK did not produce.

## 3. Data flow and honesty rules
1. Input text (typed, pasted, uploaded) is parsed in the browser (`src/analyze.ts`) and handed to `reconcileSupplied` from the bundled SDK. A raw Horizon pair or an array of pairs is wrapped into an evidence file first; nothing else is transformed.
2. Every displayed verdict, finding, candidate, check, timeline entry and expected-leg value is read from the SDK's report object. There is no hand-written output in the app. Examples come from the SDK's generated `examples.v1.json`.
3. Selecting an example re-runs the SDK in the browser and compares the result with the report the SDK generated at build time; the page states whether they are identical and warns loudly if not.
4. Labels: examples are marked "Synthetic example" with the case's evidence note; the persistent banner states that confirmation on chain is not a bank payout; every withdrawal result carries the SDK's `external_payout_not_verified` finding and the limitations list.
5. A saved report is shown as saved ("nothing was recomputed") and must pass the SDK's report schema; a different `reportVersion` is refused with a version-specific message.
6. The production page carries `Content-Security-Policy: default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'none'; base-uri 'none'; form-action 'none'` (meta tag injected at build by `vite.config.ts`).

## 4. Compatibility with the SDK
`pairing.json` records the SDK version, git tag and commit, the SHA-256 of the vendored tarball, the schema versions (report, evidence, case) and the SHA-256 of the vendored schema files. Three layers check it:
- `pnpm run check:pairing` (part of `build` and CI): tarball hash, installed SDK version, installed schema files equal to the vendored ones, installed examples bundle version.
- At runtime (`src/compat.ts`): the bundled SDK's `TOOL_VERSION`, `REPORT_VERSION`, `EVIDENCE_VERSION`, `CASE_VERSION` and the examples bundle's versions must equal the pairing. Otherwise the page shows a blocking error and renders no results.
- When opening a saved report: version check, then schema validation.
Upgrading the SDK means: build and tag the SDK, `pnpm pack`, replace the tarball in `vendor/`, copy its `schema/`, update `pairing.json`, run the tests.

## 5. Interface states
| State | Behaviour |
|---|---|
| idle | Empty-state panel with the one-sentence explanation, the not-a-bank-payout note and a legend of the six outcomes. |
| loading | `role=status` panel, `aria-busy` on the results region. Examples run after one yielded tick so the state can paint; user input is read asynchronously (file reads, SHA-256). |
| done | Source banner, overall outcome and counts, one card per transaction, export panel, provenance, limitations. Focus moves to the results region. |
| error | `role=alert` panel with the message and up to 12 issues; says it is an input problem, not a verdict; the form keeps its contents. |
| unsupported / insufficient evidence / ambiguous | Ordinary results with their own badge and findings; they are never styled as success. |

Limits: inputs over 5 MB are refused.

## 6. Interface
Layout: controls on the left (examples, own data), results on the right; one column under 860 px. Outcome badges use a text label and a glyph, never colour alone. Conflicting operations carry a "Conflicts with the record" heading, a red left border and the differing field rows in bold; a finding's button highlights the operations it references (`aria-pressed`, `aria-current` on the highlighted operations). Dark and light schemes follow the system.
Keyboard: a skip link is the first tab stop; every control is a native button, input, select or details; visible focus outline; Enter and Space select examples; focus lands on the results after a run or an error.
Export: redaction categories (accounts, issuers, memos, emails, hashes; default accounts, memos, emails) apply the SDK's `redactReport`; downloads are generated locally (Blob). The full report download is labelled as not redacted. Free text in a record's `message` is only scanned for addresses, emails and known memos.

## 7. Acceptance (automated)
- Vitest (`test/`): state machine; pairing and compatibility including the failure modes of `check-pairing`; input handling; every example reproduces the SDK-generated report.
- Playwright against the production build (`e2e/`), in a real Chrome: all 18 examples show the intended outcome and the recompute-identical statement; wrong issuer, multi-operation, unsupported and timeline displays; paste/upload flows, options, empty/invalid/oversized/float/evidence errors; saved-report version checks; redacted export contents; the CSP blocks fetches and every request stays on the origin; keyboard operation; axe-core with no violations in light and dark; no horizontal scrolling at 375, 768 and 1440 px.
