// @ts-check
import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright E2E test configuration for EduNexus.
 *
 * Prerequisites:
 *   - Backend running on :8000 (or use webServer below to auto-start)
 *   - Frontend dev server on :3000
 *
 * Run:
 *   npx playwright test              # headless
 *   npx playwright test --ui         # interactive UI
 *   npx playwright test --headed     # see the browser
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: "html",

  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },

  projects: [
    {
      name: "auth-setup",
      testMatch: /auth\.setup\.js/,
    },
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      dependencies: ["auth-setup"],
    },
  ],

  /* Auto-start frontend dev server if not already running.
   * Backend must be started manually (or add a second webServer entry). */
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
