import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  testMatch: "**/experience.spec.js",
  // WebGL/SwiftShader is resource-intensive in CI; serialize viewport tests to avoid GPU contention.
  fullyParallel: false,
  workers: 1,
  timeout: 60000,
  reporter: [["list"], ["html", { outputFolder: "playwright-report", open: "never" }]],
  use: {
    baseURL: "http://127.0.0.1:4173",
    browserName: "chromium",
    headless: true,
    launchOptions: {
      args: ["--enable-webgl", "--use-gl=angle", "--use-angle=swiftshader"]
    }
  },
  projects: [
    { name: "mobile-iphone", use: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 } },
    { name: "mobile-small", use: { viewport: { width: 320, height: 740 }, deviceScaleFactor: 1 } },
    { name: "tablet", use: { viewport: { width: 768, height: 1024 }, deviceScaleFactor: 1 } },
    { name: "desktop", use: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 } }
  ],
  webServer: {
    command: "npm run preview -- --host 127.0.0.1",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: !process.env.CI,
    timeout: 30_000
  }
});
