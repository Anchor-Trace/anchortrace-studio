import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";

// The production page may not open any network connection: connect-src 'none' is enforced by the browser, not just promised.
const csp: Plugin = {
  name: "anchortrace-csp",
  apply: "build",
  transformIndexHtml(html) {
    const policy = "default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'none'; base-uri 'none'; form-action 'none'";
    return html.replace("<!--csp-->", `<meta http-equiv="Content-Security-Policy" content="${policy}" />`);
  },
};

export default defineConfig({
  plugins: [react(), csp],
  build: { target: "es2023", sourcemap: false },
});
