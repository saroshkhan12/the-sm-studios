import { test, expect } from "@playwright/test";

test("native experience shares the storefront shell and renders all five chapters", async ({ page }) => {
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto("/experience");
  await expect(page.locator(".wordmark")).toBeVisible();
  await expect(page.getByRole("heading", { name: /A quiet place between worlds/i })).toBeVisible();
  await expect(page.locator(".sm-experience .chapter")).toHaveCount(5);
  await expect(page.locator(".sm-experience .chapter-nav a")).toHaveCount(5);
  await expect(page.locator("#motion-toggle")).toBeVisible();
  await expect(page.locator(".sm-experience iframe")).toHaveCount(0);
  await expect(page.locator(".sm-experience canvas")).toHaveCount(1, { timeout: 30000 });
  const overflow = await page.evaluate(() => ({
    width: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth
  }));
  expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.width + 1);
  expect(errors).toEqual([]);
});

test("chapter navigation scrolls within the immersive route", async ({ page }) => {
  await page.goto("/experience");
  await page.locator('.sm-experience .chapter-nav a[aria-label="Still water"]').click();
  await expect(page).toHaveURL(/#water$/);
  await expect(page.locator("#water")).toBeVisible();
});

test("the shared site navigation remains available and the final chapter returns to the store", async ({ page }) => {
  await page.goto("/experience");
  await expect(page.locator(".header")).toBeVisible();
  await page.locator("#return").scrollIntoViewIfNeeded();
  await page.getByRole("link", { name: /RETURN TO THE STUDIO/i }).click();
  await expect(page).toHaveURL("/");
  await expect(page.locator(".hero")).toBeVisible();
});

test("motion control and shared theme toggle remain interactive", async ({ page }) => {
  await page.goto("/experience");
  const motion = page.locator("#motion-toggle");
  await motion.click();
  await expect(motion).toHaveAttribute("aria-pressed", "true");
  const initialTheme = await page.locator("html").getAttribute("data-theme");
  await page.locator(".theme-toggle").click();
  await expect.poll(() => page.locator("html").getAttribute("data-theme")).not.toBe(initialTheme);
});
