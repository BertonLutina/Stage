const { defineConfig, devices } = require('@playwright/test');

/**
 * E2E tests for the Stage app running on Expo Web.
 * The server runs on http://localhost:8082 (reused if already up, else started).
 */
module.exports = defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:8082',
    viewport: { width: 390, height: 844 },
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'web', use: { ...devices['Desktop Chrome'], viewport: { width: 390, height: 844 } } }],
  webServer: {
    command: 'BROWSER=none npx expo start --web --port 8082',
    url: 'http://localhost:8082',
    reuseExistingServer: true,
    timeout: 180_000,
  },
});
