import { test, expect } from "@playwright/test";
import { inflateSync } from "node:zlib";

function samplePngBrightness(png) {
  let offset = 8;
  let width = 0;
  let height = 0;
  let bitDepth = 0;
  let colorType = 0;
  const compressed = [];

  while (offset < png.length) {
    const length = png.readUInt32BE(offset);
    const type = png.toString("ascii", offset + 4, offset + 8);
    const data = png.subarray(offset + 8, offset + 8 + length);
    if (type === "IHDR") {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      bitDepth = data[8];
      colorType = data[9];
    } else if (type === "IDAT") {
      compressed.push(data);
    } else if (type === "IEND") {
      break;
    }
    offset += length + 12;
  }

  const channels = colorType === 6 ? 4 : colorType === 2 ? 3 : 0;
  if (!width || !height || bitDepth !== 8 || !channels) {
    throw new Error(`Unsupported screenshot PNG format: ${width}x${height}, depth ${bitDepth}, type ${colorType}`);
  }

  const raw = inflateSync(Buffer.concat(compressed));
  const stride = width * channels;
  const pixels = Buffer.alloc(height * stride);
  let source = 0;
  const paeth = (a, b, c) => {
    const p = a + b - c;
    const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
    return pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
  };

  for (let y = 0; y < height; y += 1) {
    const filter = raw[source++];
    const row = y * stride;
    for (let x = 0; x < stride; x += 1) {
      const value = raw[source++];
      const left = x >= channels ? pixels[row + x - channels] : 0;
      const above = y > 0 ? pixels[row - stride + x] : 0;
      const upperLeft = y > 0 && x >= channels ? pixels[row - stride + x - channels] : 0;
      let predictor = 0;
      if (filter === 1) predictor = left;
      else if (filter === 2) predictor = above;
      else if (filter === 3) predictor = Math.floor((left + above) / 2);
      else if (filter === 4) predictor = paeth(left, above, upperLeft);
      else if (filter !== 0) throw new Error(`Unsupported PNG filter: ${filter}`);
      pixels[row + x] = (value + predictor) & 255;
    }
  }

  const samples = [];
  for (const yRatio of [0.2, 0.5, 0.8]) {
    for (const xRatio of [0.2, 0.5, 0.8]) {
      const x = Math.min(width - 1, Math.floor(width * xRatio));
      const y = Math.min(height - 1, Math.floor(height * yRatio));
      const index = y * stride + x * channels;
      samples.push((pixels[index] * 0.2126) + (pixels[index + 1] * 0.7152) + (pixels[index + 2] * 0.0722));
    }
  }
  return { average: samples.reduce((sum, value) => sum + value, 0) / samples.length, litSamples: samples.filter((value) => value > 8).length };
}

async function centerChapter(page, chapter) {
  await chapter.evaluate((element) => {
    document.documentElement.style.scrollBehavior = "auto";
    const rect = element.getBoundingClientRect();
    const top = window.scrollY + rect.top + rect.height / 2 - window.innerHeight / 2;
    window.scrollTo(0, top);
  });
}

async function sampleLiveWebGLPixels(root) {
  const request = await root.evaluate((element) => {
    const next = String((Number(element.dataset.experiencePixelSampleRequest) || 0) + 1);
    element.dataset.experiencePixelSampleRequest = next;
    return next;
  });
  await expect.poll(
    () => root.getAttribute("data-experience-pixel-sampled-request"),
    { timeout: 5000 }
  ).toBe(request);
  return {
    average: Number(await root.getAttribute("data-experience-pixel-average")),
    litSamples: Number(await root.getAttribute("data-experience-lit-samples"))
  };
}

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
  const toggledTheme = initialTheme === "light" ? "dark" : "light";
  await expect.poll(() => page.locator("html").getAttribute("data-theme"), { timeout: 5000 }).toBe(toggledTheme);
  await expect.poll(() => page.evaluate(() => localStorage.getItem("sm-studios-theme")), { timeout: 5000 }).toBe(toggledTheme);

  // Verify the reverse toggle too; theme changes must not depend on the starting mode.
  await themeButton.click();
  await expect.poll(() => page.locator("html").getAttribute("data-theme"), { timeout: 5000 }).toBe(initialTheme);
  await expect.poll(() => page.evaluate(() => localStorage.getItem("sm-studios-theme")), { timeout: 5000 }).toBe(initialTheme);
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
  await expect(page.locator('.sm-experience .chapter-nav a[aria-label="The return"]')).toHaveAttribute("aria-current", "location");
});

test("the WebGL scene stays visible and renders through all five chapters on every target viewport", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "native-mobile", "Run the full six-size viewport matrix once to avoid duplicate GPU-heavy runs.");
  test.setTimeout(180000);
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
    // Opacity and visibility are applied to the fixed scene layer, not the
    // child canvas; assert the element that actually controls the scene's fade-in.
    await expect.poll(async () => Number(await page.locator("#scene").evaluate((element) => getComputedStyle(element).opacity)), { timeout: 5000 }).toBeGreaterThan(0.99);
    await expect.poll(() => page.locator("#scene").evaluate((element) => getComputedStyle(element).visibility), { timeout: 5000 }).toBe("visible");
    await expect.poll(() => root.getAttribute("data-webgl-context"), { timeout: 30000 }).toBe("ready");

    for (let index = 0; index < chapterIds.length; index += 1) {
      const chapter = page.locator(`#${chapterIds[index]}`);
      await centerChapter(page, chapter);
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
      // Verify real GPU framebuffer pixels. The prior page.screenshot() call timed
      // out inside Chromium's SwiftShader compositor even after frame counters,
      // draw calls and the WebGL context proved the scene was rendering.
      const brightness = await sampleLiveWebGLPixels(root);
      expect(Number.isFinite(brightness.average), "Expected live WebGL pixel diagnostics").toBe(true);
      expect(brightness.average, `Expected a visible rendered scene in chapter ${chapterIds[index]} at ${viewport.width}x${viewport.height}`).toBeGreaterThan(8);
      expect(brightness.litSamples).toBeGreaterThanOrEqual(7);
    }

    // Reverse through each chapter using immediate document scrolling, independent of CSS smooth-scroll preferences.
    for (let index = chapterIds.length - 2; index >= 0; index -= 1) {
      const chapter = page.locator(`#${chapterIds[index]}`);
      await centerChapter(page, chapter);
      const expectedProgress = index / (chapterIds.length - 1);
      await expect.poll(async () => {
        const value = Number(await root.getAttribute("data-experience-target-progress"));
        return Number.isFinite(value) && Math.abs(value - expectedProgress) <= 0.09;
      }, { timeout: 15000 }).toBe(true);
      await expect.poll(async () => {
        const value = Number(await root.getAttribute("data-experience-progress"));
        return Number.isFinite(value) && Math.abs(value - expectedProgress) <= 0.12;
      }, { timeout: 15000 }).toBe(true);

      const reverseFrameBefore = Number(await root.getAttribute("data-experience-frames"));
      await expect.poll(async () => {
        const value = Number(await root.getAttribute("data-experience-frames"));
        return value - reverseFrameBefore;
      }, { timeout: 5000 }).toBeGreaterThan(5);
      const reverseBrightness = await sampleLiveWebGLPixels(root);
      expect(Number.isFinite(reverseBrightness.average)).toBe(true);
      expect(reverseBrightness.average).toBeGreaterThan(8);
      expect(reverseBrightness.litSamples).toBeGreaterThanOrEqual(7);
      expect(await root.getAttribute("data-experience-draw-calls")).not.toBe("0");
      expect(await root.getAttribute("data-webgl-context")).toBe("ready");
    }
  }
});
