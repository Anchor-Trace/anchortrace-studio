# Privacy and what is enforced

- The production page ships `Content-Security-Policy: ... connect-src 'none' ...`, so the browser itself blocks any connection from the page; a Playwright test asserts that fetches to Horizon and to the page's own origin are blocked and that every request stays on the origin.
- No storage: no cookies, localStorage, IndexedDB or analytics.
- Downloads are generated locally from the report.
- Redaction is the SDK's: values become stable aliases over sorted distinct values; secret keys are always removed; free text in a record's `message` is only scanned for addresses, emails and known memos. Review exports before sharing.
