import { expect, test, type Page } from '@playwright/test';

// スモークテストでは拾えない「結合でしか確認できない」主要ユーザー導線に絞ったE2E。
// ルーター・データ取得・リアクティブ配線・URL永続化・localStorage 永続化など、
// 単体テストでは検証しづらい部分だけを対象にする（ドメイン計算は単体テスト側で担保済み）。

const consoleErrors = new WeakMap<Page, string[]>();

async function expectNoConsoleErrors(page: Page): Promise<void> {
  await page.waitForLoadState('networkidle');
  expect(consoleErrors.get(page) ?? []).toEqual([]);
}

// テーマ判定を安定させるため、OSのカラースキーム既定をライトに固定する。
test.use({ colorScheme: 'light' });

test.beforeEach(({ page }) => {
  const errors: string[] = [];
  consoleErrors.set(page, errors);
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));
});

test.describe('ビルドシミュレーター', () => {
  test('ボディサイズ変更がスキル枠数に反映され、共有URLでリロード後も復元される', async ({
    page,
  }) => {
    await page.goto('/#/simulator/001-1');
    await expect(page.getByRole('heading', { name: 'モントナー(ふつう)' })).toBeVisible();
    await expect(page.getByText('最終耐性')).toBeVisible();

    // スキル枠数の見出し（「スキル N枠」）。既定のスタンダードボディは3枠。
    const skillSlotHeading = page.getByRole('heading', { name: /枠/ });
    await expect(skillSlotHeading).toContainText('3枠');

    // ボディサイズのピッカーを開き、メガボディを選んで確定する。
    await page
      .getByRole('listitem')
      .filter({ hasText: 'ボディサイズ：' })
      .getByRole('button', { name: '選択' })
      .click();
    const picker = page.locator('.modal-panel');
    await expect(picker).toBeVisible();
    await picker.getByRole('button', { name: 'メガボディ', exact: true }).click();
    await picker.getByRole('button', { name: '選択', exact: true }).click();

    // メガボディはスキル4枠。UI（viewModel→定数）への反映を確認する。
    await expect(skillSlotHeading).toContainText('4枠');
    // 共有URLにサイズ（メガ=index2 → s=2）がエンコードされる。
    await expect.poll(() => new URL(page.url()).hash).toMatch(/[?&]s=2(&|$)/);

    // リロードしても共有URLから状態が復元される（永続化の往復）。
    await page.reload();
    await expect(page.getByRole('heading', { name: 'モントナー(ふつう)' })).toBeVisible();
    await expect(page.getByRole('heading', { name: /枠/ })).toContainText('4枠');
    await expectNoConsoleErrors(page);
  });
});

test.describe('モンスター検索', () => {
  test('耐性条件を設定して検索し、結果から詳細へ遷移できる', async ({ page }) => {
    await page.goto('/#/search');
    await expect(page.getByRole('heading', { name: 'モンスター検索' })).toBeVisible();

    // 「耐性」の設定モーダルを開く（耐性セクションが先頭の設定ボタン）。
    await page.getByRole('button', { name: '設定' }).first().click();
    const modal = page.locator('.modal-panel');
    await expect(modal).toBeVisible();

    // メラ耐性「半減↑」で絞り込む（十分な件数がヒットする条件）。
    await modal.getByRole('button', { name: 'メラの耐性閾値' }).click();
    await page.getByRole('option', { name: '半減↑' }).click();
    await modal.getByRole('button', { name: '検索', exact: true }).click();

    // 結果テーブルが表示される。
    await expect(page.getByRole('heading', { name: '検索結果' })).toBeVisible();
    const resultRows = page.locator('tbody tr');
    await expect(resultRows.first()).toBeVisible();

    // 先頭の結果からモンスター詳細へ遷移できる。
    await resultRows.first().getByRole('link').first().click();
    await expect(page).toHaveURL(/#\/monsters\/\d+-\d+$/);
    await expectNoConsoleErrors(page);
  });
});

test.describe('サイト内検索', () => {
  test('ヘッダーの検索から横断検索の結果一覧へ遷移できる', async ({ page }) => {
    await page.goto('/#/');
    await page.getByRole('searchbox', { name: 'サイト内を検索' }).fill('スライム');
    await page.getByRole('button', { name: '検索', exact: true }).click();

    // ルーターガードを通って結果ページへ遷移し、横断検索の候補が並ぶ。
    await expect(page).toHaveURL(/#\/site-search\?q=/);
    await expect(page.getByRole('heading', { name: '検索結果' })).toBeVisible();
    await expect(page.getByText(/「スライム」の候補：\d+件/)).toBeVisible();
    await expectNoConsoleErrors(page);
  });
});

test.describe('テーマ切り替え', () => {
  test('切り替えがリロード後も保持される（localStorage 永続化）', async ({ page }) => {
    await page.goto('/#/');
    await expect(page.locator('html')).not.toHaveClass(/dark/);

    await page.getByRole('button', { name: 'ダークモードに切り替え' }).click();
    await expect(page.locator('html')).toHaveClass(/dark/);

    await page.reload();
    await expect(page.locator('html')).toHaveClass(/dark/);
    await expectNoConsoleErrors(page);
  });
});
