import { test, expect } from '@playwright/test';
import { setupStageMocks } from '../utils/stageMocks';

const debugCommand = '/debug_safe_area';

const SAFE_AREA_OVERRIDE = {
  safe: { top: 12, bottom: 20 },
  content: { top: 36 },
};

const VIEWPORT_OVERRIDE = {
  isFullscreen: true,
};

test.describe('Safe area + fullscreen instrumentation', () => {
  test('debug command dumps safe-area snapshot', async ({ page }) => {
    await setupStageMocks(page, {
      safeAreaOverride: SAFE_AREA_OVERRIDE,
      viewportOverride: VIEWPORT_OVERRIDE,
    });
    await page.goto('/');

    const commandResult = await page.evaluate(command => {
      return window.__runDebugCommand?.(command) ?? false;
    }, debugCommand);

    expect(commandResult).toBeTruthy();

    const metrics = await page.evaluate(() => window.__renderMetrics);
    expect(metrics?.safeAreaTop).toBe(12);
    expect(metrics?.contentSafeAreaTop).toBe(36);
  });

  test('status-bar shell exposes fullscreen attribute', async ({ page }) => {
    await setupStageMocks(page, {
      safeAreaOverride: SAFE_AREA_OVERRIDE,
      viewportOverride: VIEWPORT_OVERRIDE,
    });
    await page.goto('/');

    const header = page.locator('header.status-bar-shell');
    await expect(header).toHaveAttribute('data-fullscreen', 'true');
  });

  test('desktop platforms render manual close button', async ({ page }) => {
    await setupStageMocks(page, {
      safeAreaOverride: SAFE_AREA_OVERRIDE,
      viewportOverride: { isFullscreen: false },
      platform: 'tdesktop',
    });
    await page.goto('/');

    const manualClose = page.getByTestId('manual-close-button');
    await expect(manualClose).toBeVisible();
    await manualClose.click();

    const closeCalls = await page.evaluate(() => (window as typeof window & { __manualCloseCalls?: number }).__manualCloseCalls ?? 0);
    expect(closeCalls).toBeGreaterThan(0);
  });
});
