import { describe, expect, it } from 'vitest';
import { createMonsterIdResolver, createMonsterResolver } from './skillLookup';

// 解決に使う最小限のモンスター情報。アイコン用の系統も保持できることを確認するため 系統 を持たせる。
const monsters = [
  { id: '001-1', no: '001', 系統: 'スライム系' },
  { id: '001-2', no: '001', 系統: 'スライム系' },
  { id: '003-1', no: '003', 系統: 'ドラゴン系' },
];

describe('createMonsterResolver', () => {
  const resolve = createMonsterResolver(monsters);

  it('完全id（"001-1"）はそのモンスターを返す', () => {
    expect(resolve('001-2')).toBe(monsters[1]);
  });

  it('位階No.（"001"）は同位階の最初の個体（代表）を返す', () => {
    expect(resolve('001')).toBe(monsters[0]);
  });

  it('解決できない参照は null を返す', () => {
    expect(resolve('999')).toBeNull();
  });

  it('解決結果はアイコン用の系統・no を保持している', () => {
    expect(resolve('003')).toMatchObject({ id: '003-1', no: '003', 系統: 'ドラゴン系' });
  });
});

describe('createMonsterIdResolver', () => {
  const resolveId = createMonsterIdResolver(monsters);

  it('完全id・位階No. のどちらからも完全idを返す', () => {
    expect(resolveId('001-2')).toBe('001-2');
    expect(resolveId('001')).toBe('001-1');
  });

  it('解決できない場合は null を返す', () => {
    expect(resolveId('999')).toBeNull();
  });
});
