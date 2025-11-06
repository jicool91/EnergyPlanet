import { test, expect } from '@playwright/test';
import { setupStageMocks } from '../utils/stageMocks';

test.describe('Stage F QA automation', () => {
  test('Premium star pack purchase shows premium success modal', async ({ page }) => {
    await setupStageMocks(page);

    await page.goto('/exchange?section=star_packs');
    await page.waitForResponse(resp => resp.url().includes('/purchase/packs'));

    const bundlesTab = page.getByRole('tab', { name: 'Наборы' });
    await bundlesTab.click();

    const purchaseButton = page
      .locator('button')
      .filter({ hasText: /Купить/ })
      .first();

    await expect(purchaseButton).toBeVisible({ timeout: 15000 });

    const invoicePromise = page.waitForResponse(resp =>
      resp.url().includes('/purchase/invoice')
    );
    const purchasePromise = page.waitForResponse(resp => {
      const url = resp.url();
      return url.includes('/purchase') && !url.includes('/invoice');
    });

    await purchaseButton.click();
    await Promise.all([invoicePromise, purchasePromise]);

    const modal = page.getByRole('dialog', { name: 'Премиум-пак активирован ✨' });
    await expect(modal).toBeVisible();
    await expect(modal.getByText('Управление подпиской')).toBeVisible();
    await expect(modal.getByText(/Stars начислены на баланс!/)).toBeVisible();

    await modal.getByRole('button', { name: 'Продолжить' }).click();
    await expect(modal).toBeHidden();
  });

  test('PvP events preview renders lobby and schedule', async ({ page }) => {
    await setupStageMocks(page);

    await page.goto('/visual.html?view=events&theme=dark');

    await expect(
      page.getByRole('heading', { name: /PvP Match Lobby/i })
    ).toBeVisible();
    await expect(page.getByRole('button', { name: 'В очередь' })).toBeVisible();
    await expect(page.getByText(/Расписание событий/)).toBeVisible();

    // Switch to light theme to ensure tokens work in both modes
    await page.goto('/visual.html?view=events&theme=light');
    await expect(page.getByText(/Солнечная буря/)).toBeVisible();
  });

  test('Bottom navigation exposes chat tab and hides admin CTA', async ({ page }) => {
    await setupStageMocks(page);

    await page.goto('/');

    const chatTab = page.getByRole('button', { name: 'Chat' });
    await expect(chatTab).toBeVisible();

    await chatTab.click();
    await expect(page).toHaveURL(/\/chat$/);
    await expect(page.getByRole('heading', { name: 'Чаты' })).toBeVisible();
    await expect(page.getByText(/Скоро здесь появится чат/)).toBeVisible();

    await page.goto('/');
    await expect(page.getByRole('button', { name: /Admin/i })).toHaveCount(0);
    await expect(page.locator('button', { hasText: 'Админ-панель' })).toHaveCount(0);
  });
});
