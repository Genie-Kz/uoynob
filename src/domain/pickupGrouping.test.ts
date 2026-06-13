import { describe, expect, it } from 'vitest';
import { createGuardSkill } from '@/test/fixtures';
import { GUARDS_BY_RESISTANCE_PICKUP } from '@/constants/pickupGroups';
import { groupPickupSkills, isGroupedSkillPickup } from './pickupGrouping';

describe('groupPickupSkills - 耐性スキル', () => {
  const items = [
    { id: '001', name: '炎を守るスキル' },
    { id: '002', name: '吹雪を守るスキル' },
    { id: '003', name: '複数耐性スキル' },
  ];
  const skills = [
    createGuardSkill('001', '炎を守るスキル', ['炎ブレスガード＋']),
    createGuardSkill('002', '吹雪を守るスキル', ['吹雪ブレスガード＋']),
    createGuardSkill('003', '複数耐性スキル', ['メラガード＋', 'マヒガード＋', 'ダウンガード＋']),
  ];

  it('ブレス耐性ではブレスガードだけを指定順で分類する', () => {
    expect(isGroupedSkillPickup('skill-resistance-breath')).toBe(true);
    expect(groupPickupSkills('skill-resistance-breath', items, skills)).toEqual([
      { label: '炎ブレスガード＋', items: [{ id: '001', name: '炎を守るスキル' }] },
      { label: '吹雪ブレスガード＋', items: [{ id: '002', name: '吹雪を守るスキル' }] },
    ]);
  });

  it.each([
    ['skill-resistance-spell', 'メラガード＋'],
    ['skill-resistance-condition', 'マヒガード＋'],
    ['skill-resistance-weaken', 'ダウンガード＋'],
  ])('%sでは対象カテゴリのガードだけを表示する', (key, expectedGuard) => {
    expect(isGroupedSkillPickup(key)).toBe(true);
    expect(groupPickupSkills(key, items, skills)).toEqual([
      { label: expectedGuard, items: [{ id: '003', name: '複数耐性スキル' }] },
    ]);
  });

  it('封じ耐性に該当しないガードしかない場合は空配列を返す', () => {
    expect(isGroupedSkillPickup('skill-resistance-seal')).toBe(true);
    expect(groupPickupSkills('skill-resistance-seal', items, skills)).toEqual([]);
  });

  it('各ピックアップで表示する耐性と順番を固定する', () => {
    expect(GUARDS_BY_RESISTANCE_PICKUP).toEqual({
      'skill-resistance-spell': [
        'メラガード＋',
        'ギラガード＋',
        'イオガード＋',
        'バギガード＋',
        'ヒャドガード＋',
        'ジバリアガード＋',
        'デインガード＋',
        'ドルマガード＋',
        'ベタンガード＋',
      ],
      'skill-resistance-breath': ['炎ブレスガード＋', '吹雪ブレスガード＋'],
      'skill-resistance-condition': [
        'ザキガード＋',
        'どくガード＋',
        '呪いガード＋',
        'マインドガード＋',
        'こんらんガード＋',
        'マヒガード＋',
        'ねむりガード＋',
        'マヌーサガード＋',
        'マホトラガード＋',
        'ハックガード＋',
      ],
      'skill-resistance-seal': [
        'マホトーンガード＋',
        '斬撃封じガード＋',
        '体技封じガード＋',
        '息封じガード＋',
        '踊り封じガード＋',
      ],
      'skill-resistance-weaken': ['ダウンガード＋', 'ルカニガード＋', 'ボミエガード＋', 'フールガード＋'],
    });
  });
});
