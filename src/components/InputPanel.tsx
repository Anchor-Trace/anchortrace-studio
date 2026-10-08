import { useId, useRef, useState, type ChangeEvent } from "react";
import { FEE_POLICIES, type FeePolicy } from "@anas.abubakar/anchortrace-sdk";
import { MAX_INPUT_BYTES, type UserInput } from "../analyze.ts";
import { FEE_POLICY_LABEL } from "../labels.ts";

export const emptyInput: UserInput = {
  record: { label: "pasted SEP-24 record", text: "" },
  evidence: [],
  options: { feePolicy: "", asset: "", anchorAccount: "", toleranceBps: "", network: "" },
};

interface Props {
  value: UserInput;
  onChange: (v: UserInput) => void;
  onRun: () => void;
  onOpenReport: (label: string, text: string) => void;
  busy: boolean;
}

async function readFileText(f: File): Promise<string> {
  if (f.size > MAX_INPUT_BYTES) throw new Error(`${f.name} is larger than ${MAX_INPUT_BYTES / 1_000_000} MB`);
  return await f.text();
}

export function InputPanel({ value, onChange, onRun, onOpenReport, busy }: Props) {
  const id = useId();
  const [fileError, setFileError] = useState<string | null>(null);
  const [pasted, setPasted] = useState("");
  const evidenceInput = useRef<HTMLInputElement>(null);

  const setOption = <K extends keyof UserInput["options"]>(k: K, v: UserInput["options"][K]) => onChange({ ...value, options: { ...value.options, [k]: v } });

  const onRecordFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      setFileError(null);
      onChange({ ...value, record: { label: f.name, text: await readFileText(f) } });
    } catch (err) {
      setFileError(err instanceof Error ? err.message : String(err));
    }
    e.target.value = "";
  };
  const onEvidenceFiles = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = [...(e.target.files ?? [])];
    try {
      setFileError(null);
      const added = [];
      for (const f of files) added.push({ label: f.name, text: await readFileText(f) });
      onChange({ ...value, evidence: [...value.evidence, ...added] });
    } catch (err) {
      setFileError(err instanceof Error ? err.message : String(err));
    }
    e.target.value = "";
  };
  const onReportFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      setFileError(null);
      onOpenReport(f.name, await readFileText(f));
    } catch (err) {
      setFileError(err instanceof Error ? err.message : String(err));
    }
    e.target.value = "";
  };

  return (
    <form
      className="panel"
      aria-labelledby={`${id}-h`}
      onSubmit={(e) => {
        e.preventDefault();
        onRun();
      }}
    >
      <h2 id={`${id}-h`}>Your own data</h2>
      <p className="muted">Paste or upload JSON. It is parsed and reconciled in this page by the AnchorTrace SDK; nothing is uploaded.</p>

      <div className="field">
        <label htmlFor={`${id}-rec`}>SEP-24 transaction record(s)</label>
        <p id={`${id}-rec-help`} className="hint">A GET /transaction or /transactions response, callback payloads as an array, or one record. Amounts must be strings.</p>
        <textarea id={`${id}-rec`} aria-describedby={`${id}-rec-help`} rows={8} spellCheck={false} value={value.record.text} onChange={(e) => onChange({ ...value, record: { label: value.record.label, text: e.target.value } })} />
        <label className="file">
          <span>Or choose a record file</span>
          <input type="file" accept=".json,application/json" onChange={onRecordFile} />
        </label>
      </div>

      <div className="field">
        <label htmlFor={`${id}-ev`}>Evidence: Horizon transaction and operations</label>
        <p id={`${id}-ev-help`} className="hint">
          Paste an AnchorTrace evidence file, or a raw pair {"{"}"transaction": ..., "operations": ...{"}"} made from Horizon&apos;s <code>/transactions/&lt;hash&gt;</code> and <code>/transactions/&lt;hash&gt;/operations</code>.
        </p>
        <textarea id={`${id}-ev`} aria-describedby={`${id}-ev-help`} rows={6} spellCheck={false} value={pasted} onChange={(e) => setPasted(e.target.value)} />
        <div className="button-row">
          <button
            type="button"
            disabled={pasted.trim() === ""}
            onClick={() => {
              onChange({ ...value, evidence: [...value.evidence, { label: `pasted evidence ${value.evidence.length + 1}`, text: pasted }] });
              setPasted("");
            }}
          >
            Add pasted evidence
          </button>
          <label className="file inline">
            <span>Or add evidence files</span>
            <input ref={evidenceInput} type="file" multiple accept=".json,application/json" onChange={onEvidenceFiles} />
          </label>
        </div>
        {value.evidence.length === 0 ? (
          <p className="muted" data-testid="no-evidence">No evidence added. Without evidence the result can only be pending or insufficient evidence.</p>
        ) : (
          <ul className="chips" aria-label="Evidence added">
            {value.evidence.map((ev, i) => (
              <li key={`${ev.label}-${i}`}>
                {ev.label}
                <button type="button" className="link-button" aria-label={`Remove ${ev.label}`} onClick={() => onChange({ ...value, evidence: value.evidence.filter((_, j) => j !== i) })}>
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <fieldset>
        <legend>Options that change the verdict</legend>
        <div className="field">
          <label htmlFor={`${id}-fee`}>Fee policy</label>
          <select id={`${id}-fee`} value={value.options.feePolicy} onChange={(e) => setOption("feePolicy", e.target.value as FeePolicy | "")}>
            <option value="">anchor_deducted (default)</option>
            {FEE_POLICIES.map((p) => (
              <option key={p} value={p}>{FEE_POLICY_LABEL[p]}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor={`${id}-asset`}>Expected asset when the record omits it</label>
          <input id={`${id}-asset`} type="text" placeholder="native or CODE:ISSUER" value={value.options.asset} onChange={(e) => setOption("asset", e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor={`${id}-anchor`}>Anchor account (deposits)</label>
          <input id={`${id}-anchor`} type="text" placeholder="G..." value={value.options.anchorAccount} onChange={(e) => setOption("anchorAccount", e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor={`${id}-tol`}>Amount tolerance (basis points)</label>
          <input id={`${id}-tol`} type="text" inputMode="numeric" placeholder="0 (exact)" value={value.options.toleranceBps} onChange={(e) => setOption("toleranceBps", e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor={`${id}-net`}>Expected network of the evidence</label>
          <select id={`${id}-net`} value={value.options.network} onChange={(e) => setOption("network", e.target.value as "" | "testnet" | "public")}>
            <option value="">not checked</option>
            <option value="testnet">testnet</option>
            <option value="public">public</option>
          </select>
        </div>
      </fieldset>

      <div className="button-row">
        <button type="submit" className="primary" disabled={busy}>Reconcile</button>
        <button type="button" onClick={() => onChange(emptyInput)} disabled={busy}>Clear</button>
      </div>
      {fileError ? <p role="alert" className="error-text">{fileError}</p> : null}

      <hr />
      <label className="file">
        <span>Open a saved report (JSON from the CLI or an export)</span>
        <input type="file" accept=".json,application/json" onChange={onReportFile} />
      </label>
    </form>
  );
}
