import { describe, expect, it } from "vitest";
import { AnalyzeError, analyzeExample, analyzeUserInput, optionsFrom, type UserInput } from "../src/analyze.ts";
import { bundle } from "../src/examples.ts";

const base = (): UserInput => ({
  record: { label: "r.json", text: JSON.stringify({ transactions: bundle.cases.find((c) => c.id === "matched-withdrawal")!.case.records }) },
  evidence: [{ label: "e.json", text: JSON.stringify(bundle.cases.find((c) => c.id === "matched-withdrawal")!.case.evidence) }],
  options: { feePolicy: "", asset: "", anchorAccount: "", toleranceBps: "", network: "" },
});

describe("examples run by the bundled SDK", () => {
  it("every example reproduces the report the SDK generated", () => {
    for (const c of bundle.cases) {
      const r = analyzeExample(c.id);
      expect(r.reproducesShippedReport, c.id).toBe(true);
      expect(r.report).toEqual(c.report);
    }
  });
  it("rejects unknown ids", () => {
    expect(() => analyzeExample("nope")).toThrow(AnalyzeError);
  });
});

describe("user input", () => {
  it("reconciles pasted JSON and records a SHA-256 for each input", async () => {
    const r = await analyzeUserInput(base());
    expect(r.transactions[0]!.outcome).toBe("matched");
    expect(r.inputs[0]!.sha256).toMatch(/^[0-9a-f]{64}$/);
  });
  it("wraps a raw Horizon pair and an array of pairs", async () => {
    const ev = bundle.cases.find((c) => c.id === "matched-withdrawal")!.case.evidence;
    for (const text of [JSON.stringify(ev.items[0]), JSON.stringify(ev.items)]) {
      const i = base();
      i.evidence = [{ label: "pair", text }];
      expect((await analyzeUserInput(i)).transactions[0]!.outcome).toBe("matched");
    }
  });
  it("turns empty, invalid, oversized and unreadable input into AnalyzeError", async () => {
    const empty = base();
    empty.record.text = "  ";
    await expect(analyzeUserInput(empty)).rejects.toThrow(/is empty/);
    const bad = base();
    bad.record.text = "{";
    await expect(analyzeUserInput(bad)).rejects.toThrow(/not valid JSON/);
    const big = base();
    big.record.text = "x".repeat(5_000_001);
    await expect(analyzeUserInput(big)).rejects.toThrow(/larger than/);
    const notRec = base();
    notRec.record.text = JSON.stringify({ x: 1 });
    await expect(analyzeUserInput(notRec)).rejects.toBeInstanceOf(AnalyzeError);
    const badEv = base();
    badEv.evidence = [{ label: "e", text: JSON.stringify({ evidenceVersion: "9", items: [] }) }];
    await expect(analyzeUserInput(badEv)).rejects.toBeInstanceOf(AnalyzeError);
  });
  it("validates options", () => {
    expect(optionsFrom({ feePolicy: "no_fee", asset: " native ", anchorAccount: "", toleranceBps: "25", network: "testnet" })).toEqual({ feePolicy: "no_fee", assetOverride: "native", amountToleranceBps: 25, expectedNetwork: "testnet" });
    expect(() => optionsFrom({ ...base().options, toleranceBps: "-1" })).toThrow(AnalyzeError);
    expect(() => optionsFrom({ ...base().options, toleranceBps: "10001" })).toThrow(AnalyzeError);
  });
});
