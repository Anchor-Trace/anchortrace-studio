import { describe, expect, it } from "vitest";
import { initialState, reducer } from "../src/state.ts";
import { analyzeExample } from "../src/analyze.ts";

describe("state machine", () => {
  it("starts idle", () => {
    expect(initialState).toEqual({ phase: "idle" });
  });
  it("idle -> loading -> done, carrying the report and source", () => {
    const { report } = analyzeExample("wrong-issuer");
    let s = reducer(initialState, { type: "start", what: "working" });
    expect(s).toEqual({ phase: "loading", what: "working" });
    s = reducer(s, { type: "success", report, source: { kind: "input" } });
    expect(s.phase).toBe("done");
    if (s.phase === "done") expect(s.report.transactions[0]!.outcome).toBe("discrepant");
  });
  it("loading -> error keeps the message and issues, and reset returns to idle", () => {
    let s = reducer(initialState, { type: "start", what: "x" });
    s = reducer(s, { type: "failure", message: "bad", issues: ["a", "b"] });
    expect(s).toEqual({ phase: "error", message: "bad", issues: ["a", "b"] });
    expect(reducer(s, { type: "failure", message: "again" })).toEqual({ phase: "error", message: "again", issues: [] });
    expect(reducer(s, { type: "reset" })).toEqual(initialState);
  });
  it("a new start replaces a previous result (no stale report while loading)", () => {
    const { report } = analyzeExample("matched-withdrawal");
    const done = reducer(initialState, { type: "success", report, source: { kind: "input" } });
    expect(reducer(done, { type: "start", what: "again" })).toEqual({ phase: "loading", what: "again" });
  });
});
