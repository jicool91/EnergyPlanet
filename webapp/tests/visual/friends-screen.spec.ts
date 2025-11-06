import { test, expect } from '@playwright/test';
import { waitForFonts } from '../utils/waitForFonts';

test.describe('Friends screen snapshots', () => {
  test('Leaderboard panel (dark)', async ({ page }) => {
    await page.goto('/visual.html?view=friends', { waitUntil: 'networkidle' });
    await waitForFonts(page);
    const leaderboardPanel = page.getByTestId('leaderboard-panel');
    await expect(leaderboardPanel).toBeVisible();
    const screenshot = await leaderboardPanel.screenshot();
    expect(screenshot).toMatchSnapshot('friends-screen.png');
  });

  test('Leaderboard panel (light)', async ({ page }) => {
    await page.goto('/visual.html?view=friends&theme=light', { waitUntil: 'networkidle' });
    await waitForFonts(page);
    const leaderboardPanel = page.getByTestId('leaderboard-panel');
    await expect(leaderboardPanel).toBeVisible();
    const screenshot = await leaderboardPanel.screenshot();
    expect(screenshot).toMatchSnapshot('friends-screen.light.png');
  });
});
