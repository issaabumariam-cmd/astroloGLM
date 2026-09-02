import { test, expect, type Page } from "@playwright/test";

// Helper: wait for Supabase anonymous auth to settle
async function waitForAuth(page: Page) {
  await page.waitForTimeout(2000);
}

// Helper: take a screenshot for visual verification
async function screenshot(page: Page, name: string) {
  await page.screenshot({ path: `tests/e2e/screenshots/${name}.png`, fullPage: true });
}

test.describe("Landing Page", () => {
  test("renders hero with zodiac wheel + CTA", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1")).toContainText(/Jehana|cosmos|universe/i);
    await expect(page.locator('a[href="/jehana"]').first()).toBeVisible();
    await screenshot(page, "landing");
  });

  test("v2: single CTA — no feature grid clutter", async ({ page }) => {
    await page.goto("/");
    // The one primary CTA appears in hero and closing
    const ctas = page.locator('a[href="/jehana"]:has-text("Meet Jehana")');
    await expect(ctas.first()).toBeVisible();
    // v2 removed the feature-card grid
    await expect(page.getByRole("heading", { name: "AI Astrology Advisor" })).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "A complete astrology experience" })).toHaveCount(0);
  });

  test("nav links present and clickable", async ({ page }) => {
    await page.goto("/");
    // Desktop nav (9) + mobile drawer nav (9, hidden but present) = 18+;
    // assert desktop nav content rather than exact global count.
    const desktopNav = page.locator("header nav.hidden.md\\:flex a");
    await expect(desktopNav).toHaveCount(9);
    await expect(page.locator('header a:has-text("Today")').first()).toBeVisible();
    await expect(page.locator('header a:has-text("Jehana")').first()).toBeVisible();
    await expect(page.locator('header a:has-text("Horoscope")').first()).toBeVisible();
    await expect(page.locator('header a:has-text("Signs")').first()).toBeVisible();
    await expect(page.locator('header a:has-text("Birth Chart")').first()).toBeVisible();
    await expect(page.locator('header a:has-text("Transits")').first()).toBeVisible();
    await expect(page.locator('header a:has-text("Library")').first()).toBeVisible();
  });

  test("footer has correct links (no dead /contact)", async ({ page }) => {
    await page.goto("/");
    const footer = page.locator("footer");
    await expect(footer.locator('a:has-text("About")')).toBeVisible();
    await expect(footer.locator('a:has-text("Privacy")')).toBeVisible();
    await expect(footer.locator('a:has-text("Terms")')).toBeVisible();
    await expect(footer.locator('a[href="/contact"]')).toHaveCount(0);
  });

  test("mobile hamburger opens menu", async ({ page, isMobile }) => {
    if (!isMobile) test.skip();
    await page.goto("/");
    const hamburger = page.locator('button[aria-label="Toggle menu"]');
    await expect(hamburger).toBeVisible();
    await hamburger.click();
    await expect(page.locator('nav a:has-text("Today")')).toBeVisible();
    await screenshot(page, "mobile-nav-open");
  });
});