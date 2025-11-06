import { test, expect } from '@playwright/test';
import { waitForFonts } from '../utils/waitForFonts';

test.describe('Tap screen snapshots', () => {
  test('Home screen (dark)', async ({ page }) => {
    await page.goto('/visual.html?view=tap', { waitUntil: 'networkidle' });
    await waitForFonts(page);
    const root = page.getByTestId('tap-preview-root');
    await expect(root).toBeVisible();
    await expect(root).toHaveScreenshot('tap-screen.png', {
      maxDiffPixelRatio: 0.02,
    });
  });

  test('Home screen (light)', async ({ page }) => {
    await page.goto('/visual.html?view=tap&theme=light', { waitUntil: 'networkidle' });
    await waitForFonts(page);
    const root = page.getByTestId('tap-preview-root');
    await expect(root).toBeVisible();
    await expect(root).toHaveScreenshot('tap-screen.light.png', {
      maxDiffPixelRatio: 0.02,
    });
  });
});
