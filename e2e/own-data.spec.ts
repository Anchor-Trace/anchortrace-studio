import { readFileSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";

const sdk = (p: string) => new URL(`../node_modules/@anasabubakar/anchortrace-sdk/${p}`, import.meta.url).pathname;
const bundle = JSON.parse(readFileSync(sdk("examples/examples.v1.json"), "utf8"));
const entry = (id: string) => bundle.cases.find((c: { id: string }) => c.id === id);
const recordText = (id: string) => JSON.stringify({ transactions: entry(id).case.records });
const evidenceText = (id: string) => JSON.stringify(entry(id).case.evidence);

async function fill(page: Page, label: string | RegExp, text: string) {
  await page.getByLabel(label).fill(text);
}
async function addEvidence(page: Page, text: string) {
  await fill(page, /Evidence: Horizon transaction and operations/, text);
  await page.getByRole("button", { name: "Add pasted evidence" }).click();
}

test.describe("your own data", () => {
  test("paste a record and evidence: the result is the SDK's, labelled as your input", async ({ page }) => {
    await page.goto("/");
    await fill(page, /SEP-24 transaction record/, recordText("wrong-amount"));
    await addEvidence(page, evidenceText("wrong-amount"));
    await page.getByRole("button", { name: "Reconcile" }).click();
    await expect(page.getByTestId("overall").locator(".badge")).toHaveAttribute("data-outcome", "discrepant");
    await expect(page.getByTestId("source-banner")).toContainText("Your input");
    await expect(page.locator('[data-code="amount_mismatch"]')).toContainText("short by 0.5000000");
  });

  test("a raw Horizon pair is accepted as evidence", async ({ page }) => {
    await page.goto("/");
    const item = entry("matched-withdrawal").case.evidence.items[0];
    await fill(page, /SEP-24 transaction record/, recordText("matched-withdrawal"));
    await addEvidence(page, JSON.stringify(item));
    await page.getByRole("button", { name: "Reconcile" }).click();
    await expect(page.getByTestId("overall").locator(".badge")).toHaveAttribute("data-outcome", "matched");
  });

  test("the fee policy option changes the verdict and is echoed in the result", async ({ page }) => {
    await page.goto("/");
    await fill(page, /SEP-24 transaction record/, recordText("matched-withdrawal"));
    await addEvidence(page, evidenceText("matched-withdrawal"));
    await page.getByLabel("Fee policy").selectOption("customer_paid_on_top");
    await page.getByRole("button", { name: "Reconcile" }).click();
    await expect(page.getByTestId("overall").locator(".badge")).toHaveAttribute("data-outcome", "discrepant");
    await expect(page.getByTestId("overall")).toContainText("customer_paid_on_top");
    await expect(page.getByTestId("overall")).toContainText("(chosen)");
  });

  test("a record with no evidence is insufficient or pending, never matched", async ({ page }) => {
    await page.goto("/");
    await fill(page, /SEP-24 transaction record/, recordText("matched-withdrawal"));
    await expect(page.getByTestId("no-evidence")).toBeVisible();
    await page.getByRole("button", { name: "Reconcile" }).click();
    await expect(page.getByTestId("overall").locator(".badge")).toHaveAttribute("data-outcome", "insufficient_evidence");
  });

  test("copying an example into the form lets the user edit it", async ({ page }) => {
    await page.goto("/");
    await page.locator('[data-example-id="wrong-issuer"]').click();
    await page.getByRole("button", { name: /Copy the selected example into the form/ }).click();
    await expect(page.getByLabel(/SEP-24 transaction record/)).toHaveValue(/syn-wd-001/);
    await page.getByRole("button", { name: "Reconcile" }).click();
    await expect(page.getByTestId("source-banner")).toContainText("Your input");
    await expect(page.getByTestId("overall").locator(".badge")).toHaveAttribute("data-outcome", "discrepant");
  });
});

test.describe("error and empty states", () => {
  test("empty record shows an error that is an input problem, not a verdict", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Reconcile" }).click();
    const err = page.getByTestId("error-state");
    await expect(err).toBeVisible();
    await expect(err).toContainText("is empty");
    await expect(err).toContainText("not a verdict");
    await expect(err).toHaveAttribute("role", "alert");
  });

  test("invalid JSON is reported with the parser's message", async ({ page }) => {
    await page.goto("/");
    await fill(page, /SEP-24 transaction record/, "{not json");
    await page.getByRole("button", { name: "Reconcile" }).click();
    await expect(page.getByTestId("error-state")).toContainText("not valid JSON");
  });

  test("a JSON document that is not a SEP-24 record lists the schema issues", async ({ page }) => {
    await page.goto("/");
    await fill(page, /SEP-24 transaction record/, JSON.stringify({ hello: "world" }));
    await page.getByRole("button", { name: "Reconcile" }).click();
    const err = page.getByTestId("error-state");
    await expect(err).toContainText("Not a valid SEP-24 transaction record");
    await expect(err.locator("li").first()).toBeVisible();
  });

  test("float amounts are rejected as unusable amounts, not rounded", async ({ page }) => {
    await page.goto("/");
    const rec = { id: "x", kind: "withdrawal", status: "pending_anchor", amount_in: 100.5 };
    await fill(page, /SEP-24 transaction record/, JSON.stringify(rec));
    await page.getByRole("button", { name: "Reconcile" }).click();
    await expect(page.getByTestId("overall").locator(".badge")).toHaveAttribute("data-outcome", "insufficient_evidence");
    await expect(page.locator('[data-code="record_field_invalid"]').first()).toContainText("JSON numbers");
  });

  test("evidence that is not valid shows an error and leaves the form intact", async ({ page }) => {
    await page.goto("/");
    await fill(page, /SEP-24 transaction record/, recordText("matched-withdrawal"));
    await addEvidence(page, JSON.stringify({ evidenceVersion: "9", items: [] }));
    await page.getByRole("button", { name: "Reconcile" }).click();
    await expect(page.getByTestId("error-state")).toContainText("evidence");
    await expect(page.getByLabel(/SEP-24 transaction record/)).toHaveValue(/syn-wd-001/);
  });

  test("a wrong tolerance value is refused with a message", async ({ page }) => {
    await page.goto("/");
    await fill(page, /SEP-24 transaction record/, recordText("matched-withdrawal"));
    await page.getByLabel(/Amount tolerance/).fill("1.5");
    await page.getByRole("button", { name: "Reconcile" }).click();
    await expect(page.getByTestId("error-state")).toContainText("basis points");
  });

  test("an evidence file can be added and removed", async ({ page }) => {
    await page.goto("/");
    await page.locator('input[type="file"][multiple]').setInputFiles({ name: "ops.json", mimeType: "application/json", buffer: Buffer.from(evidenceText("matched-withdrawal")) });
    await expect(page.getByRole("list", { name: "Evidence added" })).toContainText("ops.json");
    await page.getByRole("button", { name: "Remove ops.json" }).click();
    await expect(page.getByTestId("no-evidence")).toBeVisible();
  });

  test("a record file can be uploaded", async ({ page }) => {
    await page.goto("/");
    await page.locator('input[type="file"]:not([multiple])').first().setInputFiles({ name: "record.json", mimeType: "application/json", buffer: Buffer.from(recordText("matched-withdrawal")) });
    await expect(page.getByLabel(/SEP-24 transaction record/)).toHaveValue(/syn-wd-001/);
  });
});

test.describe("saved reports and the version check", () => {
  test("a saved v1 report opens and is shown as saved, not recomputed", async ({ page }) => {
    await page.goto("/");
    const report = entry("wrong-issuer").report;
    await page.getByLabel(/Open a saved report/).setInputFiles({ name: "saved.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(report)) });
    await expect(page.getByTestId("source-banner")).toContainText("Saved report");
    await expect(page.getByTestId("overall").locator(".badge")).toHaveAttribute("data-outcome", "discrepant");
  });

  test("a report with another schema version is refused with a version-specific message", async ({ page }) => {
    await page.goto("/");
    const report = { ...entry("wrong-issuer").report, reportVersion: "2" };
    await page.getByLabel(/Open a saved report/).setInputFiles({ name: "future.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(report)) });
    await expect(page.getByTestId("error-state")).toContainText("schema v2");
    await expect(page.getByTestId("error-state")).toContainText("reads v1 only");
  });

  test("a tampered v1 report is refused by schema validation", async ({ page }) => {
    await page.goto("/");
    const report = structuredClone(entry("wrong-issuer").report);
    report.transactions[0].outcome = "success";
    await page.getByLabel(/Open a saved report/).setInputFiles({ name: "bad.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(report)) });
    await expect(page.getByTestId("error-state")).toContainText("does not match the v1 report schema");
  });
});
