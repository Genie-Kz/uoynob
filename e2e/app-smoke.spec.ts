import { expect, test, type Page } from '@playwright/test';

const consoleErrors = new WeakMap<Page, string[]>();

async function expectNoConsoleErrors(page: Page): Promise<void> {
  await page.waitForLoadState('networkidle');
  expect(consoleErrors.get(page) ?? []).toEqual([]);
}

test.beforeEach(({ page }) => {
  const errors: string[] = [];
  consoleErrors.set(page, errors);
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));
});

test.describe('app smoke', () => {
  test('トップページが表示できる', async ({ page }) => {
    await page.goto('/#/');
    await expect(page.getByAltText('ドラゴンクエストモンスターズ２ イルとルカの不思議な鍵SP')).toBeVisible();
    await expect(page.getByText('イルルカSPの攻略データベース。')).toBeVisible();
    await expectNoConsoleErrors(page);
  });

  test('モンスター一覧が表示できる', async ({ page }) => {
    await page.goto('/#/monsters');
    await expect(page.getByRole('heading', { name: 'モンスター一覧' })).toBeVisible();
    await expect(page.getByPlaceholder('モンスター名で絞り込み')).toBeVisible();
    await expectNoConsoleErrors(page);
  });

  test('モンスター検索が表示できる', async ({ page }) => {
    await page.goto('/#/search');
    await expect(page.getByRole('heading', { name: 'モンスター検索' })).toBeVisible();
    await expect(page.getByRole('button', { name: '検索する' })).toBeVisible();
    await expectNoConsoleErrors(page);
  });

  test('ご当地スキルが表示できる', async ({ page }) => {
    await page.goto('/#/pickup/skill-local');
    await expect(page.getByRole('heading', { name: 'ご当地スキル' })).toBeVisible();
    await expect(page.getByText('分類から探す')).toBeVisible();
    await expectNoConsoleErrors(page);
  });

  test('モンスター一覧テーブルの短い列は中央揃えで表示する', async ({ page }) => {
    await page.goto('/#/monsters');
    await expect(page.getByRole('heading', { name: 'モンスター一覧' })).toBeVisible();
    await expect(page.locator('thead th')).toHaveCount(5);
    await expect(page.locator('tbody tr')).not.toHaveCount(0);

    const headerAlignments = await page.locator('thead th').evaluateAll((cells) =>
      cells.map((cell) => getComputedStyle(cell).textAlign),
    );
    expect(headerAlignments).toEqual(['center', 'center', 'center', 'center', 'center']);

    const firstRowAlignments = await page.locator('tbody tr').first().locator('td').evaluateAll((cells) =>
      cells.map((cell) => getComputedStyle(cell).textAlign),
    );
    expect(firstRowAlignments).toEqual(['center', 'start', 'center', 'center', 'center']);
    await expectNoConsoleErrors(page);
  });

  test('ダークモードでもテーブルヘッダが暗色で表示される', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('theme', 'dark'));
    await page.goto('/#/monsters');
    await expect(page.locator('html')).toHaveClass(/dark/);
    await expect(page.locator('.table-header-row')).toBeVisible();

    const headerStyle = await page.locator('.table-header-row').evaluate((row) => {
      const style = getComputedStyle(row);
      return {
        backgroundColor: style.backgroundColor,
        color: style.color,
      };
    });
    expect(headerStyle).toEqual({
      backgroundColor: 'rgb(38, 38, 38)',
      color: 'rgb(230, 230, 230)',
    });
    await expectNoConsoleErrors(page);
  });

  test('共有URLからシミュレーターを復元できる', async ({ page }) => {
    await page.goto(
      '/#/simulator/899-1?s=0&t=2-42-85-73-74&k=--&f=--&i=0_0_0_0_0_0&g=3-3-3-3-3-3-3-6-3-3-3-3-3-3&p=200&w=&m=&x=094',
    );
    await expect(page.getByRole('heading', { name: '大魔王マデュラージャ' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'この構成を共有（URLをコピー）' })).toBeVisible();
    await expect(page.getByText('最終耐性')).toBeVisible();
    await expectNoConsoleErrors(page);
  });
});
