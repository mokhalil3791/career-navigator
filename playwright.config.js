// @ts-check
import { defineConfig, devices } from '@playwright/test';

/**
 * End-to-end tests run against the BUILT site (strict CSP on), served from _site/.
 * Three engines plus two phone viewports (NFR-PERF-1). No test calls a real AI
 * provider: built-in AI tests use the mock server in tests/e2e/mock-ai.js.
 */
export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 45000,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  // Service workers are blocked by default: a page controlled by one bypasses Playwright's
  // request mocks, which could let a test reach a real AI provider. The PWA spec allows them.
  use: { baseURL: 'http://localhost:4174/next/', trace: 'retain-on-failure', serviceWorkers: 'block' },
  webServer: { command: 'node scripts/serve.mjs 4174', url: 'http://localhost:4174/next/', reuseExistingServer: !process.env.CI },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'mobile-chrome', use: { ...devices['Pixel 7'] } },
    { name: 'mobile-safari', use: { ...devices['iPhone 14'] } },
  ],
});
