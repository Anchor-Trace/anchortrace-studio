import type { Candidate } from "@anasabubakar/anchortrace-sdk";

const ROLE_TEXT: Record<Candidate["role"], string> = {
  matched: "Matches the record",
  conflicting: "Conflicts with the record",
  unsupported: "Unsupported form",
  unrelated: "Unrelated payment in the same transaction",
};

export function opKey(txHash: string, opId: string | null): string {
  return `${txHash}:${opId ?? "-"}`;
}

export function Operations({ candidates, highlighted }: { candidates: Candidate[]; highlighted: Set<string> }) {
  if (candidates.length === 0) {
    return <p className="muted">No operation from the supplied evidence was a candidate for this transaction.</p>;
  }
  return (
    <ul className="ops" aria-label="Operations considered">
      {candidates.map((c) => {
        const key = opKey(c.transactionHash, c.operationId);
        const hl = highlighted.has(key) || highlighted.has(opKey(c.transactionHash, null));
        return (
          <li key={key} className={`op op-${c.role}${hl ? " op-highlight" : ""}`} data-op-id={c.operationId} data-role={c.role} data-highlighted={hl ? "true" : "false"} aria-current={hl ? "true" : undefined}>
            <div className="op-head">
              <strong>{ROLE_TEXT[c.role]}</strong>
              {c.purpose === "refund" ? <span className="tag">refund payment</span> : null}
              {!c.transactionSuccessful ? <span className="tag tag-danger">transaction failed on chain</span> : null}
              <span className="muted">{c.type}</span>
            </div>
            <dl className="kv">
              <dt>Transaction</dt>
              <dd className="mono">{c.transactionHash}</dd>
              <dt>Operation</dt>
              <dd className="mono">{c.operationId}</dd>
              <dt>From</dt>
              <dd className="mono">{c.from ?? "unknown"}</dd>
              <dt>To</dt>
              <dd className="mono">{c.to ?? "unknown"}</dd>
              <dt>Paid</dt>
              <dd className="mono">{c.amount ?? "?"} {c.asset ?? "?"}</dd>
              <dt>Memo</dt>
              <dd className="mono">{c.memo === null ? "none" : `${c.memo} (${c.memoType ?? "?"})`}</dd>
            </dl>
            {c.checks.length > 0 ? (
              <table className="checks">
                <caption className="sr-only">Field-by-field comparison with the record</caption>
                <thead>
                  <tr>
                    <th scope="col">Field</th>
                    <th scope="col">Expected</th>
                    <th scope="col">Observed</th>
                    <th scope="col">Result</th>
                  </tr>
                </thead>
                <tbody>
                  {c.checks.map((k) => (
                    <tr key={k.field} className={`check-${k.result}`}>
                      <th scope="row">{k.field}</th>
                      <td className="mono">{k.expected ?? "-"}</td>
                      <td className="mono">{k.observed ?? "-"}</td>
                      <td>{k.result === "equal" ? "equal" : k.result === "different" ? "DIFFERENT" : "not checked"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
