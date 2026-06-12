import { describe, expect, it } from 'vitest';
import { effectiveResistanceValue, effectiveResistances } from './effectiveResistance';
import { createMonster } from '@/test/fixtures';

describe('effectiveResistances', () => {
  it('特性が無ければ素の値と同じ', () => {
    const monster = createMonster({ メラ: '半減', ねむり: '弱点' });
    expect(effectiveResistanceValue(monster, 'メラ')).toBe('半減');
    expect(effectiveResistanceValue(monster, 'ねむり')).toBe('弱点');
  });

  it('既定の特性（全ガード＋）が耐性に反映される', () => {
    const monster = createMonster({ メラ: '普通', イオ: '弱点', 新生前特性1: '全ガード＋' });
    expect(effectiveResistanceValue(monster, 'メラ')).toBe('軽減'); // +1
    expect(effectiveResistanceValue(monster, 'イオ')).toBe('普通'); // +1
  });

  it('本来のボディサイズ補正が反映される（メガ→状態異常+2）', () => {
    const monster = createMonster({ サイズ特性: 'メガボディ', ザキ: '普通' });
    expect(effectiveResistanceValue(monster, 'ザキ')).toBe('半減'); // +2
  });

  it('全要素ぶんのマップを返す', () => {
    const monster = createMonster();
    expect(Object.keys(effectiveResistances(monster))).toHaveLength(30);
  });
});
