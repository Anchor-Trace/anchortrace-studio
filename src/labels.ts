import type { Outcome } from "@anas.abubakar/anchortrace-sdk";

export const OUTCOME_LABEL: Record<Outcome, string> = {
  matched: "Matched",
  pending: "Pending",
  insufficient_evidence: "Insufficient evidence",
  unsupported: "Unsupported",
  ambiguous: "Ambiguous",
  discrepant: "Discrepant",
};

export const OUTCOME_MEANING: Record<Outcome, string> = {
  matched: "The Stellar leg agrees with a completed or refunded record. Nothing is claimed about off-chain legs such as a bank payout.",
  pending: "The record is in progress and the evidence is consistent with that, or no on-chain transfer is required yet.",
  insufficient_evidence: "Evidence is missing, truncated, from the wrong network or could not be read. Never a mismatch and never a pass.",
  unsupported: "A payment form or status outside version one (path payment, claimable balance, Soroban transfer, unknown status). Never counted as success.",
  ambiguous: "More than one explanation fits, such as two payment operations to the anchor in one transaction, or a status history that cannot be ordered.",
  discrepant: "The evidence contradicts the record, or the record contradicts itself.",
};

export const OUTCOME_ORDER: Outcome[] = ["matched", "pending", "insufficient_evidence", "unsupported", "ambiguous", "discrepant"];

export const FEE_POLICY_LABEL = {
  anchor_deducted: "anchor_deducted: the fee is taken off the payout (SEP-24 formula)",
  customer_paid_on_top: "customer_paid_on_top: the fee is charged in addition to amount_in",
  no_fee: "no_fee: any non-zero fee is a discrepancy",
} as const;
