import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";

const sdk = (p: string) => new URL(`../node_modules/@anas.abubakar/anchortrace-sdk/${p}`, import.meta.url).pathname;
const bundle = JSON.parse(readFileSync(sdk("examples/examples.v1.json"), "utf8"));
const wrongIssuer = bundle.cases.find((c: { id: string }) => c.id === "wrong-issuer");
const WALLET = "GCWEQIIHHZN2BS5Y7VPXMTMNHFL7Y5GEWJFG4QKPGRUIOP76JBVUXFWH";
const ANCHOR = "GBC4Y6VLSLAMPSRSHPRF4WQ7UVUYCG3RYUZMDZX6UUE6AHBVNCVIJ7VI";
const ISSUER = "GC7Q2WPYYUISJ2FL26UVAEDSYJG2OBIFIGZSW2NYQCMOUKPM4LI3JRJD";

async function download(page: import("@playwright/test").Page, name: RegExp) {
  const [d] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name }).click()]);
  const stream = await d.createReadStream();
  const chunks: Buffer[] = [];
  for await (const c of stream) chunks.push(c as Buffer);
  return { filename: d.suggestedFilename(), text: Buffer.concat(chunks).toString("utf8") };
}

test.describe("redacted export", () => {
  test("default redaction removes accounts and memos, keeps issuers, and the file is a valid v1 report", async ({ page }) => {
    await page.goto("/");
    await page.locator('[data-example-id="wrong-issuer"]').click();
    const f = await download(page, /Download redacted report \(JSON\)/);
    expect(f.filename).toBe("wrong-issuer.redacted.report.json");
    expect(f.text).not.toContain(WALLET);
    expect(f.text).not.toContain(ANCHOR);
    expect(f.text).not.toMatch(/"memo": "1003"/);
    expect(f.text).toContain(ISSUER);
    const j = JSON.parse(f.text);
    expect(j.reportVersion).toBe("1");
    expect(j.redaction.categories).toEqual(["accounts", "memos", "emails"]);
    expect(j.transactions[0].outcome).toBe("discrepant");
  });

  test("choosing all categories also removes issuers and hashes", async ({ page }) => {
    await page.goto("/");
    await page.locator('[data-example-id="wrong-issuer"]').click();
    for (const c of ["issuers", "hashes"]) await page.getByRole("checkbox", { name: new RegExp(`^${c}:`) }).check();
    const f = await download(page, /Download redacted report \(JSON\)/);
    const txHash = wrongIssuer.report.transactions[0].expected.transactionHash;
    for (const s of [WALLET, ANCHOR, ISSUER, txHash]) expect(f.text).not.toContain(s);
  });

  test("the preview shows the redacted text and the full download is clearly marked as not redacted", async ({ page }) => {
    await page.goto("/");
    await page.locator('[data-example-id="wrong-issuer"]').click();
    await page.getByText(/Preview of the redacted text report/).click();
    const preview = page.getByTestId("export-preview");
    await expect(preview).toContainText("REDACTED export: accounts, memos, emails");
    await expect(preview).not.toContainText(WALLET);
    await expect(page.getByRole("button", { name: /not redacted/ })).toBeVisible();
    const full = await download(page, /Download full report/);
    expect(full.text).toContain(WALLET);
  });

  test("with nothing selected only the full report can be downloaded", async ({ page }) => {
    await page.goto("/");
    await page.locator('[data-example-id="wrong-issuer"]').click();
    for (const c of ["accounts", "memos", "emails"]) await page.getByRole("checkbox", { name: new RegExp(`^${c}:`) }).uncheck();
    await expect(page.getByRole("button", { name: /Download redacted report \(JSON\)/ })).toBeDisabled();
    await expect(page.getByRole("status").filter({ hasText: "Nothing is selected for redaction" })).toBeVisible();
  });

  test("markdown export carries the not-a-bank-payout note", async ({ page }) => {
    await page.goto("/");
    await page.locator('[data-example-id="matched-withdrawal"]').click();
    const f = await download(page, /Download redacted report \(Markdown\)/);
    expect(f.text).toMatch(/not a bank payout/);
    expect(f.text).not.toContain(WALLET);
  });
});
