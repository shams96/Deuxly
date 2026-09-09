import { test, expect } from "@playwright/test";

test.describe("public routes render", () => {
  for (const path of ["/", "/login", "/signup"]) {
    test(`GET ${path} responds 200 and renders`, async ({ page }) => {
      const res = await page.goto(path);
      expect(res?.status()).toBe(200);
      await expect(page.locator("body")).toBeVisible();
    });
  }
});

test.describe("dashboard is protected", () => {
  const routes = [
    "/dashboard",
    "/dashboard/capture",
    "/dashboard/history",
    "/dashboard/compare",
    "/dashboard/analyses",
    "/dashboard/settings",
  ];

  for (const path of routes) {
    test(`unauthenticated ${path} does not 404 and is gated`, async ({
      page,
    }) => {
      const res = await page.goto(path);
      // Route exists (no 404). Server layout redirects to /login; the client
      // ProtectedRoute may briefly render a loader before redirecting.
      expect(res?.status()).toBeLessThan(404);
      await page.waitForLoadState("networkidle");
      expect(page.url()).toContain("/login");
    });
  }
});
