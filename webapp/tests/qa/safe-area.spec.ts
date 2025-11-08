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
  test('debug command dumps safe-area snapshot (iPhone fullscreen)', async ({ page }) => {
    await setupStageMocks(page, {
      safeAreaOverride: SAFE_AREA_OVERRIDE,
      viewportOverride: VIEWPORT_OVERRIDE,
      platform: 'ios',
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

  test('iPhone portrait default sheet keeps fullscreen attr false', async ({ page }) => {
    await setupStageMocks(page, {
      safeAreaOverride: SAFE_AREA_OVERRIDE,
      viewportOverride: { isFullscreen: false },
      platform: 'ios',
    });
    await page.goto('/');

    const header = page.locator('header.status-bar-shell');
    await expect(header).toHaveAttribute('data-fullscreen', 'false');
  });

  test('Pixel fullscreen exposes attribute', async ({ page }) => {
    await setupStageMocks(page, {
      safeAreaOverride: SAFE_AREA_OVERRIDE,
      viewportOverride: VIEWPORT_OVERRIDE,
      platform: 'android',
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

  test('mobile platforms hide manual close button', async ({ page }) => {
    await setupStageMocks(page, {
      safeAreaOverride: SAFE_AREA_OVERRIDE,
      viewportOverride: { isFullscreen: false },
      platform: 'android',
    });
    await page.goto('/');

    const manualClose = page.getByTestId('manual-close-button');
    await expect(manualClose).toHaveCount(0);
  });

  test('fullscreen header removes border, shadow и blur', async ({ page }) => {
    await setupStageMocks(page, {
      safeAreaOverride: SAFE_AREA_OVERRIDE,
      viewportOverride: VIEWPORT_OVERRIDE,
      platform: 'android',
    });
    await page.goto('/');

    const header = page.locator('header.status-bar-shell');
    await expect(header).toHaveAttribute('data-fullscreen', 'true');

    const styles = await header.evaluate(node => {
      const computed = window.getComputedStyle(node as HTMLElement);
      return {
        borderColor: computed.borderTopColor,
        boxShadow: computed.boxShadow,
        backdropFilter: computed.backdropFilter,
      };
    });

    expect(styles.borderColor.toLowerCase()).toContain('0, 0, 0, 0');
    expect(styles.boxShadow).toBe('none');
    expect(styles.backdropFilter).toBe('none');
  });

  test('expanded header сохраняет капсулу и тени', async ({ page }) => {
    await setupStageMocks(page, {
      safeAreaOverride: SAFE_AREA_OVERRIDE,
      viewportOverride: { isFullscreen: false },
      platform: 'ios',
    });
    await page.goto('/');

    const header = page.locator('header.status-bar-shell');
    await expect(header).toHaveAttribute('data-fullscreen', 'false');

    const styles = await header.evaluate(node => {
      const computed = window.getComputedStyle(node as HTMLElement);
      return {
        borderColor: computed.borderTopColor,
        boxShadow: computed.boxShadow,
        backdropFilter: computed.backdropFilter,
      };
    });

    expect(styles.borderColor.toLowerCase()).not.toContain('0, 0, 0, 0');
    expect(styles.boxShadow?.toLowerCase()).not.toBe('none');
    expect(styles.backdropFilter?.toLowerCase()).not.toBe('none');
  });

  test('graceful fallback without Telegram SDK', async ({ page }) => {
    await setupStageMocks(page, {
      injectTelegram: false,
    });
    await page.goto('/');

    const header = page.locator('header.status-bar-shell');
    await expect(header).toBeVisible();
    await expect(header).toHaveAttribute('data-fullscreen', 'false');
    await expect(page.getByTestId('manual-close-button')).toHaveCount(0);
  });
});
