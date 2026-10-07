import { expect, test } from "@playwright/test";

// Intended outcomes, written from the SEP-24 / chain semantics of each case, not copied from engine output.
const EXPECTED: Record<string, string> = {
  "matched-withdrawal": "matched",
  "wrong-destination": "discrepant",
  "wrong-issuer": "discrepant",
  "wrong-amount": "discrepant",
  "ambiguous-multi-operation": "ambiguous",
  "wrong-memo": "discrepant",
  "failed-onchain-transaction": "discrepant",
  "unsupported-path-payment": "unsupported",
  "unsupported-claimable-balance": "unsupported",
  "unsupported-soroban-transfer": "unsupported",
  "pending-awaiting-user-transfer": "pending",
  "pending-external-chain-confirmed": "pending",
  "insufficient-missing-evidence": "insufficient_evidence",
  "error-status-funds-received": "discrepant",
  "reordered-and-duplicate-updates": "matched",
  "status-history-conflict": "ambiguous",
  "matched-deposit": "matched",
  "refunded-with-onchain-refund": "matched",
};

test.describe("first load", () => {
  test("shows the honest framing, the pairing and an empty state", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1, name: "AnchorTrace Studio" })).toBeVisible();
    await expect(page.getByRole("note")).toContainText("Confirmation on chain is not a bank payout");
    await expect(page.getByTestId("pairing")).toHaveText("SDK 0.1.0, report schema v1");
    await expect(page.getByTestId("empty-state")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Synthetic examples" })).toBeVisible();
    await expect(page.getByTestId("compat-error")).toHaveCount(0);
    await expect(page.locator("[data-example-id]")).toHaveCount(Object.keys(EXPECTED).length);
  });
});

test.describe("every shipped example, run by the real SDK in the browser", () => {
  for (const [id, outcome] of Object.entries(EXPECTED)) {
    test(`${id} is ${outcome}`, async ({ page }) => {
      await page.goto("/");
      await page.locator(`[data-example-id="${id}"]`).click();
      const overall = page.getByTestId("overall").locator(".badge");
      await expect(overall).toHaveAttribute("data-outcome", outcome);
      await expect(page.getByTestId("source-banner")).toContainText("Synthetic example");
      await expect(page.getByTestId("recompute-status")).toContainText("identical to the report the SDK generated");
      await expect(page.locator("article.card")).toHaveCount(1);
      await expect(page.locator("article.card")).toHaveAttribute("data-outcome", outcome);
    });
  }
});

test.describe("what the findings show", () => {
  test("wrong issuer: the conflicting operation is highlighted and the issuer row differs", async ({ page }) => {
    await page.goto("/");
    await page.locator('[data-example-id="wrong-issuer"]').click();
    const op = page.locator("li.op");
    await expect(op).toHaveCount(1);
    await expect(op).toHaveAttribute("data-role", "conflicting");
    await expect(op).toContainText("Conflicts with the record");
    await expect(op.locator("tr.check-different")).toHaveCount(1);
    await expect(op.locator("tr.check-different")).toContainText("issuer");
    await expect(page.locator('[data-code="wrong_issuer"]')).toContainText("different issuer is a different asset");
  });

  test("ambiguous multi-operation: both operations are conflicting; none is declared the match", async ({ page }) => {
    await page.goto("/");
    await page.locator('[data-example-id="ambiguous-multi-operation"]').click();
    await expect(page.locator("li.op")).toHaveCount(2);
    await expect(page.locator('li.op[data-role="conflicting"]')).toHaveCount(2);
    await expect(page.locator('li.op[data-role="matched"]')).toHaveCount(0);
    await expect(page.locator('[data-code="multiple_candidate_operations"]')).toContainText("60.0000000 TRACEUSD + 40.0000000 TRACEUSD");
  });

  test("a finding's button highlights the operations it references", async ({ page }) => {
    await page.goto("/");
    await page.locator('[data-example-id="wrong-destination"]').click();
    const btn = page.locator('[data-code="wrong_destination"] button');
    await expect(btn).toHaveAttribute("aria-pressed", "false");
    await btn.click();
    await expect(btn).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator('li.op[data-highlighted="true"]')).toHaveCount(1);
  });

  test("a matched withdrawal still says the payout is not verified", async ({ page }) => {
    await page.goto("/");
    await page.locator('[data-example-id="matched-withdrawal"]').click();
    await expect(page.locator("article.card")).toContainText("Chain confirmation is not proof of the external payout");
    await expect(page.locator('[data-code="external_payout_not_verified"]')).toContainText("not a bank payout");
  });

  test("unsupported forms are labelled unsupported, with the reason", async ({ page }) => {
    await page.goto("/");
    await page.locator('[data-example-id="unsupported-path-payment"]').click();
    await expect(page.locator('li.op[data-role="unsupported"]')).toHaveCount(1);
    await expect(page.locator('[data-code="path_payment_not_supported"]')).toContainText("unsupported rather than matched");
  });

  test("duplicate and reordered updates collapse to one ordered timeline", async ({ page }) => {
    await page.goto("/");
    await page.locator('[data-example-id="reordered-and-duplicate-updates"]').click();
    const items = page.locator("ol.timeline li");
    await expect(items).toHaveCount(4);
    await expect(items.nth(0)).toContainText("pending_user_transfer_start");
    await expect(items.nth(3)).toContainText("completed");
    await expect(items.nth(3)).toContainText("seen 2 times");
  });
});
