import baseConfig from './playwright.config';
import { defineConfig, devices } from '@playwright/test';

const VISUAL_PORT = Number(process.env.VISUAL_PORT ?? 4173);

export default defineConfig({
  ...baseConfig,
  testDir: './tests/visual',
  use: {
    ...baseConfig.use,
    baseURL: `http://127.0.0.1:${VISUAL_PORT}`,
    viewport: { width: 600, height: 900 },
  },
  projects: [
    {
      name: 'chromium-visual',
      use: devices['Desktop Chrome'],
    },
  ],
  webServer: {
    command: `npm run preview -- --host 127.0.0.1 --port ${VISUAL_PORT} --strictPort`,
    url: `http://127.0.0.1:${VISUAL_PORT}`,
    reuseExistingServer: !process.env.CI,
    stdout: 'ignore',
    stderr: 'pipe',
  },
});
