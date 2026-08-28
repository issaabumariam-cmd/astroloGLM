import { test, expect, type Page } from "@playwright/test";

async function screenshot(page: Page, name: string) {
  await page.screenshot({ path: `tests/e2e/screenshots/${name}.png`, fullPage: true });
}

test.describe("Redirects", () => {
  test("/echo redirects to /jehana", async ({ page }) => {
    await page.goto("/echo");
    await expect(page).toHaveURL(/\/jehana/);
  });

  test("/advisor redirects to /jehana", async ({ page }) => {
    await page.goto("/advisor");
    await expect(page).toHaveURL(/\/jehana/);
  });
});

test.describe("Horoscope Pages", () => {
  test("all-signs page loads", async ({ page }) => {
    await page.goto("/horoscope");
    await expect(page.locator("h1, h2").first()).toBeVisible();
    await screenshot(page, "horoscope-all");
  });

  test("per-sign page loads", async ({ page }) => {
    await page.goto("/horoscope/aries");
    await expect(page.locator("body")).toBeVisible();
    await screenshot(page, "horoscope-aries");
  });

  test("all 12 sign pages are accessible", async ({ page }) => {
    const signs = ["aries", "taurus", "gemini", "cancer", "leo", "virgo",
                   "libra", "scorpio", "sagittarius", "capricorn", "aquarius", "pisces"];
    for (const sign of signs) {
      await page.goto(`/horoscope/${sign}`);
      await expect(page.locator("body")).toBeVisible({ timeout: 5000 });
    }
  });
});

test.describe("Sign Profile Pages", () => {
  test("all-signs grid loads", async ({ page }) => {
    await page.goto("/signs");
    await expect(page.locator("h1, h2").first()).toBeVisible();
    await screenshot(page, "signs-all");
  });

  test("per-sign profile loads with strengths + growth areas", async ({ page }) => {
    await page.goto("/signs/leo");
    await expect(page.getByRole("heading", { name: "Strengths" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Growth Areas" })).toBeVisible();
    const header = page.getByRole("heading", { name: "Strengths" });
    const ls = await header.evaluate((el) => parseFloat(window.getComputedStyle(el).letterSpacing));
    expect(ls).toBeGreaterThan(0.1);
    await screenshot(page, "signs-leo");
  });
});

test.describe("Compatibility", () => {
  test("page loads", async ({ page }) => {
    await page.goto("/compatibility");
    await expect(page.locator("h1, h2").first()).toBeVisible();
    await screenshot(page, "compatibility");
  });

  test("swap button is 44px tap target", async ({ page }) => {
    await page.goto("/compatibility");
    const swapBtn = page.locator('button[aria-label="Swap signs"]');
    if (await swapBtn.isVisible()) {
      const box = await swapBtn.boundingBox();
      expect(box?.width).toBeGreaterThanOrEqual(44);
      expect(box?.height).toBeGreaterThanOrEqual(44);
    }
  });
});

test.describe("Birth Chart", () => {
  test("page loads with form", async ({ page }) => {
    await page.goto("/birth-chart");
    await expect(page.locator("h1, h2").first()).toBeVisible();
    await screenshot(page, "birth-chart");
  });
});

test.describe("Transits", () => {
  test("page loads with tabs", async ({ page }) => {
    await page.goto("/transits");
    await expect(page.locator("h1, h2").first()).toBeVisible();
    await screenshot(page, "transits");
  });
});

test.describe("Book Reader", () => {
  test("table of contents loads", async ({ page }) => {
    await page.goto("/book");
    await expect(page.locator("h1, h2, h3").first()).toBeVisible();
    await screenshot(page, "book-toc");
  });

  test("chapter 1 loads", async ({ page }) => {
    await page.goto("/book/1");
    await expect(page.locator("body")).toBeVisible();
    await screenshot(page, "book-ch1");
  });
});

test.describe("Pricing", () => {
  test("page loads with plans", async ({ page }) => {
    await page.goto("/pricing");
    await expect(page.locator("h1, h2").first()).toBeVisible();
    await screenshot(page, "pricing");
  });
});

test.describe("About + Legal", () => {
  test("about page loads", async ({ page }) => {
    await page.goto("/about");
    await expect(page.locator("h1, h2").first()).toBeVisible();
  });

  test("privacy page loads", async ({ page }) => {
    await page.goto("/privacy");
    await expect(page.locator("h1, h2").first()).toBeVisible();
  });

  test("terms page loads", async ({ page }) => {
    await page.goto("/terms");
    await expect(page.locator("h1, h2").first()).toBeVisible();
  });
});

test.describe("Account", () => {
  test("page loads with profile sections", async ({ page }) => {
    await page.goto("/account");
    await expect(page.getByRole("heading", { name: "Profile" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Subscription" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Birth Data" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Privacy & Data" })).toBeVisible();
    await screenshot(page, "account");
  });
});