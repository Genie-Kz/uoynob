import { describe, expect, it } from 'vitest';
import {
  isAttributeResistance,
  resistanceColorClass,
  resistanceDisplayText,
  resistanceLevelOf,
  resistanceValueOfLevel,
} from './resistance';

describe('resistance helpers', () => {
  it('耐性値と段階レベルが対応する', () => {
    expect(resistanceLevelOf('弱点')).toBe(0);
    expect(resistanceLevelOf('普通')).toBe(1);
    expect(resistanceLevelOf('無効')).toBe(5);
    expect(resistanceLevelOf('回復')).toBe(6);
    expect(resistanceLevelOf('反射')).toBe(7);
  });

  it('段階レベルから耐性値に戻せる', () => {
    expect(resistanceValueOfLevel(0)).toBe('弱点');
    expect(resistanceValueOfLevel(3)).toBe('半減');
    expect(resistanceValueOfLevel(7)).toBe('反射');
  });

  it('範囲外の段階レベルは端にクランプされる', () => {
    expect(resistanceValueOfLevel(-5)).toBe('弱点');
    expect(resistanceValueOfLevel(99)).toBe('反射');
  });

  it('表示テキストは普通が「-」、弱点が「弱い」になる', () => {
    expect(resistanceDisplayText('普通')).toBe('-');
    expect(resistanceDisplayText('弱点')).toBe('弱い');
    expect(resistanceDisplayText('半減')).toBe('半減');
  });

  it('普通だけ背景色クラスを持たない', () => {
    expect(resistanceColorClass('普通')).toBe('');
    expect(resistanceColorClass('半減')).toBe('bg-resistance-half');
    expect(resistanceColorClass('反射')).toBe('bg-resistance-reflect');
  });

  it('属性耐性を判定できる', () => {
    expect(isAttributeResistance('メラ')).toBe(true);
    expect(isAttributeResistance('炎')).toBe(true);
    expect(isAttributeResistance('ねむり')).toBe(false);
    expect(isAttributeResistance('ザキ')).toBe(false);
  });
});
