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

test.describe('一覧の操作', () => {
  test('系統フィルタ（IconSelect）で絞り込める', async ({ page }) => {
    await page.goto('/#/monsters');
    await expect(page.getByRole('heading', { name: 'モンスター一覧' })).toBeVisible();
    await expect(page.getByText('908 体')).toBeVisible();

    // listbox を開いて「ドラゴン系」を選ぶ
    await page.getByRole('button', { name: '系統で絞り込み' }).click();
    await expect(page.getByRole('listbox')).toBeVisible();
    await page.getByRole('option', { name: 'ドラゴン系' }).click();

    await expect(page.getByText('108 体')).toBeVisible();
    await expectNoConsoleErrors(page);
  });

  test('名前で絞り込んで詳細へ遷移できる', async ({ page }) => {
    await page.goto('/#/monsters');
    await page.getByPlaceholder('モンスター名で絞り込み').fill('モントナー');

    await page.getByRole('link', { name: 'モントナー(ふつう)' }).first().click();

    await expect(page).toHaveURL(/#\/monsters\/\d+-\d+$/);
    await expect(page.getByText('モントナー(ふつう)').first()).toBeVisible();
    await expectNoConsoleErrors(page);
  });
});
