import { InputError, reconcileSupplied, type FeePolicy, type Report, type ReconcileOptions, type SuppliedFile } from "@anasabubakar/anchortrace-sdk";
import { bundle } from "./examples.ts";

export const MAX_INPUT_BYTES = 5_000_000;

export interface UserInput {
  record: { label: string; text: string };
  evidence: Array<{ label: string; text: string }>;
  options: { feePolicy: FeePolicy | ""; asset: string; anchorAccount: string; toleranceBps: string; network: "" | "testnet" | "public" };
}

export interface AnalyzeFailure {
  message: string;
  issues: string[];
}

export class AnalyzeError extends Error {
  readonly issues: string[];
  constructor(message: string, issues: string[] = []) {
    super(message);
    this.name = "AnalyzeError";
    this.issues = issues;
  }
}

async function sha256Hex(text: string): Promise<string | null> {
  try {
    const bytes = new TextEncoder().encode(text);
    const digest = await crypto.subtle.digest("SHA-256", bytes);
    return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
  } catch {
    return null; // crypto.subtle is unavailable on insecure origins; provenance then records no hash
  }
}

async function parseJson(label: string, text: string): Promise<SuppliedFile> {
  if (text.trim() === "") throw new AnalyzeError(`${label} is empty.`);
  if (text.length > MAX_INPUT_BYTES) throw new AnalyzeError(`${label} is larger than ${MAX_INPUT_BYTES / 1_000_000} MB; the studio refuses it.`);
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch (e) {
    throw new AnalyzeError(`${label} is not valid JSON.`, [e instanceof Error ? e.message : String(e)]);
  }
  return { label, value, sha256: await sha256Hex(text) };
}

/** Accept either an AnchorTrace evidence file or a raw Horizon pair ({transaction, operations}) and wrap the latter. */
function asEvidenceFile(f: SuppliedFile): SuppliedFile {
  const v = f.value;
  if (v !== null && typeof v === "object" && !Array.isArray(v) && "evidenceVersion" in v) return f;
  if (v !== null && typeof v === "object" && !Array.isArray(v) && "transaction" in v && "operations" in v) return { ...f, value: { evidenceVersion: "1", items: [v] } };
  if (Array.isArray(v) && v.every((x) => x !== null && typeof x === "object" && "transaction" in x && "operations" in x)) return { ...f, value: { evidenceVersion: "1", items: v } };
  return f;
}

export function optionsFrom(o: UserInput["options"]): ReconcileOptions {
  const out: ReconcileOptions = {};
  if (o.feePolicy !== "") out.feePolicy = o.feePolicy;
  if (o.asset.trim() !== "") out.assetOverride = o.asset.trim();
  if (o.anchorAccount.trim() !== "") out.anchorAccount = o.anchorAccount.trim();
  if (o.toleranceBps.trim() !== "") {
    const n = Number(o.toleranceBps);
    if (!Number.isInteger(n) || n < 0 || n > 10_000) throw new AnalyzeError("Tolerance must be a whole number of basis points between 0 and 10000.");
    out.amountToleranceBps = n;
  }
  if (o.network !== "") out.expectedNetwork = o.network;
  return out;
}

/** Run the SDK on text the user supplied. Everything shown afterwards is the SDK's report; nothing is computed here. */
export async function analyzeUserInput(input: UserInput): Promise<Report> {
  const options = optionsFrom(input.options);
  const record = await parseJson(input.record.label, input.record.text);
  const evidence: SuppliedFile[] = [];
  for (const e of input.evidence) evidence.push(asEvidenceFile(await parseJson(e.label, e.text)));
  try {
    return reconcileSupplied({ records: [record], evidence, options });
  } catch (e) {
    if (e instanceof InputError) throw new AnalyzeError(e.message, e.issues);
    throw e;
  }
}

export interface ExampleResult {
  report: Report;
  /** True when the browser's recomputation equals the report the SDK generated and shipped. */
  reproducesShippedReport: boolean;
}

/** Run the SDK in this browser on a shipped case and compare with the report the SDK generated at build time. */
export function analyzeExample(id: string): ExampleResult {
  const entry = bundle.cases.find((c) => c.id === id);
  if (!entry) throw new AnalyzeError(`Unknown example "${id}".`);
  const report = reconcileSupplied({ records: [{ label: `${entry.id}.case.json`, value: entry.case }], now: new Date(bundle.generatedAt) });
  return { report, reproducesShippedReport: JSON.stringify(report) === JSON.stringify(entry.report) };
}
