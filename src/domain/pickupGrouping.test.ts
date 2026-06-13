import { describe, expect, it } from 'vitest';
import { createGuardSkill } from '@/test/fixtures';
import { groupPickupSkills, isGroupedSkillPickup } from './pickupGrouping';

describe('groupPickupSkills - 耐性スキル', () => {
  const items = [
    { id: '001', name: '炎を守るスキル' },
    { id: '002', name: '吹雪を守るスキル' },
  ];
  const skills = [
    createGuardSkill('001', '炎を守るスキル', ['炎ブレスガード＋']),
    createGuardSkill('002', '吹雪を守るスキル', ['吹雪ブレスガード＋']),
  ];

  it.each([
    'skill-resistance-spell',
    'skill-resistance-breath',
    'skill-resistance-condition',
    'skill-resistance-seal',
    'skill-resistance-weaken',
  ])('%sをガード特性ごとに分類する', (key) => {
    expect(isGroupedSkillPickup(key)).toBe(true);
    expect(groupPickupSkills(key, items, skills)).toEqual([
      { label: '炎ブレスガード＋', items: [{ id: '001', name: '炎を守るスキル' }] },
      { label: '吹雪ブレスガード＋', items: [{ id: '002', name: '吹雪を守るスキル' }] },
    ]);
  });
});
