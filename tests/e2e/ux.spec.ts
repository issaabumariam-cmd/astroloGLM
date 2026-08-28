import { test, expect, type Page } from "@playwright/test";

async function waitForAuth(page: Page) {
  await page.waitForTimeout(2000);
}

async function screenshot(page: Page, name: string) {
  await page.screenshot({ path: `tests/e2e/screenshots/${name}.png`, fullPage: true });
}

test.describe("Mobile UX", () => {
  test("mobile hamburger opens nav", async ({ page, isMobile }) => {
    if (!isMobile) test.skip();
    await page.goto("/");
    const hamburger = page.locator('button[aria-label="Toggle menu"]');
    await hamburger.click();
    await expect(page.getByRole("link", { name: "Meet Jehana", exact: true })).toBeVisible({ timeout: 3000 });
    await screenshot(page, "mobile-nav-open");
  });

  test("chat input has enterKeyHint=send", async ({ page, isMobile }) => {
    if (!isMobile) test.skip();
    await page.goto("/jehana");
    await waitForAuth(page);
    await page.getByRole("heading", { name: "Echo Chat", exact: true }).click();
    await page.locator("text=Aries").first().click();
    const input = page.locator('input[enterKeyHint="send"]');
    await expect(input).toBeVisible();
  });
});

test.describe("Accessibility", () => {
  test("all buttons have accessible name", async ({ page }) => {
    await page.goto("/");
    const buttons = page.locator("button");
    const count = await buttons.count();
    for (let i = 0; i < count; i++) {
      const btn = buttons.nth(i);
      const text = await btn.textContent();
      const ariaLabel = await btn.getAttribute("aria-label");
      const hasName = (text && text.trim().length > 0) || (ariaLabel && ariaLabel.length > 0);
      expect(hasName, `Button ${i} has no accessible name`).toBeTruthy();
    }
  });

  test("tap targets >=44px on mode cards", async ({ page }) => {
    await page.goto("/jehana");
    await waitForAuth(page);
    const cards = page.locator(".card.card-hover");
    for (let i = 0; i < 3; i++) {
      const box = await cards.nth(i).boundingBox();
      expect(box?.height, `Card ${i} height`).toBeGreaterThanOrEqual(44);
    }
  });

  test("section headers have letter-spacing >=0.1em", async ({ page }) => {
    await page.goto("/signs/leo");
    const header = page.locator("h3:has-text('Strengths')");
    await expect(header).toBeVisible();
    const ls = await header.evaluate((el) => {
      return parseFloat(window.getComputedStyle(el).letterSpacing);
    });
    expect(ls).toBeGreaterThanOrEqual(0.1);
  });
});

test.describe("Error + Edge Cases", () => {
  test("404 page renders gracefully", async ({ page }) => {
    await page.goto("/nonexistent-page");
    await expect(page.locator("body")).toBeVisible();
  });

  test("guided reading back button works", async ({ page }) => {
    await page.goto("/jehana");
    await waitForAuth(page);
    await page.getByRole("heading", { name: "Guided Reading" }).click();
    await page.locator('button:has-text("Back")').click();
    await expect(page.getByRole("heading", { name: "Guided Reading" })).toBeVisible();
  });
});

test.describe("SEO", () => {
  test("sitemap.xml includes /jehana not /advisor", async ({ page }) => {
    const response = await page.goto("/sitemap.xml");
    expect(response?.status()).toBe(200);
    const content = await page.content();
    expect(content).toContain("/jehana");
    expect(content).not.toContain("/advisor");
  });

  test("robots.txt is valid", async ({ page }) => {
    const response = await page.goto("/robots.txt");
    expect(response?.status()).toBe(200);
  });

  test("landing page has metadata", async ({ page }) => {
    await page.goto("/");
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);
  });
});

test.describe("No Hydration Warnings", () => {
  test("landing page no hydration errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error" && msg.text().includes("hydration")) {
        errors.push(msg.text());
      }
    });
    await page.goto("/");
    await page.waitForTimeout(3000);
    expect(errors).toHaveLength(0);
  });

  test("jehana page no hydration errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error" && msg.text().includes("hydration")) {
        errors.push(msg.text());
      }
    });
    await page.goto("/jehana");
    await page.waitForTimeout(3000);
    expect(errors).toHaveLength(0);
  });
});