import { describe, expect, it } from 'vitest';
import { aggregateStatBonus, parseStatAttribute, skillStatBonus } from './statBonus';
import { createGuardSkill } from '@/test/fixtures';

describe('parseStatAttribute', () => {
  it('最大ＨＰ／攻撃力などをステータスと値に分解する', () => {
    expect(parseStatAttribute('最大ＨＰ＋４')).toEqual({ stat: 'HP', value: 4 });
    expect(parseStatAttribute('最大ＭＰ＋４０')).toEqual({ stat: 'MP', value: 40 });
    expect(parseStatAttribute('攻撃力＋２０')).toEqual({ stat: '攻撃力', value: 20 });
    expect(parseStatAttribute('守備力＋８')).toEqual({ stat: '守備力', value: 8 });
    expect(parseStatAttribute('すばやさ＋１２')).toEqual({ stat: '素早さ', value: 12 });
    expect(parseStatAttribute('かしこさ＋６')).toEqual({ stat: '賢さ', value: 6 });
  });

  it('パラメータ系でなければ null', () => {
    expect(parseStatAttribute('攻撃力ギャンブル')).toBeNull();
    expect(parseStatAttribute('ＨＰバブル')).toBeNull();
    expect(parseStatAttribute('れんぞく')).toBeNull();
  });
});

describe('aggregateStatBonus / skillStatBonus', () => {
  it('名前の列挙からステータス上昇を合算する', () => {
    const total = aggregateStatBonus(['攻撃力＋８', '攻撃力＋１６', '最大ＨＰ＋４', 'れんぞく']);
    expect(total.攻撃力).toBe(24);
    expect(total.HP).toBe(4);
    expect(total.MP).toBe(0);
  });

  it('スキル構成のパラメータ系を合算する（武闘家の例）', () => {
    const butouka = createGuardSkill('001', '武闘家', ['最大ＨＰ＋４', '攻撃力＋８', '攻撃力＋１６', 'すばやさ＋１２']);
    const bonus = skillStatBonus(butouka);
    expect(bonus.HP).toBe(4);
    expect(bonus.攻撃力).toBe(24);
    expect(bonus.素早さ).toBe(12);
  });
});
