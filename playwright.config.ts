import { defineConfig } from "@playwright/test";

// Real-browser tests against the PRODUCTION build served by `vite preview` (so the CSP meta tag is in force).
export default defineConfig({
  testDir: "e2e",
  timeout: 30_000,
  fullyParallel: true,
  workers: 2,
  reporter: [["list"]],
  use: { baseURL: "http://127.0.0.1:4173", trace: "off", acceptDownloads: true },
  // CI downloads Playwright's own Chromium (`playwright install chromium`). Locally, set PW_CHANNEL=chrome to use an installed Google Chrome instead.
  projects: [{ name: "chromium", use: { browserName: "chromium", viewport: { width: 1280, height: 900 }, ...(process.env.PW_CHANNEL ? { channel: process.env.PW_CHANNEL } : {}) } }],
  webServer: { command: "pnpm exec vite preview --host 127.0.0.1 --port 4173 --strictPort", url: "http://127.0.0.1:4173", reuseExistingServer: !process.env.CI, timeout: 30_000 },
});
