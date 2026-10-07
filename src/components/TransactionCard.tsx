import { useId, useMemo, useState } from "react";
import type { TransactionReport } from "@anasabubakar/anchortrace-sdk";
import { OutcomeBadge } from "./OutcomeBadge.tsx";
import { Operations, opKey } from "./Operations.tsx";

export function TransactionCard({ tx }: { tx: TransactionReport }) {
  const headingId = useId();
  const [selected, setSelected] = useState<number | null>(null);

  const highlighted = useMemo(() => {
    const s = new Set<string>();
    for (const c of tx.matching.candidates) if (c.role === "conflicting") s.add(opKey(c.transactionHash, c.operationId));
    if (selected !== null) for (const r of tx.findings[selected]?.refs ?? []) s.add(opKey(r.transactionHash, r.operationId));
    return s;
  }, [tx, selected]);

  const expected = tx.expected;
  return (
    <article className="card" aria-labelledby={headingId} data-outcome={tx.outcome} data-tx-id={tx.id}>
      <header className="card-head">
        <h3 id={headingId}>
          Transaction <span className="mono">{tx.id}</span> <span className="muted">({tx.kind})</span>
        </h3>
        <OutcomeBadge outcome={tx.outcome} />
      </header>
      <p className="summary">{tx.summary}</p>

      <section aria-label="Findings">
        <h4>Findings</h4>
        <ul className="findings">
          {tx.findings.map((f, i) => {
            const hasRefs = (f.refs?.length ?? 0) > 0;
            return (
              <li key={`${f.code}-${i}`} className={`finding sev-${f.severity}`} data-code={f.code}>
                <div className="finding-head">
                  <span className="tag">{f.severity}</span>
                  <span className="tag">{f.effect ?? "note"}</span>
                  <code>{f.code}</code>
                </div>
                <p>{f.message}</p>
                {hasRefs ? (
                  <button type="button" className="link-button" aria-pressed={selected === i} onClick={() => setSelected(selected === i ? null : i)}>
                    {selected === i ? "Clear highlight" : `Highlight the ${f.refs!.length} referenced operation${f.refs!.length === 1 ? "" : "s"}`}
                  </button>
                ) : null}
              </li>
            );
          })}
        </ul>
      </section>

      <section aria-label="Operations considered">
        <h4>Evidence considered {tx.matching.linkedBy === "stellar_transaction_id" ? <span className="muted">(linked by stellar_transaction_id)</span> : tx.matching.linkedBy === "search" ? <span className="muted">(linked by search, not by id)</span> : null}</h4>
        <Operations candidates={tx.matching.candidates} highlighted={highlighted} />
        {tx.matching.refunds.length > 0 ? (
          <ul className="refunds" aria-label="Refund payments">
            {tx.matching.refunds.map((r) => (
              <li key={r.id}>
                Refund <span className="mono">{r.id}</span> ({r.idType}) {r.amount ?? ""}: <strong>{r.result.replaceAll("_", " ")}</strong>
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      <div className="two-col">
        <section aria-label="Expected on-chain leg">
          <h4>What the record implies on chain</h4>
          {expected === null ? (
            <p className="muted">Nothing could be expected: the record lacks fields needed to describe the Stellar leg.</p>
          ) : (
            <dl className="kv">
              <dt>Direction</dt>
              <dd>{expected.direction === "wallet_to_anchor" ? "wallet to anchor" : "anchor to wallet"}</dd>
              <dt>Destination</dt>
              <dd className="mono">{expected.destination}</dd>
              <dt>Asset</dt>
              <dd className="mono">{expected.asset}</dd>
              <dt>Amount</dt>
              <dd className="mono">{expected.amount}</dd>
              <dt>Memo</dt>
              <dd className="mono">{expected.memo === null ? "none declared" : `${expected.memo} (${expected.memoType ?? "type not declared"})`}</dd>
              <dt>Sender</dt>
              <dd className="mono">{expected.source ?? "not checked"}</dd>
              <dt>Basis</dt>
              <dd>{Object.entries(expected.basis).map(([k, v]) => `${k}: ${v}`).join("; ")}</dd>
            </dl>
          )}
        </section>
        <section aria-label="Status timeline">
          <h4>Status timeline</h4>
          <p className="muted">
            Current status <strong>{tx.currentStatus.value}</strong>, chosen by {tx.currentStatus.electedBy.replaceAll("_", " ")}.
          </p>
          <ol className="timeline">
            {tx.timeline.map((e) => (
              <li key={e.index} className={e.flags.includes("current") ? "current" : undefined}>
                <span className="mono">{e.time ?? "no usable time"}</span> <strong>{e.status}</strong>
                {e.occurrences > 1 ? <span className="tag">seen {e.occurrences} times</span> : null}
                {e.flags.filter((f) => f !== "current").map((f) => (
                  <span key={f} className="tag tag-warn">{f.replaceAll("_", " ")}</span>
                ))}
                {e.flags.includes("current") ? <span className="tag">current</span> : null}
              </li>
            ))}
          </ol>
        </section>
      </div>
    </article>
  );
}
