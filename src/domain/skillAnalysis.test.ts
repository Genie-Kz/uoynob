import { describe, expect, it } from 'vitest';
import { guardAbilityToElement, hasGuardEffect, summarizeGuardEffects } from './skillAnalysis';
import { createGuardSkill } from '@/test/fixtures';

describe('guardAbilityToElement', () => {
  it('素直な対応のガード特性を要素に変換する', () => {
    expect(guardAbilityToElement('メラガード＋')).toBe('メラ');
    expect(guardAbilityToElement('ねむりガード＋')).toBe('ねむり');
    expect(guardAbilityToElement('踊り封じガード＋')).toBe('踊り封じ');
  });

  it('特殊対応（ブレス・マホトーン）を変換する', () => {
    expect(guardAbilityToElement('炎ブレスガード＋')).toBe('炎');
    expect(guardAbilityToElement('吹雪ブレスガード＋')).toBe('吹雪');
    expect(guardAbilityToElement('マホトーンガード＋')).toBe('呪文封じ');
  });

  it('ガード特性でなければ null', () => {
    expect(guardAbilityToElement('メラ')).toBeNull();
    expect(guardAbilityToElement('火炎斬り')).toBeNull();
  });
});

describe('summarizeGuardEffects', () => {
  it('重複するガード特性を個数として数える', () => {
    const skill = createGuardSkill('001', 'テストスキル', ['炎ブレスガード＋', '炎ブレスガード＋', 'メラガード＋']);
    const summary = summarizeGuardEffects(skill);
    expect(summary.get('炎')).toBe(2);
    expect(summary.get('メラ')).toBe(1);
  });

  it('ガード特性を持つかを判定できる', () => {
    expect(hasGuardEffect(createGuardSkill('001', 'A', ['メラガード＋']))).toBe(true);
    expect(hasGuardEffect(createGuardSkill('002', 'B', []))).toBe(false);
  });
});
