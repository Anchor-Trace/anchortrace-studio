import { useId, useMemo, useState } from "react";
import { DEFAULT_REDACTION, REDACT_CATEGORIES, redactReport, renderMarkdown, renderText, type RedactCategory, type Report } from "@anasabubakar/anchortrace-sdk";
import { downloadText } from "../download.ts";

const CATEGORY_HELP: Record<RedactCategory, string> = {
  accounts: "Account addresses (G..., M...), except asset issuers",
  issuers: "Asset issuer addresses (they identify the asset; off by default)",
  memos: "Memo values and external refund references",
  emails: "Email addresses in free text",
  hashes: "Transaction hashes (public identifiers; off by default)",
};

export function ExportPanel({ report, baseName }: { report: Report; baseName: string }) {
  const groupId = useId();
  const [cats, setCats] = useState<RedactCategory[]>([...DEFAULT_REDACTION]);
  const redacted = useMemo(() => (cats.length > 0 ? redactReport(report, cats) : null), [report, cats]);
  const toggle = (c: RedactCategory) => setCats((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));

  return (
    <section className="panel" aria-labelledby={`${groupId}-h`} data-testid="export-panel">
      <h3 id={`${groupId}-h`}>Export</h3>
      <p className="muted">Exports are built in your browser from the SDK report. Redaction replaces values with stable aliases (account-1, memo-1, ...), numbered over the sorted distinct values.</p>
      <fieldset>
        <legend>Redact before sharing</legend>
        {REDACT_CATEGORIES.map((c) => (
          <label key={c} className="check">
            <input type="checkbox" checked={cats.includes(c)} onChange={() => toggle(c)} />
            <span>
              <strong>{c}</strong>: {CATEGORY_HELP[c]}
            </span>
          </label>
        ))}
      </fieldset>
      <div className="button-row">
        <button type="button" className="primary" disabled={redacted === null} onClick={() => redacted && downloadText(`${baseName}.redacted.report.json`, JSON.stringify(redacted.report, null, 2) + "\n", "application/json")}>
          Download redacted report (JSON)
        </button>
        <button type="button" disabled={redacted === null} onClick={() => redacted && downloadText(`${baseName}.redacted.report.md`, renderMarkdown(redacted.report), "text/markdown")}>
          Download redacted report (Markdown)
        </button>
        <button type="button" onClick={() => downloadText(`${baseName}.report.json`, JSON.stringify(report, null, 2) + "\n", "application/json")}>
          Download full report (JSON, not redacted)
        </button>
      </div>
      {cats.length === 0 ? <p role="status" className="muted">Nothing is selected for redaction, so only the full report can be downloaded.</p> : null}
      <details>
        <summary>Preview of the {cats.length > 0 ? "redacted" : "full"} text report</summary>
        <pre className="pre" data-testid="export-preview">{renderText(redacted ? redacted.report : report)}</pre>
      </details>
    </section>
  );
}
