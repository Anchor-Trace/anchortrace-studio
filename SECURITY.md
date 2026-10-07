# Security

AnchorTrace Studio runs entirely in the browser, stores nothing and, in production builds, is blocked by its Content-Security-Policy from opening network connections. It holds no keys and signs nothing.

Report a vulnerability (for example a way to make the page send data anywhere, to inject script through a pasted record or evidence field, to leak an unredacted address or memo into a redacted export, or to show a verdict that differs from the SDK's report) through GitHub's private vulnerability reporting for this repository (Security tab, "Report a vulnerability"). Please do not open a public issue for it.

Out of scope: the verdict logic itself (report it against anchortrace-sdk) and the testnet accounts that appear in the synthetic examples.
