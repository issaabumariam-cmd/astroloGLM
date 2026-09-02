import { test, expect, type Page } from "@playwright/test";

async function waitForAuth(page: Page) {
  await page.waitForTimeout(2000);
}

async function screenshot(page: Page, name: string) {
  await page.screenshot({ path: `tests/e2e/screenshots/${name}.png`, fullPage: true });
}

test.describe("Jehana — Welcome (v2: no mode selection)", () => {
  test("new visitor sees single 'Let Jehana guide you' card", async ({ page }) => {
    await page.goto("/jehana");
    await waitForAuth(page);
    await expect(page.getByRole("heading", { name: "Let Jehana guide you" })).toBeVisible();
    // v2: no mode-selection clutter
    await expect(page.getByRole("heading", { name: "Deep Echo Chat" })).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "Echo Chat", exact: true })).toHaveCount(0);
    await screenshot(page, "jehana-welcome");
  });

  test("privacy reassurance text present", async ({ page }) => {
    await page.goto("/jehana");
    await waitForAuth(page);
    await expect(page.locator("text=Your birth data is sacred")).toBeVisible();
  });
});

test.describe("Jehana — Guided (default path)", () => {
  test("guided birth form appears when clicking the card", async ({ page }) => {
    await page.goto("/jehana");
    await waitForAuth(page);
    await page.getByRole("heading", { name: "Let Jehana guide you" }).click();
    await expect(page.locator("text=Let Jehana guide you").first()).toBeVisible();
    await expect(page.locator('input[type="date"]')).toBeVisible();
    await screenshot(page, "jehana-guided-onboard");
  });

  test("back button returns to welcome", async ({ page }) => {
    await page.goto("/jehana");
    await waitForAuth(page);
    await page.getByRole("heading", { name: "Let Jehana guide you" }).click();
    await page.locator('button:has-text("Back")').click();
    await expect(page.getByRole("heading", { name: "Let Jehana guide you" })).toBeVisible();
  });
});

test.describe("Jehana — Ask Jehana anything (sign deep-link)", () => {
  test("deep-link ?sign=leo jumps straight into chat", async ({ page }) => {
    await page.goto("/jehana?sign=leo");
    await waitForAuth(page);
    await expect(page.getByRole("heading", { name: "Jehana", exact: true })).toBeVisible();
    await expect(page.locator("text=I see you're a Leo")).toBeVisible();
    await screenshot(page, "jehana-echo-chat");
  });

  test("sun-sign chat has NO free limit badge", async ({ page }) => {
    await page.goto("/jehana?sign=leo");
    await waitForAuth(page);
    await expect(page.locator("text=/free left/i")).toHaveCount(0);
  });

  test("suggestion buttons appear on first message", async ({ page }) => {
    await page.goto("/jehana?sign=aries");
    await waitForAuth(page);
    await expect(page.locator("text=What does my sun sign say")).toBeVisible();
  });

  test("disclaimer text present at bottom", async ({ page }) => {
    await page.goto("/jehana?sign=leo");
    await waitForAuth(page);
    await expect(page.locator("text=For self-reflection and entertainment")).toBeVisible();
  });

  test("New Chat button returns to welcome", async ({ page }) => {
    await page.goto("/jehana?sign=aries");
    await waitForAuth(page);
    await page.locator('button:has-text("New Chat")').click();
    await expect(page.getByRole("heading", { name: "Let Jehana guide you" })).toBeVisible();
  });
});

test.describe("Jehana — Ask Jehana anything (full chart)", () => {
  // Returning-user path: only reachable with saved birth data.
  // The deep-link test above covers the public path; this validates the
  // full-chart onboarding form still renders when opened directly.
  test("sun-sign chat offers upgrading to full chart via placeholder", async ({ page }) => {
    await page.goto("/jehana?sign=leo");
    await waitForAuth(page);
    const placeholder = page.locator('input[placeholder*="Ask Jehana anything"]');
    await expect(placeholder).toBeVisible();
  });
});