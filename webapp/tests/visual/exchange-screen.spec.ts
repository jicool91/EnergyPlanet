import { test, expect } from '@playwright/test';
import { waitForFonts } from '../utils/waitForFonts';

test.describe('Exchange screen snapshots', () => {
  test('Shop star packs (dark)', async ({ page }) => {
    await page.goto('/visual.html?view=exchange&section=star_packs', { waitUntil: 'networkidle' });
    await waitForFonts(page);
    const root = page.getByTestId('exchange-preview-root');
    await expect(root).toBeVisible();
    await expect(root).toHaveScreenshot('exchange-shop.png', {
      maxDiffPixelRatio: 0.02,
    });
  });

  test('Shop star packs (light)', async ({ page }) => {
    await page.goto('/visual.html?view=exchange&section=star_packs&theme=light', {
      waitUntil: 'networkidle',
    });
    await waitForFonts(page);
    const root = page.getByTestId('exchange-preview-root');
    await expect(root).toBeVisible();
    await expect(root).toHaveScreenshot('exchange-shop.light.png', {
      maxDiffPixelRatio: 0.02,
    });
  });

  test('Builds tab (dark)', async ({ page }) => {
    await page.goto('/visual.html?view=exchange&section=builds', { waitUntil: 'networkidle' });
    await waitForFonts(page);
    const root = page.getByTestId('exchange-preview-root');
    await expect(page.getByRole('button', { name: 'Постройки' })).toBeVisible();
    await page.getByRole('button', { name: 'Постройки' }).click();
    await expect(root.getByText('Солнечная ферма')).toBeVisible();
    await expect(root).toHaveScreenshot('exchange-builds.png', {
      maxDiffPixelRatio: 0.02,
    });
  });

  test('Builds tab (light)', async ({ page }) => {
    await page.goto('/visual.html?view=exchange&section=builds&theme=light', {
      waitUntil: 'networkidle',
    });
    await waitForFonts(page);
    const root = page.getByTestId('exchange-preview-root');
    await expect(page.getByRole('button', { name: 'Постройки' })).toBeVisible();
    await page.getByRole('button', { name: 'Постройки' }).click();
    await expect(root.getByText('Солнечная ферма')).toBeVisible();
    await expect(root).toHaveScreenshot('exchange-builds.light.png', {
      maxDiffPixelRatio: 0.02,
    });
  });
});
