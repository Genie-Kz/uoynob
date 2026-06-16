import { describe, expect, it } from 'vitest';
import type { Attribute } from '@/types/attribute';
import { canBeSpFromAttributes } from './spRules';

const attributes: Attribute[] = [
  {
    id: '001',
    name: 'ＨＰバブル',
    category: '特性効果系',
    description: '',
    descriptionSp: 'ＨＰがさらに増える',
    monsters: [],
    skills: [],
  },
  {
    id: '002',
    name: 'メタルキラー',
    category: '特性効果系',
    description: '',
    descriptionSp: 'この特性にSP特性はありません',
    monsters: [],
    skills: [],
  },
];

describe('canBeSpFromAttributes', () => {
  it('全角半角と空白の差を吸収してSP化可否を判定する', () => {
    expect(canBeSpFromAttributes('HP バブル', attributes)).toBe(true);
    expect(canBeSpFromAttributes('ＨＰ　バブル', attributes)).toBe(true);
  });

  it('SP特性なし説明は空白差を吸収してSP化不可にする', () => {
    expect(canBeSpFromAttributes('メタルキラー', attributes)).toBe(false);
  });

  it('読み検索用のカナ統一は行わない', () => {
    expect(canBeSpFromAttributes('えいちぴーばぶる', attributes)).toBe(false);
  });
});
