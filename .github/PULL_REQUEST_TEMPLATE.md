## What and why

## How it was verified
- [ ] `pnpm run typecheck`, `pnpm test` and `pnpm test:e2e` pass locally
- [ ] No reconciliation logic, hard-coded verdicts, network access or storage were added
- [ ] New interactions are keyboard operable and covered by an e2e assertion; axe stays clean
- [ ] If the SDK was updated: tarball, vendored schemas and `pairing.json` were updated together and `pnpm run check:pairing` passes
