# Run

Not hosted anywhere. Node 22 or newer, pnpm 11:

```bash
git clone <this repo> && cd anchortrace-studio
pnpm install --frozen-lockfile
pnpm dev                      # development server
pnpm build && pnpm preview    # production build with the no-network CSP, http://127.0.0.1:4173
```

Tests:

```bash
pnpm test                     # Vitest: state, SDK pairing, input handling, examples reproduce the SDK reports
pnpm test:e2e                 # build, then Playwright in a real Chromium against the production build
PW_CHANNEL=chrome pnpm test:e2e   # same, using an installed Google Chrome instead of Playwright's Chromium
```

The first `pnpm test:e2e` needs a browser: `pnpm exec playwright install chromium`, or set `PW_CHANNEL=chrome`.
