import { defineConfig, devices } from '@playwright/test';

const QA_BASE_URL = process.env.QA_BASE_URL ?? 'http://127.0.0.1:5173';

export default defineConfig({
  testDir: './tests/qa',
  timeout: 3 * 60 * 1000,
  expect: {
    timeout: 5000,
  },
  fullyParallel: false,
  retries: 0,
  reporter: [['list'], ['html', { outputFolder: 'playwright-report-qa', open: 'never' }]],
  use: {
    baseURL: QA_BASE_URL,
    trace: 'on-first-retry',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
    viewport: { width: 390, height: 844 },
  },
  projects: [
    {
      name: 'chromium',
      use: devices['Desktop Chrome'],
    },
  ],
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 5173',
    url: QA_BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
