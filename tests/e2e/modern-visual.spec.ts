import { expect, test } from '@playwright/test';

test('home screen visual baseline', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.home-container')).toHaveScreenshot('modern-home.png');
});

test('home mode selection uses the start button', async ({ page }) => {
  await page.goto('/');
  await page.locator('.mode-card').nth(1).click();
  await expect(page).not.toHaveURL(/\/pages\/game\/gaoji$/);
  await expect(page.locator('.home-primary')).toContainText('高级版');

  await page.locator('.home-primary').click();
  await expect(page).toHaveURL(/\/pages\/game\/gaoji$/);
  await expect(page.locator('.age-dialog')).toBeVisible();
});

test('age gate visual baseline', async ({ page }) => {
  await page.goto('/#/pages/game/qinglu');
  await expect(page.locator('.age-dialog')).toBeVisible();
  await expect(page.locator('.age-dialog')).toHaveScreenshot('modern-age-gate.png');
});

test('qinglu board visual baseline', async ({ page }) => {
  await page.goto('/#/pages/game/qinglu');
  await page.getByRole('button', { name: '已知悉' }).click();
  await expect(page.locator('.game-container')).toHaveScreenshot('modern-qinglu-board.png');
});

test('dice roll shows motion and opens a task', async ({ page }) => {
  await page.goto('/#/pages/game/qinglu');
  await page.getByRole('button', { name: '已知悉' }).click();

  await page.locator('.dice-wrap').click();
  await expect(page.locator('.dice-face.rolling')).toBeVisible();
  await expect(page.locator('.dice-face.rolling')).toHaveCount(0, { timeout: 2_000 });
  await expect(page.locator('.modal-container')).toBeVisible();
  await expect(page.locator('.modal-title')).toContainText('男生任务');
});
