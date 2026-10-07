import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("no network, enforced", () => {
  test("every request stays on the studio origin, and the CSP blocks any connection from the page", async ({ page }) => {
    const urls: string[] = [];
    page.on("request", (r) => urls.push(r.url()));
    await page.goto("/");
    await page.locator('[data-example-id="matched-deposit"]').click();
    await expect(page.getByTestId("overall")).toBeVisible();
    for (const u of urls) expect(u.startsWith("http://127.0.0.1:4173/") || u.startsWith("data:") || u.startsWith("blob:"), u).toBe(true);

    const csp = await page.locator('meta[http-equiv="Content-Security-Policy"]').getAttribute("content");
    expect(csp).toContain("connect-src 'none'");
    expect(csp).toContain("default-src 'none'");
    const outcomes = await page.evaluate(async () => {
      const tryFetch = async (u: string) => {
        try {
          await fetch(u, { mode: "no-cors" });
          return "allowed";
        } catch {
          return "blocked";
        }
      };
      return [await tryFetch("https://horizon-testnet.stellar.org/"), await tryFetch("/index.html")];
    });
    expect(outcomes).toEqual(["blocked", "blocked"]);
  });

  test("states that it is local, read-only and paired with a specific SDK", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByLabel("Guarantees and versions")).toContainText("page is not allowed to open network connections");
    await expect(page.getByLabel("Guarantees and versions")).toContainText("No keys, no signing, no payments");
  });
});

test.describe("keyboard and assistive technology", () => {
  test("the skip link is the first tab stop; examples can be chosen with Enter and Space; focus lands on the result", async ({ page }) => {
    await page.goto("/");
    await page.keyboard.press("Tab");
    await expect(page.getByRole("link", { name: "Skip to results" })).toBeFocused();
    let guard = 0;
    while (guard++ < 40) {
      await page.keyboard.press("Tab");
      if (await page.evaluate(() => document.activeElement?.hasAttribute("data-example-id"))) break;
    }
    const first = await page.evaluate(() => document.activeElement?.getAttribute("data-example-id"));
    expect(first).toBe("matched-withdrawal");
    await page.keyboard.press("Enter");
    await expect(page.getByTestId("overall").locator(".badge")).toHaveAttribute("data-outcome", "matched");
    await expect.poll(() => page.evaluate(() => document.getElementById("results")?.contains(document.activeElement))).toBe(true);
    // Space on the next example
    await page.locator('[data-example-id="wrong-issuer"]').focus();
    await page.keyboard.press("Space");
    await expect(page.getByTestId("overall").locator(".badge")).toHaveAttribute("data-outcome", "discrepant");
  });

  test("the whole form is operable by keyboard: tab to Reconcile and submit with Enter on the button", async ({ page }) => {
    await page.goto("/");
    await page.getByLabel(/SEP-24 transaction record/).fill("{");
    await page.getByRole("button", { name: "Reconcile" }).focus();
    await page.keyboard.press("Enter");
    await expect(page.getByTestId("error-state")).toBeVisible();
    await expect.poll(() => page.evaluate(() => document.getElementById("results")?.contains(document.activeElement))).toBe(true);
  });

  test("every form control has an accessible name", async ({ page }) => {
    await page.goto("/");
    const unnamed = await page.evaluate(() =>
      [...document.querySelectorAll("input, textarea, select, button")].filter((el) => {
        const e = el as HTMLElement & { labels?: NodeListOf<HTMLLabelElement> };
        const name = (e.getAttribute("aria-label") ?? "") + (e.labels ? [...e.labels].map((l) => l.textContent).join("") : "") + (el.tagName === "BUTTON" ? e.textContent ?? "" : "");
        return name.trim() === "";
      }).length,
    );
    expect(unnamed).toBe(0);
  });

  for (const scheme of ["light", "dark"] as const) {
    test(`axe finds no violations (${scheme}), empty state and a result`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: scheme });
      await page.goto("/");
      let r = await new AxeBuilder({ page }).analyze();
      expect(r.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(" | ")}`)).toEqual([]);
      await page.locator('[data-example-id="ambiguous-multi-operation"]').click();
      await expect(page.getByTestId("overall")).toBeVisible();
      r = await new AxeBuilder({ page }).analyze();
      expect(r.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(" | ")}`)).toEqual([]);
    });
  }
});

test.describe("responsive layout", () => {
  for (const [name, size] of [["phone", { width: 375, height: 812 }], ["tablet", { width: 768, height: 1024 }], ["desktop", { width: 1440, height: 900 }]] as const) {
    test(`no horizontal scrolling on ${name}`, async ({ page }) => {
      await page.setViewportSize(size);
      await page.goto("/");
      for (const id of ["ambiguous-multi-operation", "wrong-issuer", "refunded-with-onchain-refund"]) {
        await page.locator(`[data-example-id="${id}"]`).click();
        await expect(page.getByTestId("overall")).toBeVisible();
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
        expect(overflow, `${name} ${id}`).toBeLessThanOrEqual(1);
      }
    });
  }

  test("on a phone the results come after the controls in a single column", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");
    const [side, results] = await Promise.all([page.locator(".side").boundingBox(), page.locator("#results").boundingBox()]);
    expect(results!.y).toBeGreaterThanOrEqual(side!.y + side!.height - 1);
  });
});
