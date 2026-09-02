import { test, expect, type Page } from "@playwright/test";

async function waitForAuth(page: Page) {
  await page.waitForTimeout(2000);
}

test.describe("Security: Free Count Enforcement", () => {
  test("sun-sign chat has NO free limit badge", async ({ page }) => {
    await page.goto("/jehana?sign=leo");
    await waitForAuth(page);
    await expect(page.locator("text=/free left/i")).toHaveCount(0);
  });

  test("deep echo chat shows mode badge", async ({ page }) => {
    test.skip(true, "Requires live LLM gateway + consent banner interaction — manual test");
  });
});

test.describe("Security: Auth Required for Deep Echo", () => {
  test("deep echo requires auth — no chartData without login", async ({ request }) => {
    const response = await request.post("/api/chat", {
      headers: { "Content-Type": "application/json" },
      data: {
        messages: [{ role: "user", content: "test" }],
        chartData: { sun: { signName: "Leo", degreesInSign: 5, signId: "leo" } },
        tier: "premium",
      },
    });
    expect(response.status()).toBe(401);
    const body = await response.json();
    expect(body.code).toBe("AUTH_REQUIRED");
  });

  test("echo chat works without auth token (no chartData)", async ({ request }) => {
    const response = await request.post("/api/chat", {
      headers: { "Content-Type": "application/json" },
      data: {
        messages: [{ role: "user", content: "What does Leo mean?" }],
        signContext: { sign: "Leo", element: "Fire", rulingPlanet: "Sun" },
        tier: "free",
      },
    });
    expect(response.status()).not.toBe(401);
  });
});

test.describe("Geocode API", () => {
  test("min query length enforced", async ({ request }) => {
    const response = await request.get("/api/geocode?q=a");
    const body = await response.json();
    expect(body.results).toHaveLength(0);
  });

  test("max query length enforced", async ({ request }) => {
    const longQuery = "a".repeat(250);
    const response = await request.get(`/api/geocode?q=${encodeURIComponent(longQuery)}`);
    const body = await response.json();
    expect(body.results).toHaveLength(0);
  });

  test("returns results for valid city", async ({ request }) => {
    const response = await request.get("/api/geocode?q=Amman");
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.results.length).toBeGreaterThan(0);
    expect(body.results[0].lat).toBeDefined();
    expect(body.results[0].lng).toBeDefined();
  });
});