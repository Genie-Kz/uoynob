import { describe, expect, it } from 'vitest';
import { createMonster } from '@/test/fixtures';
import { createPickupSkillGroupViews } from './pickupViewModel';

describe('pickupViewModel', () => {
  it('ご当地スキルの分類には神将モンスターアイコン用の情報を付ける', () => {
    const shinsho = createMonster({ 名前: '神将ベニヒ', no: '217' });
    const groups = createPickupSkillGroupViews(
      'skill-local',
      [{ label: '神将ベニヒ', items: [{ id: '001', name: 'どさんこソウル' }] }],
      [shinsho],
    );

    expect(groups?.[0].iconMonster?.no).toBe('217');
  });

  it('ご当地以外の分類には神将アイコンを付けない', () => {
    const shinsho = createMonster({ 名前: '神将ベニヒ', no: '217' });
    const groups = createPickupSkillGroupViews(
      'skill-killer',
      [{ label: '神将ベニヒ', items: [{ id: '001', name: 'どさんこソウル' }] }],
      [shinsho],
    );

    expect(groups?.[0].iconMonster).toBeNull();
  });
});
