import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  workers: 1,
  timeout: 90000,
  reporter: [["list"], ["html", { outputFolder: "native-playwright-report", open: "never" }]],
  use: {
    baseURL: "http://127.0.0.1:3000",
    browserName: "chromium",
    headless: true,
    launchOptions: {
      args: ["--enable-webgl", "--use-gl=angle", "--use-angle=swiftshader"]
    }
  },
  projects: [
    { name: "native-mobile", use: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 } },
    { name: "native-small-mobile", use: { viewport: { width: 320, height: 740 }, deviceScaleFactor: 1 } },
    { name: "native-desktop", use: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 } }
  ],
  webServer: {
    command: "cd ../.. && npm run start",
    url: "http://127.0.0.1:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 60_000
  }
});
