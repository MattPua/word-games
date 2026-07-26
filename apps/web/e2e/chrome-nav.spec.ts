/**
 * Chrome nav active + hover motion — run against a local web dev server:
 *   bunx playwright test apps/web/e2e/chrome-nav.spec.ts
 * (install `@playwright/test` once if missing).
 */
import { expect, test } from "@playwright/test";

const BASE = process.env.CP_WEB_URL ?? "http://localhost:5173";

test.describe("Chrome nav icons", () => {
  test("Options icon is active on /options; hover anim unless reduced motion", async ({
    page,
  }) => {
    await page.goto(`${BASE}/options`);

    const nav = page.getByRole("navigation", { name: "Couch chrome" });
    const lobbyBtn = nav.locator('[data-nav="lobby"]');
    await expect(lobbyBtn).toBeVisible();
    await expect(lobbyBtn).toHaveAttribute("aria-label", "Back to lobby");

    const optionsBtn = nav.locator('[data-nav="options"]');
    await expect(optionsBtn).toHaveAttribute("aria-current", "page");
    await expect(optionsBtn).toHaveAttribute("data-active", "true");

    const gear = optionsBtn.locator("svg.cp-icon-anim-gear");
    await expect(gear).toBeVisible();
    await expect
      .poll(async () => gear.evaluate((el) => getComputedStyle(el).animationName))
      .toContain("cp-icon-gear-tilt");

    const medalsBtn = nav.locator('[data-nav="achievements"]');
    await expect(medalsBtn).not.toHaveAttribute("aria-current", "page");
    const medal = medalsBtn.locator("svg.cp-icon-anim-medal");
    await medalsBtn.hover();
    await expect
      .poll(async () => medal.evaluate((el) => getComputedStyle(el).animationName))
      .toContain("cp-icon-medal-bob");

    await page.emulateMedia({ reducedMotion: "reduce" });
    await expect
      .poll(async () => gear.evaluate((el) => getComputedStyle(el).animationName))
      .toBe("none");
    await expect(optionsBtn).toHaveAttribute("aria-current", "page");
  });

  test("Lobby Sofa jumps home; hidden on lobby", async ({ page }) => {
    await page.goto(`${BASE}/achievements`);
    const nav = page.getByRole("navigation", { name: "Couch chrome" });
    await nav.locator('[data-nav="lobby"]').click();
    await expect(page).toHaveURL(`${BASE}/`);
    await expect(nav.locator('[data-nav="lobby"]')).toHaveCount(0);
  });
});
