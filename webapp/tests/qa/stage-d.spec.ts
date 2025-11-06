import { test, expect } from '@playwright/test';
import { setupStageMocks } from '../utils/stageMocks';

test.describe('Stage D QA automation', () => {
  test('Leaderboard empty state renders friendly fallback', async ({ page }) => {
    await setupStageMocks(page, { leaderboard: [] });

    await page.goto('/friends');
    await page.waitForResponse(resp => resp.url().includes('/leaderboard'));
    console.log('[qa] URL after /friends:', page.url());
    const friendsBody = await page.locator('body').evaluate(el => el.textContent?.slice(0, 1000));
    console.log('[qa] friends body preview:', friendsBody);
    console.log('[qa] h2 headings:', await page.locator('h2').allTextContents());
    console.log(
      '[qa] contains heading?',
      await page.evaluate(() => document.body.innerHTML.includes('Топ игроков'))
    );

    const emptyState = page.getByText(
      'Таблица пустая — станьте первым, кто произведёт энергию и попадёт в топ!'
    );
    await emptyState.scrollIntoViewIfNeeded();
    await expect(emptyState).toBeVisible();
  });

  test('Shop surfaces error state when packs fail to load', async ({ page }) => {
    await setupStageMocks(page, { starPackError: true });

    await page.goto('/exchange?section=star_packs');
    await page.waitForResponse(resp => resp.url().includes('/purchase/packs'));
    console.log('[qa] URL after /exchange:', page.url());
    const exchangeBody = await page
      .locator('body')
      .evaluate(el => el.textContent?.slice(0, 400));
    console.log('[qa] exchange body preview:', exchangeBody);
    console.log('[qa] h2 headings (exchange):', await page.locator('h2').allTextContents());

    const errorText = page.getByText('Не удалось загрузить паки Stars');
    await errorText.scrollIntoViewIfNeeded();
    await expect(errorText).toBeVisible();
  });
});
