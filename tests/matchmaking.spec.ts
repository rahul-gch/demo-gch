import { test, expect } from "@playwright/test";

test.describe("Matchmaking & Supply Chain Features", () => {
  test("loads the application and checks home route", async ({ page }) => {
    await page.goto("http://localhost:5173");
    // Check if the page title or root shell loads
    await expect(page).toHaveTitle(/Global Chain Hub/i);
  });
});
