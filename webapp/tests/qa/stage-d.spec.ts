import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { test, expect } from '@playwright/test';
import { setupStageMocks } from '../utils/stageMocks';

const currentFile = fileURLToPath(import.meta.url);
const currentDir = path.dirname(currentFile);
const evidenceDir = path.resolve(currentDir, '../../..', 'docs', 'qa', 'evidence', '2025-11-06');

const evidencePath = (filename: string) => path.join(evidenceDir, filename);

test.beforeAll(async () => {
  await fs.mkdir(evidenceDir, { recursive: true });
});

test.describe('Stage D QA automation', () => {
  test('Leaderboard empty state renders friendly fallback (dark) and captures evidence', async ({
    page,
  }) => {
    await setupStageMocks(page, { leaderboard: [] });

    await page.goto('/friends');
    await page.waitForResponse(resp => resp.url().includes('/leaderboard'));

    const panel = page.getByTestId('leaderboard-panel');
    await expect(panel).toBeVisible();

    const emptyState = page.getByText(
      'Таблица пустая — станьте первым, кто произведёт энергию и попадёт в топ!'
    );
    await expect(emptyState).toBeVisible();

    await panel.screenshot({ path: evidencePath('friends-leaderboard-empty.dark.png') });
  });

  test('Leaderboard empty state (light) captured for evidence', async ({ page }) => {
    await setupStageMocks(page, { leaderboard: [], colorScheme: 'light' });

    await page.goto('/friends');
    await page.waitForResponse(resp => resp.url().includes('/leaderboard'));

    const panel = page.getByTestId('leaderboard-panel');
    await expect(panel).toBeVisible();

    const emptyState = page.getByText(
      'Таблица пустая — станьте первым, кто произведёт энергию и попадёт в топ!'
    );
    await expect(emptyState).toBeVisible();

    await panel.screenshot({ path: evidencePath('friends-leaderboard-empty.light.png') });
  });

  test('Shop surfaces error state when packs fail to load and exposes retry CTA', async ({
    page,
  }) => {
    await setupStageMocks(page, { starPackError: true });

    await page.goto('/exchange?section=star_packs');
    const packsResponse = await page.waitForResponse(resp =>
      resp.url().includes('/purchase/packs')
    );
    try {
      const packsPayload = await packsResponse.json();
      console.log('[qa][purchase] packs payload:', JSON.stringify(packsPayload));
    } catch (error) {
      console.log('[qa][purchase] failed to parse packs payload', String(error));
    }

    const errorCard = page.getByTestId('next-ui-main').getByText('Не удалось загрузить паки Stars');
    await expect(errorCard.first()).toBeVisible();

    const retryButton = page.getByRole('button', { name: 'Повторить загрузку' });
    await expect(retryButton).toBeVisible();

    const toast = page
      .locator('[aria-live="polite"]')
      .filter({ hasText: 'Не удалось загрузить паки Stars' });
    await expect(toast.first()).toBeVisible();

    const viewport = page.getByTestId('next-ui-main');
    await viewport.screenshot({ path: evidencePath('exchange-star-packs-error.dark.png') });
  });

  test('Star pack purchase happy path records evidence', async ({ page }) => {
    await setupStageMocks(page);

    const consoleEntries: string[] = [];
    const requestEntries: string[] = [];

    page.on('console', message => {
      const type = message.type();
      if (['log', 'info', 'warn', 'error'].includes(type)) {
        consoleEntries.push(`[${new Date().toISOString()}][${type}] ${message.text()}`);
      }
    });

    page.on('request', request => {
      if (request.url().includes('/purchase')) {
        const { pathname } = new URL(request.url());
        requestEntries.push(`${request.method()} ${pathname}`);
      }
    });

    await page.goto('/exchange?section=star_packs');
    const packsResponse = await page.waitForResponse(resp =>
      resp.url().includes('/purchase/packs')
    );
    try {
      const packsPayload = await packsResponse.json();
      console.log('[qa][purchase] packs payload:', JSON.stringify(packsPayload));
    } catch (error) {
      console.log('[qa][purchase] failed to parse packs payload', String(error));
    }

    const debugBody = await page.evaluate(() => document.body.innerText.slice(0, 600));
    console.log('[qa][purchase] body preview:', debugBody);

    const bundlesTab = page.getByRole('tab', { name: 'Наборы' });
    await bundlesTab.click();

    const purchaseButton = page
      .locator('button')
      .filter({ hasText: /Купить (Stars|пакет)/ })
      .first();
    await purchaseButton.scrollIntoViewIfNeeded();
    await expect(purchaseButton).toBeVisible({ timeout: 15000 });

    const invoiceResponsePromise = page.waitForResponse(resp =>
      resp.url().includes('/purchase/invoice')
    );
    const purchaseResponsePromise = page.waitForResponse(resp => {
      const url = resp.url();
      return url.includes('/purchase') && !url.includes('/invoice');
    });

    await purchaseButton.click();

    const [invoiceResponse, purchaseResponse] = await Promise.all([
      invoiceResponsePromise,
      purchaseResponsePromise,
    ]);

    const toast = page.getByText('Stars начислены на баланс!');
    await expect(toast).toBeVisible();

    const mainContent = page.getByTestId('next-ui-main');
    await mainContent.screenshot({
      path: evidencePath('exchange-star-pack-purchase-success.dark.png'),
    });

    const invoicePayload = invoiceResponse.request()?.postData() ?? '';
    const purchasePayload = purchaseResponse.request()?.postData() ?? '';

    const logLines = [
      '# Stage D Purchase Happy Path',
      `timestamp: ${new Date().toISOString()}`,
      '',
      '## Requests',
      ...requestEntries,
      '',
      '## Invoice Request Payload',
      invoicePayload,
      '',
      '## Purchase Request Payload',
      purchasePayload,
      '',
      '## Responses',
      `invoice: ${invoiceResponse.status()} ${invoiceResponse.url()}`,
      `purchase: ${purchaseResponse.status()} ${purchaseResponse.url()}`,
      '',
      '## Console',
      ...consoleEntries,
      '',
    ].join('\n');

    await fs.writeFile(evidencePath('stage-d-purchase-happy-path.log'), logLines, 'utf8');
  });

  test('LevelUp overlay traps focus for keyboard users', async ({ page }) => {
    await page.goto('/visual.html?view=levelup');

    const debugBody = await page.evaluate(() => document.body.innerText.slice(0, 600));
    console.log('[qa][levelup] body preview:', debugBody);

    const dialog = page.getByRole('dialog');
    const continueButton = page.locator('button', { hasText: 'Продолжить' });

    await expect(dialog).toBeVisible({ timeout: 5000 });
    await expect(continueButton).toBeVisible({ timeout: 5000 });
    await continueButton.focus();
    await expect(continueButton).toBeFocused({ timeout: 5000 });

    await page.keyboard.press('Tab');
    await expect(continueButton).toBeFocused();

    await page.keyboard.press('Shift+Tab');
    await expect(continueButton).toBeFocused();

    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();
  });

  test('Auth error modal traps focus cycle', async ({ page }) => {
    await page.goto('/visual.html?view=auth-error');

    const dialog = page.getByRole('dialog', { name: 'Ошибка авторизации' });
    await expect(dialog).toBeVisible();

    const closeButton = page.getByRole('button', { name: 'Закрыть' });
    const retryButton = page.getByRole('button', { name: 'Повторить' });

    await expect(closeButton).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(retryButton).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(closeButton).toBeFocused();

    await page.keyboard.press('Shift+Tab');
    await expect(retryButton).toBeFocused();

    await page.keyboard.press('Enter');
    await expect(dialog).not.toBeVisible();
  });

  test('LevelUp overlay flags reduced-motion preference', async ({ page }) => {
    await page.goto('/visual.html?view=levelup&motion=reduced');

    const dialog = page
      .locator('[role="dialog"][data-prefers-reduced-motion="true"]')
      .filter({ hasText: 'УРОВЕНЬ' });
    await expect(dialog).toBeVisible();

    await page.keyboard.press('Escape');
  });
});

test.describe('Stage D reduced-motion previews', () => {
  test('Purchase success modal respects reduced-motion flag', async ({ page }) => {
    await page.goto('/visual.html?view=purchase-success&motion=reduced');

    const dialog = page.getByRole('dialog', { name: 'Покупка оформлена' });
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAttribute('data-prefers-reduced-motion', 'true');
  });
});
