import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./test/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: "http://127.0.0.1:5174",
    trace: "on-first-retry",
  },

  projects: [
    {
      name: "static",
      testDir: "./test/e2e",
      use: { ...devices["Desktop Chrome"], baseURL: "http://127.0.0.1:5174" },
    },
    {
      name: "dynamic",
      testDir: "./test/e2e-dynamic",
      use: { ...devices["Desktop Chrome"], baseURL: "http://127.0.0.1:5173" },
    },
  ],

  webServer: {
    command: "pnpm run dev:tester",
    url: "http://127.0.0.1:5174",
    reuseExistingServer: !process.env.CI,
    timeout: 60 * 1000, // 1 minute
  },
});
