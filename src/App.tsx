import { useMemo, useReducer, useState } from "react";
import { TOOL_VERSION, REPORT_VERSION } from "@anasabubakar/anchortrace-sdk";
import { analyzeExample, analyzeUserInput, AnalyzeError, type UserInput } from "./analyze.ts";
import { checkCompatibility, openSavedReport } from "./compat.ts";
import { ExampleList } from "./components/ExampleList.tsx";
import { InputPanel, emptyInput } from "./components/InputPanel.tsx";
import { Results } from "./components/Results.tsx";
import { bundle } from "./examples.ts";
import { initialState, reducer } from "./state.ts";

export function App() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [input, setInput] = useState<UserInput>(emptyInput);
  const [activeExample, setActiveExample] = useState<string | null>(null);
  const compat = useMemo(() => checkCompatibility(bundle), []);

  const fail = (e: unknown) => {
    if (e instanceof AnalyzeError) dispatch({ type: "failure", message: e.message, issues: e.issues });
    else dispatch({ type: "failure", message: `Unexpected error: ${e instanceof Error ? e.message : String(e)}` });
  };

  const selectExample = (id: string) => {
    setActiveExample(id);
    dispatch({ type: "start", what: "Running the SDK on the example in your browser..." });
    // Yield once so the loading state can paint before the synchronous SDK call.
    setTimeout(() => {
      try {
        const r = analyzeExample(id);
        dispatch({ type: "success", report: r.report, source: { kind: "example", id, reproduces: r.reproducesShippedReport } });
      } catch (e) {
        fail(e);
      }
    }, 0);
  };

  const runInput = async () => {
    setActiveExample(null);
    dispatch({ type: "start", what: "Reading your input and running the SDK in your browser..." });
    try {
      const report = await analyzeUserInput(input);
      dispatch({ type: "success", report, source: { kind: "input" } });
    } catch (e) {
      fail(e);
    }
  };

  const openReport = (label: string, text: string) => {
    setActiveExample(null);
    let value: unknown;
    try {
      value = JSON.parse(text);
    } catch (e) {
      dispatch({ type: "failure", message: `${label} is not valid JSON.`, issues: [e instanceof Error ? e.message : String(e)] });
      return;
    }
    const r = openSavedReport(value);
    if (r.ok) dispatch({ type: "success", report: r.report, source: { kind: "saved_report", label } });
    else dispatch({ type: "failure", message: r.message, issues: r.issues });
  };

  const copyToForm = (id: string) => {
    const entry = bundle.cases.find((c) => c.id === id);
    if (!entry) return;
    const o = entry.case.options;
    setInput({
      record: { label: `${id} (copied example record)`, text: JSON.stringify({ transactions: entry.case.records }, null, 2) },
      evidence: [{ label: `${id} (copied example evidence)`, text: JSON.stringify(entry.case.evidence, null, 2) }],
      options: { feePolicy: o.feePolicy ?? "", asset: o.assetOverride ?? "", anchorAccount: o.anchorAccount ?? "", toleranceBps: o.amountToleranceBps === undefined ? "" : String(o.amountToleranceBps), network: o.expectedNetwork === "testnet" || o.expectedNetwork === "public" ? o.expectedNetwork : "" },
    });
  };

  return (
    <>
      <a className="skip" href="#results">Skip to results</a>
      <header>
        <div className="top">
          <div>
            <h1>AnchorTrace Studio</h1>
            <p className="tagline">Explain a SEP-24 anchor payment from evidence. Read-only, local to this page.</p>
          </div>
          <ul className="assurances" aria-label="Guarantees and versions">
            <li>Runs in your browser; the page is not allowed to open network connections</li>
            <li>No keys, no signing, no payments</li>
            <li data-testid="pairing">SDK {TOOL_VERSION}, report schema v{REPORT_VERSION}</li>
          </ul>
        </div>
        <div className="notice" role="note">
          <strong>Confirmation on chain is not a bank payout.</strong> For a withdrawal, a matching Stellar payment shows only the wallet-side transfer; the anchor&apos;s bank or cash payout cannot be observed here.
        </div>
        {!compat.ok ? (
          <div className="blocking" role="alert" data-testid="compat-error">
            <strong>Studio and SDK are incompatible.</strong> Results are disabled until they are re-paired.
            <ul>{compat.problems.map((p) => <li key={p}>{p}</li>)}</ul>
          </div>
        ) : null}
      </header>
      <main className="layout">
        <div className="side">
          {compat.ok ? <ExampleList activeId={activeExample} onSelect={selectExample} onCopyToForm={copyToForm} /> : null}
          {compat.ok ? <InputPanel value={input} onChange={setInput} onRun={runInput} onOpenReport={openReport} busy={state.phase === "loading"} /> : null}
        </div>
        {compat.ok ? <Results state={state} onRetry={() => dispatch({ type: "reset" })} /> : null}
      </main>
      <footer className="foot">
        <p>
          AnchorTrace Studio 0.1.0 runs the pinned anchortrace-sdk {TOOL_VERSION}. Version one covers SEP-24 and classic direct payments only; path payments, claimable balances and Soroban transfers are reported as unsupported. The SEP-24 records in the examples are synthetic. No anchor or support team has validated this tool.
        </p>
      </footer>
    </>
  );
}
