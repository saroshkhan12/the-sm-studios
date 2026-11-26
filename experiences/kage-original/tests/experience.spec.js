import { test, expect } from "@playwright/test";

test("renders all five story chapters and navigation", async ({ page }, testInfo) => {
  const pageErrors = [];
  page.on("pageerror", error => pageErrors.push(error.message));
  await page.goto("/");
  await expect(page.locator("h1")).toContainText("A quiet place");
  await expect(page.locator(".chapter")).toHaveCount(5);
  await expect(page.locator(".chapter-nav a")).toHaveCount(5);
  await expect(page.locator("#motion-toggle")).toBeVisible();

  const overflow = await page.evaluate(() => ({
    width: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth
  }));
  expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.width + 1);

  await page.screenshot({
    path: testInfo.outputPath(`kage-${testInfo.project.name}.png`),
    fullPage: true,
    animations: "disabled"
  });
  expect(pageErrors).toEqual([]);
});

test("chapter navigation reaches the requested section", async ({ page }) => {
  await page.goto("/");
  await page.locator('.chapter-nav a[aria-label="Still water"]').click();
  await expect(page).toHaveURL(/#water$/);
  await expect(page.locator("#water")).toBeVisible();
});

test("motion control toggles its accessible state", async ({ page }) => {
  await page.goto("/");
  const toggle = page.locator("#motion-toggle");
  const before = await toggle.getAttribute("aria-pressed");
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-pressed", before === "true" ? "false" : "true");
});
