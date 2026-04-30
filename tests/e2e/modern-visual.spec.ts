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

test('tablet portrait home uses the available viewport', async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.goto('/');

  const shell = await page.locator('.app-shell').boundingBox();
  const home = await page.locator('.home-container').boundingBox();

  expect(shell?.height).toBeGreaterThanOrEqual(1024);
  expect(home?.width).toBeGreaterThan(540);
  expect(home?.height).toBeGreaterThan(960);
});

test('large tablet portrait home keeps a vertical composition', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 1366 });
  await page.goto('/');

  const home = await page.locator('.home-container').boundingBox();
  const hero = await page.locator('.home-hero').boundingBox();
  const modes = await page.locator('.mode-selection').boundingBox();

  expect(home?.width).toBeGreaterThan(720);
  expect(home?.width).toBeLessThanOrEqual(760);
  expect(modes?.y).toBeGreaterThan((hero?.y ?? 0) + (hero?.height ?? 0) - 1);
});

test('large tablet portrait game keeps controls below the board', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 1366 });
  await page.goto('/#/pages/game/qinglu');
  await page.getByRole('button', { name: '已知悉' }).click();

  const game = await page.locator('.game-container').boundingBox();
  const board = await page.locator('.board-container').boundingBox();
  const dice = await page.locator('.dice-container').boundingBox();
  const controls = await page.locator('.control-container').boundingBox();

  expect(game?.width).toBeGreaterThan(720);
  expect(game?.width).toBeLessThanOrEqual(760);
  expect(board?.width).toBeGreaterThan(700);
  expect(dice?.y).toBeGreaterThan((board?.y ?? 0) + (board?.height ?? 0));
  expect(controls?.y).toBeGreaterThan((dice?.y ?? 0) + (dice?.height ?? 0));
});

test('tablet landscape game uses a two-column layout', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.goto('/#/pages/game/qinglu');
  await page.getByRole('button', { name: '已知悉' }).click();

  const game = await page.locator('.game-container').boundingBox();
  const board = await page.locator('.board-container').boundingBox();
  const dice = await page.locator('.dice-container').boundingBox();

  expect(game?.width).toBeGreaterThan(860);
  expect(game?.height).toBeLessThan(740);
  expect(board?.width).toBeGreaterThan(470);
  expect(dice?.x).toBeGreaterThan((board?.x ?? 0) + (board?.width ?? 0));
});

test('desktop home scales beyond tablet width', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');

  const home = await page.locator('.home-container').boundingBox();
  const hero = await page.locator('.home-hero').boundingBox();
  const modes = await page.locator('.mode-selection').boundingBox();

  expect(home?.width).toBeGreaterThan(1000);
  expect(home?.width).toBeLessThanOrEqual(1180);
  expect(modes?.x).toBeGreaterThan((hero?.x ?? 0) + (hero?.width ?? 0) - 1);
});

test('desktop game scales with width and height constraints', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/#/pages/game/qinglu');
  await page.getByRole('button', { name: '已知悉' }).click();

  const game = await page.locator('.game-container').boundingBox();
  const board = await page.locator('.board-container').boundingBox();
  const side = await page.locator('.side-panel').boundingBox();

  expect(game?.width).toBeGreaterThan(1000);
  expect(game?.height).toBeLessThanOrEqual(880);
  expect(board?.width).toBeGreaterThan(580);
  expect(side?.x).toBeGreaterThan((board?.x ?? 0) + (board?.width ?? 0));
});

test('wide desktop game keeps a readable max scale', async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto('/#/pages/game/qinglu');
  await page.getByRole('button', { name: '已知悉' }).click();

  const game = await page.locator('.game-container').boundingBox();
  const board = await page.locator('.board-container').boundingBox();

  expect(game?.width).toBeGreaterThan(1120);
  expect(game?.width).toBeLessThan(1300);
  expect(game?.height).toBeLessThan(1040);
  expect(board?.width).toBeGreaterThan(720);
});

test('large desktop continues scaling without stretching full width', async ({ page }) => {
  await page.setViewportSize({ width: 2560, height: 1440 });
  await page.goto('/#/pages/game/qinglu');
  await page.getByRole('button', { name: '已知悉' }).click();

  const game = await page.locator('.game-container').boundingBox();
  const board = await page.locator('.board-container').boundingBox();

  expect(game?.width).toBeGreaterThan(1380);
  expect(game?.width).toBeLessThan(1500);
  expect(game?.height).toBeLessThan(1400);
  expect(board?.width).toBeGreaterThan(900);
});
