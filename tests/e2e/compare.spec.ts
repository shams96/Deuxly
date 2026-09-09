import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import path from "node:path";

/**
 * Authenticated happy path: sign up, log in through the real credentials form,
 * upload two photos, open the compare page and confirm the analysis flow
 * reaches a terminal state (a saved zone analysis, or the graceful "no face
 * detected" fallback for the non-face fixture) with no unhandled page errors.
 */

const swatch = readFileSync(path.join(__dirname, "..", "fixtures", "swatch.jpg"));

test("compare runs end to end for a signed-in user", async ({ page, request }) => {
  const email = `e2e_${Date.now()}@example.com`;
  const password = "test-password-123";

  const signup = await request.post("/api/auth/signup", {
    data: { name: "E2E", email, password },
  });
  expect(signup.ok()).toBeTruthy();

  const pageErrors: string[] = [];
  page.on("pageerror", (e) => pageErrors.push(String(e)));

  await page.goto("/login");
  await page.fill("#email", email);
  await page.fill("#password", password);
  await page.click('button[type="submit"]');
  await page.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 15_000 });

  // Upload two photos through the API using the browser's session cookies.
  const upload = async (label: string) => {
    const res = await page.request.post("/api/photos", {
      multipart: {
        image: { name: "swatch.jpg", mimeType: "image/jpeg", buffer: swatch },
        label,
      },
    });
    expect(res.ok(), `${label} upload`).toBeTruthy();
    return (await res.json()).id as string;
  };
  const a = await upload("Baseline");
  const b = await upload("Week 4");

  await page.goto(`/dashboard/compare?a=${a}&b=${b}`);

  // Side-by-side is always available.
  await expect(page.getByText("Baseline vs Week 4")).toBeVisible();

  // The pipeline resolves to either a saved analysis or the no-face fallback.
  await expect(
    page
      .getByRole("heading", { name: "Analysis summary" })
      .or(page.getByText("no zone analysis is available")),
  ).toBeVisible({ timeout: 45_000 });

  expect(pageErrors, pageErrors.join("\n")).toEqual([]);
});
