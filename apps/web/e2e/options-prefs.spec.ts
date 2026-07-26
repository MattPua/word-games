/**
 * Options prefs smoke — run against a local web dev server:
 *   bunx playwright test apps/web/e2e/options-prefs.spec.ts
 * (install `@playwright/test` once if missing).
 */
import { expect, test } from "@playwright/test";

const BASE = process.env.CP_WEB_URL ?? "http://localhost:5173";

test.describe("Options choice cards", () => {
  test("phone stacks prefs; cards flip selection", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${BASE}/options`);
    await expect(page.getByTestId("options-prefs")).toBeVisible();

    const cluster = page.getByTestId("options-prefs");
    const box = await cluster.boundingBox();
    expect(box).toBeTruthy();
    // Phone-narrow shell — not desktop chrome width
    expect(box!.width).toBeLessThanOrEqual(448); // ~28rem
    expect(await page.locator("[role=switch]").count()).toBe(0);

    const night = page.getByTestId("options-look-dark");
    const day = page.getByTestId("options-look-light");
    const lookTarget = (await night.getAttribute("aria-pressed")) === "true" ? day : night;
    await lookTarget.click();
    await expect(lookTarget).toHaveAttribute("aria-pressed", "true");
    await expect(lookTarget).toHaveClass(/cp-lobby-challenge-active/);
    if ((await lookTarget.getAttribute("data-testid")) === "options-look-dark") {
      await expect(page.locator("html")).toHaveClass(/dark/);
    } else {
      await expect(page.locator("html")).not.toHaveClass(/dark/);
    }

    const pixel = page.getByTestId("options-titles-pixel");
    const clean = page.getByTestId("options-titles-clean");
    const titleTarget = (await pixel.getAttribute("aria-pressed")) === "true" ? clean : pixel;
    await titleTarget.click();
    await expect(titleTarget).toHaveAttribute("aria-pressed", "true");
    const wantFont =
      (await titleTarget.getAttribute("data-testid")) === "options-titles-pixel"
        ? "pixel"
        : "clean";
    await expect(page.locator("html")).toHaveAttribute("data-font", wantFont);

    const show = page.getByTestId("options-words-left-show");
    const hide = page.getByTestId("options-words-left-hide");
    const wordsTarget = (await show.getAttribute("aria-pressed")) === "true" ? hide : show;
    await wordsTarget.click();
    await expect(wordsTarget).toHaveAttribute("aria-pressed", "true");
    await expect(wordsTarget).toHaveClass(/cp-lobby-challenge-active/);
  });

  test("desktop widens prefs so Lobby jam fits without scroll", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(`${BASE}/options`);
    const cluster = page.getByTestId("options-prefs");
    await expect(cluster).toBeVisible();
    const box = await cluster.boundingBox();
    expect(box).toBeTruthy();
    expect(box!.width).toBeGreaterThan(500);
    await expect(page.getByTestId("options-music")).toBeInViewport();
    await expect(page.getByRole("button", { name: /Back to lobby/i })).toBeInViewport();
  });
});
