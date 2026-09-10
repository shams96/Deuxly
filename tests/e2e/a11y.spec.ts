import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const PAGES = ["/", "/login", "/signup"];

for (const path of PAGES) {
  test(`${path} has no serious/critical axe violations (light)`, async ({ page }) => {
    await page.goto(path);
    await page.waitForTimeout(700); // let entrance animations settle
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .analyze();
    const serious = results.violations.filter(
      (v) => v.impact === "serious" || v.impact === "critical",
    );
    expect(
      serious,
      serious.map((v) => `${v.id}: ${v.help}`).join("\n"),
    ).toEqual([]);
  });

  test(`${path} has no serious/critical axe violations (dark)`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await page.goto(path);
    await page.evaluate(() => {
      localStorage.setItem("theme", "dark");
      document.documentElement.dataset.theme = "dark";
    });
    await page.reload();
    await page.waitForTimeout(700); // let entrance animations settle
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .analyze();
    const serious = results.violations.filter(
      (v) => v.impact === "serious" || v.impact === "critical",
    );
    expect(
      serious,
      serious.map((v) => `${v.id}: ${v.help}`).join("\n"),
    ).toEqual([]);
  });
}

test("theme choice persists across reloads", async ({ page }) => {
  await page.goto("/");
  // system -> light -> dark
  const toggle = page.getByRole("button", { name: /Theme:/ });
  await toggle.click();
  await expect(toggle).toHaveAccessibleName(/Theme: light/);
  await toggle.click();
  await expect(toggle).toHaveAccessibleName(/Theme: dark/);
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");

  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(page.getByRole("button", { name: /Theme:/ })).toHaveAccessibleName(
    /Theme: dark/,
  );
});
