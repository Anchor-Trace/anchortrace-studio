# Limitations

- Version one covers SEP-24 and classic direct payments only; path payments, claimable balances and Soroban transfers are reported as `unsupported`.
- The studio cannot fetch evidence. Use Horizon (or the SDK CLI's `--horizon`) to get the JSON.
- Example SEP-24 records are synthetic. No anchor, wallet or support team has used or validated this tool.
- Verification used Chromium-based engines only (Chromium 153 and Chrome 154, Linux). Other browsers, screen readers and real phones were not tested; axe-core finds only a subset of accessibility problems.
- The loading state is exercised in the state-machine unit test; in the browser the SDK call is fast enough that it is rarely visible.
- Large inputs are processed on the main thread (5 MB cap).
- Live on Vercel; not published to npm (it is an app).
