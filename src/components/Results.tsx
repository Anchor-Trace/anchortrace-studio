import { useEffect, useRef } from "react";
import type { Report } from "@anasabubakar/anchortrace-sdk";
import { bundle } from "../examples.ts";
import { OUTCOME_LABEL, OUTCOME_MEANING, OUTCOME_ORDER } from "../labels.ts";
import type { Source, State } from "../state.ts";
import { ExportPanel } from "./ExportPanel.tsx";
import { OutcomeBadge } from "./OutcomeBadge.tsx";
import { TransactionCard } from "./TransactionCard.tsx";

function SourceBanner({ source }: { source: Source }) {
  if (source.kind === "example") {
    const entry = bundle.cases.find((c) => c.id === source.id);
    return (
      <div className="source source-example" data-testid="source-banner">
        <p>
          <span className="tag tag-synthetic">Synthetic example</span> <strong>{entry?.case.title}</strong>
        </p>
        <p>{entry?.case.description}</p>
        <p className="muted">{entry?.case.evidenceNote}</p>
        <p role="status" data-testid="recompute-status" className={source.reproduces ? "ok-text" : "error-text"}>
          {source.reproduces ? "Recomputed in this browser by the bundled SDK: identical to the report the SDK generated." : "The report recomputed in this browser DIFFERS from the report the SDK generated. Do not trust this view."}
        </p>
      </div>
    );
  }
  if (source.kind === "saved_report") return <div className="source" data-testid="source-banner"><p><span className="tag">Saved report</span> {source.label}. Shown as saved; nothing was recomputed.</p></div>;
  return <div className="source" data-testid="source-banner"><p><span className="tag">Your input</span> Reconciled in this browser by the bundled SDK. Nothing was uploaded.</p></div>;
}

function Summary({ report }: { report: Report }) {
  return (
    <div className="overall" data-testid="overall">
      <h2>Result</h2>
      {report.overall ? <OutcomeBadge outcome={report.overall} /> : <span className="muted">no transactions</span>}
      <ul className="counts" aria-label="Outcome counts">
        {OUTCOME_ORDER.filter((o) => report.summary[o] > 0).map((o) => (
          <li key={o}>{report.summary[o]} {OUTCOME_LABEL[o].toLowerCase()}</li>
        ))}
      </ul>
      <p className="muted">
        Fee policy: <strong>{report.options.feePolicy}</strong> ({report.options.feePolicySource === "default" ? "default" : "chosen"}). Report generated {report.generatedAt}.
      </p>
    </div>
  );
}

export function Results({ state, onRetry }: { state: State; onRetry?: () => void }) {
  const headingRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (state.phase === "done" || state.phase === "error") headingRef.current?.focus();
  }, [state]);

  return (
    <section id="results" className="results" aria-label="Results" aria-live="polite" aria-busy={state.phase === "loading"} data-state={state.phase}>
      <div tabIndex={-1} ref={headingRef} className="focus-target">
        {state.phase === "idle" ? (
          <div className="empty" data-testid="empty-state">
            <h2>Nothing loaded yet</h2>
            <p>Choose a synthetic example on the left, or paste your own SEP-24 record and Horizon evidence, then press Reconcile.</p>
            <p><strong>Confirmation on chain is not a bank payout.</strong> A matching Stellar payment shows only the wallet-side transfer of a withdrawal.</p>
            <details>
              <summary>What do the six outcomes mean?</summary>
              <dl className="kv">
                {OUTCOME_ORDER.map((o) => (
                  <div key={o} className="kv-row">
                    <dt><OutcomeBadge outcome={o} /></dt>
                    <dd>{OUTCOME_MEANING[o]}</dd>
                  </div>
                ))}
              </dl>
            </details>
          </div>
        ) : null}
        {state.phase === "loading" ? (
          <div className="loading" role="status" data-testid="loading-state">
            <span className="spinner" aria-hidden="true" />
            <p>{state.what}</p>
          </div>
        ) : null}
        {state.phase === "error" ? (
          <div className="error-box" role="alert" data-testid="error-state">
            <h2>Could not reconcile</h2>
            <p>{state.message}</p>
            {state.issues.length > 0 ? (
              <ul>
                {state.issues.slice(0, 12).map((i) => (
                  <li key={i} className="mono">{i}</li>
                ))}
                {state.issues.length > 12 ? <li>and {state.issues.length - 12} more</li> : null}
              </ul>
            ) : null}
            <p className="muted">This is an input problem, not a verdict about the transaction. Nothing was sent anywhere.</p>
            {onRetry ? <button type="button" onClick={onRetry}>Back to the examples</button> : null}
          </div>
        ) : null}
        {state.phase === "done" ? (
          <>
            <SourceBanner source={state.source} />
            <Summary report={state.report} />
            {state.report.transactions.map((t) => (
              <TransactionCard key={t.id} tx={t} />
            ))}
            <ExportPanel report={state.report} baseName={state.source.kind === "example" ? state.source.id : "anchortrace"} />
            <details className="panel">
              <summary>Inputs and provenance ({state.report.inputs.length})</summary>
              <ul className="prov">
                {state.report.inputs.map((p) => (
                  <li key={p.id}>
                    <span className="mono">{p.id}</span> {p.role.replace("_", " ")}, {p.kind === "horizon" ? "live Horizon" : "supplied file"}: {p.label}
                    {p.sha256 ? <span className="muted"> (sha256 {p.sha256.slice(0, 12)}...)</span> : null}
                  </li>
                ))}
              </ul>
            </details>
            <details className="panel">
              <summary>Limitations of this tool</summary>
              <ul>
                {state.report.limitations.map((l) => (
                  <li key={l}>{l}</li>
                ))}
              </ul>
            </details>
          </>
        ) : null}
      </div>
    </section>
  );
}
