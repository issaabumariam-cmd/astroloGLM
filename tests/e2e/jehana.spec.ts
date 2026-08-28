import { test, expect, type Page } from "@playwright/test";

async function waitForAuth(page: Page) {
  await page.waitForTimeout(2000);
}

async function screenshot(page: Page, name: string) {
  await page.screenshot({ path: `tests/e2e/screenshots/${name}.png`, fullPage: true });
}

test.describe("Jehana — Welcome Screen", () => {
  test("shows three mode cards", async ({ page }) => {
    await page.goto("/jehana");
    await waitForAuth(page);
    await expect(page.getByRole("heading", { name: "Guided Reading" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Deep Echo Chat" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Echo Chat", exact: true })).toBeVisible();
    await screenshot(page, "jehana-welcome");
  });

  test("Guided Reading card is first (recommended for new users)", async ({ page }) => {
    await page.goto("/jehana");
    await waitForAuth(page);
    const cards = page.locator(".card.card-hover");
    await expect(cards.first()).toContainText("Guided Reading");
  });

  test("privacy reassurance text present", async ({ page }) => {
    await page.goto("/jehana");
    await waitForAuth(page);
    await expect(page.locator("text=Your birth data is sacred")).toBeVisible();
  });
});

test.describe("Jehana — Echo Chat (free, unlimited)", () => {
  test("picks a sign and starts chatting", async ({ page }) => {
    await page.goto("/jehana");
    await waitForAuth(page);
    await page.getByRole("heading", { name: "Echo Chat", exact: true }).click();
    await expect(page.locator("text=Choose Your Sign")).toBeVisible();
    await screenshot(page, "jehana-echo-pick");

    await page.locator("text=Leo").first().click();
    await expect(page.getByRole("heading", { name: "Jehana" })).toBeVisible();
    await screenshot(page, "jehana-echo-chat");
  });

  test("echo chat has NO free limit badge", async ({ page }) => {
    await page.goto("/jehana");
    await waitForAuth(page);
    await page.getByRole("heading", { name: "Echo Chat", exact: true }).click();
    await page.locator("text=Leo").first().click();
    await expect(page.locator("text=/free left/i")).toHaveCount(0);
  });

  test("suggestion buttons appear on first message", async ({ page }) => {
    await page.goto("/jehana");
    await waitForAuth(page);
    await page.getByRole("heading", { name: "Echo Chat", exact: true }).click();
    await page.locator("text=Aries").first().click();
    await expect(page.locator("text=What does my sun sign say")).toBeVisible();
  });
});

test.describe("Jehana — Deep Echo Chat", () => {
  test("birth data form with geo-search", async ({ page }) => {
    await page.goto("/jehana");
    await waitForAuth(page);
    await page.getByRole("heading", { name: "Deep Echo Chat" }).click();
    await expect(page.locator("text=Enter your birth details")).toBeVisible();
    await expect(page.locator('input[type="date"]')).toBeVisible();
    await expect(page.locator('input[type="time"]')).toBeVisible();
    await screenshot(page, "jehana-deep-onboard");
  });

  test("CTA disabled until date + location filled", async ({ page }) => {
    await page.goto("/jehana");
    await waitForAuth(page);
    await page.getByRole("heading", { name: "Deep Echo Chat" }).click();
    const cta = page.locator('button:has-text("Meet Jehana")');
    await expect(cta).toBeDisabled();
  });
});

test.describe("Jehana — Guided Reading", () => {
  test("birth data form appears", async ({ page }) => {
    await page.goto("/jehana");
    await waitForAuth(page);
    await page.getByRole("heading", { name: "Guided Reading" }).click();
    await expect(page.locator("text=Let Jehana guide you")).toBeVisible();
    await expect(page.locator('input[type="date"]')).toBeVisible();
    await screenshot(page, "jehana-guided-onboard");
  });

  test("back button returns to welcome", async ({ page }) => {
    await page.goto("/jehana");
    await waitForAuth(page);
    await page.getByRole("heading", { name: "Guided Reading" }).click();
    await page.locator('button:has-text("Back")').click();
    await expect(page.getByRole("heading", { name: "Guided Reading" })).toBeVisible();
  });
});

test.describe("Jehana — Chat UI", () => {
  test("New Chat button returns to welcome", async ({ page }) => {
    await page.goto("/jehana");
    await waitForAuth(page);
    await page.getByRole("heading", { name: "Echo Chat", exact: true }).click();
    await page.locator("text=Aries").first().click();
    await page.locator('button:has-text("New Chat")').click();
    await expect(page.getByRole("heading", { name: "Guided Reading" })).toBeVisible();
  });

  test("disclaimer text present at bottom", async ({ page }) => {
    await page.goto("/jehana");
    await waitForAuth(page);
    await page.getByRole("heading", { name: "Echo Chat", exact: true }).click();
    await page.locator("text=Leo").first().click();
    await expect(page.locator("text=For self-reflection and entertainment")).toBeVisible();
  });
});