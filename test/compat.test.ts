import { execFileSync } from "node:child_process";
import { cpSync, mkdtempSync, readFileSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { CASE_VERSION, EVIDENCE_VERSION, REPORT_VERSION, TOOL_VERSION } from "@anasabubakar/anchortrace-sdk";
import { describe, expect, it } from "vitest";
import { checkCompatibility, openSavedReport } from "../src/compat.ts";
import { bundle } from "../src/examples.ts";
import { pairing } from "../src/pairing.ts";

describe("studio / SDK pairing", () => {
  it("the bundled SDK is exactly the paired version and schema versions", () => {
    expect(TOOL_VERSION).toBe(pairing.sdk.version);
    expect(REPORT_VERSION).toBe(pairing.schemaVersions.report);
    expect(EVIDENCE_VERSION).toBe(pairing.schemaVersions.evidence);
    expect(CASE_VERSION).toBe(pairing.schemaVersions.case);
    expect(checkCompatibility(bundle)).toEqual({ ok: true, problems: [] });
  });

  it("reports every incompatibility it finds", () => {
    const r = checkCompatibility({ reportVersion: "2", toolVersion: "9.9.9" });
    expect(r.ok).toBe(false);
    expect(r.problems.join(" ")).toMatch(/report schema v2/);
    expect(r.problems.join(" ")).toMatch(/9\.9\.9/);
  });

  it("the shipped examples were produced by the paired SDK", () => {
    expect(bundle.toolVersion).toBe(pairing.sdk.version);
    expect(bundle.reportVersion).toBe(pairing.schemaVersions.report);
  });

  it("pairing.json records the git tag, commit and tarball hash", () => {
    expect(pairing.sdk.gitTag).toBe(`v${pairing.sdk.version}`);
    expect(pairing.sdk.gitCommit).toMatch(/^[0-9a-f]{40}$/);
    expect(pairing.sdk.tarballSha256).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe("check-pairing script", () => {
  const script = new URL("../scripts/check-pairing.mjs", import.meta.url).pathname;
  const root = new URL("..", import.meta.url).pathname;
  function inTemp(mutate: (p: Record<string, any>) => void) {
    const dir = mkdtempSync(join(tmpdir(), "pairing-"));
    const p = JSON.parse(readFileSync(join(root, "pairing.json"), "utf8"));
    mutate(p);
    writeFileSync(join(dir, "pairing.json"), JSON.stringify(p));
    symlinkSync(join(root, "vendor"), join(dir, "vendor"));
    symlinkSync(join(root, "node_modules"), join(dir, "node_modules"));
    return dir;
  }
  const run = (cwd: string) => {
    try {
      return { code: 0, out: execFileSync("node", [script], { cwd, encoding: "utf8", stdio: "pipe" }) };
    } catch (e: any) {
      return { code: e.status as number, out: String(e.stderr) };
    }
  };
  it("passes for the real pairing", () => {
    expect(run(root).code).toBe(0);
  });
  it("fails when the recorded tarball hash is wrong", () => {
    const r = run(inTemp((p) => (p.sdk.tarballSha256 = "0".repeat(64))));
    expect(r.code).toBe(1);
    expect(r.out).toMatch(/tarballSha256/);
  });
  it("fails when the paired SDK version differs from the installed one", () => {
    const r = run(inTemp((p) => (p.sdk.version = "0.2.0")));
    expect(r.code).toBe(1);
    expect(r.out).toMatch(/installed SDK is 0\.1\.0/);
  });
  it("fails when a vendored schema no longer matches the SDK's", () => {
    const r = run(inTemp((p) => (p.vendoredSchemas["vendor/schema/report.v1.schema.json"] = "f".repeat(64))));
    expect(r.code).toBe(1);
    expect(r.out).toMatch(/report\.v1\.schema\.json/);
  });
});

describe("opening saved reports", () => {
  const good = bundle.cases[0]!.report;
  it("accepts a v1 report", () => {
    expect(openSavedReport(good).ok).toBe(true);
  });
  it("refuses other versions, non-reports and tampered reports with specific messages", () => {
    const v2 = openSavedReport({ ...good, reportVersion: "2" });
    expect(v2.ok).toBe(false);
    if (!v2.ok) expect(v2.message).toMatch(/schema v2.*reads v1 only/);
    const nope = openSavedReport({ hello: 1 });
    expect(nope.ok).toBe(false);
    const bad = structuredClone(good) as any;
    bad.transactions[0].outcome = "success";
    const r = openSavedReport(bad);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.issues.length).toBeGreaterThan(0);
    expect(openSavedReport(null).ok).toBe(false);
    void cpSync;
  });
});
