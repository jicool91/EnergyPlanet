import { test, expect } from '@playwright/test';

const ROUTE = '/visual.html';

const SNAPSHOT_NAME = 'offline-summary.png';

const waitForFonts = async (page: Parameters<typeof test>[0]['page']) => {
  await page.evaluate(async () => {
    if ('fonts' in document) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (document as any).fonts.ready;
    }
  });
};

test.describe('Offline summary modal', () => {
  test('renders with dual-accent palette preview', async ({ page }) => {
    await page.goto(ROUTE, { waitUntil: 'networkidle' });
    await waitForFonts(page);
    await expect(page.getByRole('dialog', { name: 'Возврат офлайн' })).toBeVisible();
    await expect(page).toHaveScreenshot(SNAPSHOT_NAME, {
      maxDiffPixelRatio: 0.02,
    });
  });
});
