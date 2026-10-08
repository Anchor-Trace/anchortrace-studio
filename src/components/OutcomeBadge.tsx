import type { Outcome } from "@anas.abubakar/anchortrace-sdk";
import { OUTCOME_LABEL } from "../labels.ts";

/** Colour is never the only signal: every badge carries the outcome name and a distinct glyph. */
const GLYPH: Record<Outcome, string> = { matched: "=", pending: "...", insufficient_evidence: "?", unsupported: "x", ambiguous: "||", discrepant: "!=" };

export function OutcomeBadge({ outcome }: { outcome: Outcome }) {
  return (
    <span className={`badge badge-${outcome}`} data-outcome={outcome}>
      <span className="badge-glyph" aria-hidden="true">{GLYPH[outcome]}</span>
      <span>{OUTCOME_LABEL[outcome]}</span>
    </span>
  );
}
