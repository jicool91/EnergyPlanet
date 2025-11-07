import { test, expect } from '@playwright/test';
import { setupStageMocks } from '../utils/stageMocks';

test.describe('Stage F QA automation', () => {
  test('Premium star pack purchase shows premium success modal', async ({ page }) => {
    await setupStageMocks(page);

    await page.goto('/exchange?section=star_packs');
    await page.waitForResponse(resp => resp.url().includes('/purchase/packs'));

    const bundlesTab = page.getByRole('tab', { name: 'Наборы' });
    await bundlesTab.click();
    await expect(bundlesTab).toHaveAttribute('aria-selected', 'true');

    const purchaseButton = page.getByRole('button', { name: 'Купить пакет' });
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

    await expect(page.getByText('Stars начислены на баланс!')).toBeVisible({ timeout: 5000 });
  });

  test('PvP events preview renders lobby and schedule', async ({ page }) => {
    await setupStageMocks(page);

    await page.goto('/visual.html?view=events&theme=dark');

    await expect(page.getByText('PvP Match Lobby')).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole('button', { name: 'В очередь' })).toBeVisible();
    await expect(page.getByText(/Расписание событий/)).toBeVisible();

    // Switch to light theme to ensure tokens work in both modes
    await page.goto('/visual.html?view=events&theme=light');
    await expect(page.getByText(/Солнечная буря/)).toBeVisible();
  });

  test('Bottom navigation exposes chat tab and hides admin CTA', async ({ page }) => {
    await setupStageMocks(page);

    await page.goto('/');

    const chatTab = page.getByLabel('Chat', { exact: true });
    await expect(chatTab).toBeVisible({ timeout: 15000 });

    await chatTab.click();
    await expect(page).toHaveURL(/\/chat$/);
    await expect(page.getByText('Чаты')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/Скоро здесь появится чат/)).toBeVisible();

    await page.goto('/');
    await expect(page.getByRole('button', { name: /Admin/i })).toHaveCount(0);
    await expect(page.locator('button', { hasText: 'Админ-панель' })).toHaveCount(0);
  });

  test('Admin monetization modal exposes shop preview', async ({ page }) => {
    await setupStageMocks(page, { isAdmin: true });

    await page.goto('/earn');
    const settingsTab = page.getByRole('button', { name: 'Настройки' });
    await settingsTab.click();

    const openAdminButton = page.getByRole('button', { name: /Монетизация/ });
    const packsResponse = page.waitForResponse(resp => resp.url().includes('/purchase/packs'));
    await openAdminButton.click();
    await packsResponse;

    const adminModal = page.getByRole('dialog', { name: 'Монетизация (админ)' });
    await expect(adminModal.getByText('Premium Shop preview')).toBeVisible();

    const starPacksTab = adminModal.getByRole('tab', { name: 'Паки Stars' });
    await expect(starPacksTab).toHaveAttribute('aria-selected', 'true');
    await expect(adminModal.getByRole('button', { name: 'Купить пакет' }).first()).toBeVisible();

    const cosmeticsTab = adminModal.getByRole('tab', { name: 'Косметика' });
    await cosmeticsTab.click();
    await expect(adminModal.locator('#shop-panel-cosmetics')).toBeVisible();
  });
});
