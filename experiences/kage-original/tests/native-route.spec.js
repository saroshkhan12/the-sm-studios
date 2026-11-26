import { test, expect } from "@playwright/test";

test("native experience shares the storefront shell and renders all five chapters", async ({ page }, testInfo) => {
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
  const immersiveScreenshot = await page.screenshot({ animations: "disabled" });
  await testInfo.attach("immersive-experience", { body: immersiveScreenshot, contentType: "image/png" });
  expect(errors).toEqual([]);
});

test("chapter navigation scrolls within the immersive route", async ({ page }) => {
  await page.goto("/experience");
  await page.locator('.sm-experience .chapter-nav a[aria-label="Still water"]').click();
  await expect(page).toHaveURL(/#water$/);
  await expect(page.locator("#water")).toBeVisible();
});

test("the shared site navigation remains available and the final chapter returns to the store", async ({ page }, testInfo) => {
  await page.goto("/experience");
  await expect(page.locator(".header")).toBeVisible();
  await page.locator("#return").scrollIntoViewIfNeeded();
  await page.getByRole("link", { name: /RETURN TO THE STUDIO/i }).click();
  await expect(page).toHaveURL("/");
  await expect(page.locator(".hero")).toBeVisible();
  const storefrontScreenshot = await page.screenshot({ animations: "disabled" });
  await testInfo.attach("storefront-home", { body: storefrontScreenshot, contentType: "image/png" });
});

test("motion control and shared theme toggle remain interactive", async ({ page }) => {
  await page.goto("/experience");
  const motion = page.locator("#motion-toggle");
  await motion.click();
  await expect(motion).toHaveAttribute("aria-pressed", "true");
  const themeButton = page.locator(".theme-toggle");
  await expect.poll(async () => {
    const theme = await page.locator("html").getAttribute("data-theme");
    const label = await themeButton.getAttribute("aria-label");
    return theme === "light"
      ? label === "Switch to dark mode"
      : label === "Switch to light mode";
  }).toBe(true);
  const initialTheme = await page.locator("html").getAttribute("data-theme");
  await themeButton.click();
  await expect.poll(() => page.locator("html").getAttribute("data-theme"), { timeout: 15000 }).not.toBe(initialTheme);
});

test("document scrolling advances the experience on small mobile screens without overflow", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto("/experience");
  const root = page.locator(".sm-experience");
  const scene = page.locator("#scene");
  await expect(scene).toBeVisible();
  const initial = await page.evaluate(() => window.scrollY);
  const metrics = await page.evaluate(() => ({
    pageWidth: document.documentElement.clientWidth,
    pageScrollWidth: document.documentElement.scrollWidth,
    rootHeight: document.querySelector(".sm-experience").offsetHeight,
    viewportHeight: window.innerHeight,
    sceneHeight: document.querySelector("#scene").getBoundingClientRect().height,
    sceneOverflow: getComputedStyle(document.querySelector("#scene")).overflowY
  }));
  expect(metrics.pageScrollWidth).toBeLessThanOrEqual(metrics.pageWidth + 1);
  expect(metrics.rootHeight).toBeGreaterThan(metrics.viewportHeight * 3);
  expect(metrics.sceneHeight).toBeLessThanOrEqual(metrics.viewportHeight + 1);
  expect(metrics.sceneOverflow).not.toBe("auto");
  await page.evaluate(() => window.scrollTo(0, document.querySelector(".sm-experience").offsetTop + document.querySelector(".sm-experience").offsetHeight * .88));
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(initial + 100);
  await expect(page.locator('.sm-experience .chapter-nav a[aria-label="Return"]')).toHaveAttribute("aria-current", "location");
});

test("the WebGL scene stays visible and renders through all five chapters on every target viewport", async ({ page }) => {
  const viewports = [
    { width: 320, height: 640 },
    { width: 375, height: 812 },
    { width: 390, height: 844 },
    { width: 430, height: 932 },
    { width: 768, height: 1024 },
    { width: 1440, height: 900 }
  ];
  const chapterIds = ["arrival", "threshold", "water", "lantern", "return"];

  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    await page.goto("/experience");
    const root = page.locator(".sm-experience");
    const canvas = page.locator("#scene canvas");
    await expect(canvas).toBeVisible({ timeout: 30000 });
    await expect(root).toHaveClass(/is-scene-active/);
    await expect.poll(() => root.getAttribute("data-webgl-context"), { timeout: 30000 }).toBe("ready");

    for (let index = 0; index < chapterIds.length; index += 1) {
      const chapter = page.locator(`#${chapterIds[index]}`);
      await chapter.evaluate((element) => element.scrollIntoView({ block: "center", behavior: "instant" }));
      const expectedProgress = index / (chapterIds.length - 1);

      await expect.poll(async () => {
        const value = Number(await root.getAttribute("data-experience-target-progress"));
        return Number.isFinite(value) && Math.abs(value - expectedProgress) <= 0.09;
      }, { timeout: 15000 }).toBe(true);

      await expect.poll(async () => {
        const value = Number(await root.getAttribute("data-experience-progress"));
        return Number.isFinite(value) && Math.abs(value - expectedProgress) <= 0.12;
      }, { timeout: 15000 }).toBe(true);

      const frameBefore = Number(await root.getAttribute("data-experience-frames"));
      await expect.poll(async () => {
        const frameAfter = Number(await root.getAttribute("data-experience-frames"));
        return frameAfter - frameBefore;
      }, { timeout: 5000 }).toBeGreaterThan(5);

      const box = await canvas.boundingBox();
      expect(box).not.toBeNull();
      expect(box.width).toBeGreaterThanOrEqual(viewport.width - 1);
      expect(box.height).toBeGreaterThanOrEqual(viewport.height - 1);
      expect(box.y).toBeLessThanOrEqual(1);
      expect(await root.getAttribute("data-experience-draw-calls")).not.toBe("0");
      expect(await root.getAttribute("data-webgl-context")).toBe("ready");
    }

    // Reverse navigation must drive the same camera path back to the opening chapter.
    await page.locator("#arrival").evaluate((element) => element.scrollIntoView({ block: "center", behavior: "instant" }));
    await expect.poll(() => root.getAttribute("data-experience-target-progress"), { timeout: 15000 }).toBe("0.000");
    await expect.poll(() => root.getAttribute("data-experience-progress"), { timeout: 15000 }).toBe("0.000");
  }
});
