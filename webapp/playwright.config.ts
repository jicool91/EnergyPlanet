import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.PERF_BASE_URL ?? 'http://localhost:5173';

export default defineConfig({
  testDir: './tests',
  timeout: 10 * 60 * 1000,
  expect: {
    timeout: 10_000,
  },
  fullyParallel: false,
  retries: 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL,
    trace: 'on-first-retry',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
    viewport: { width: 390, height: 844 }, // mobile-ish viewport
  },
  projects: [
    {
      name: 'chromium',
      use: devices['Desktop Chrome'],
    },
  ],
});
