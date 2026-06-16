import { describe, expect, it } from 'vitest';
import { computeStats, type StatsBuildConfig } from './statsCalculator';
import { createGuardSkill, createMonster } from '@/test/fixtures';
import type { Monster } from '@/types/monster';
import type { StatValues } from '@/types/stats';

function zeroIv(): StatValues {
  return { HP: 0, MP: 0, 攻撃力: 0, 守備力: 0, 素早さ: 0, 賢さ: 0 };
}

function baseConfig(monster: Monster, overrides: Partial<StatsBuildConfig> = {}): StatsBuildConfig {
  return {
    monster,
    bodySize: monster.サイズ特性,
    traits: [],
    skills: [],
    individualValues: zeroIv(),
    familyTree: Array(14).fill(null),
    parentLevelTotal: 0,
    weapon: null,
    monshouList: [],
    forgeStatUps: [],
    spTraits: new Set(),
    ...overrides,
  };
}

const monster = createMonster({
  HP: 100,
  MP: 100,
  攻撃力: 100,
  守備力: 100,
  素早さ: 100,
  賢さ: 100,
});

describe('computeStats - 基本', () => {
  it('素の状態は基礎値×1.2（スタンダード・特性なし）', () => {
    const s = computeStats(baseConfig(monster));
    expect(s.HP).toBe(120);
    expect(s.攻撃力).toBe(120);
    expect(s.賢さ).toBe(120);
  });

  it('個体値が加算される', () => {
    const s = computeStats(baseConfig(monster, { individualValues: { ...zeroIv(), HP: 50 } }));
    expect(s.HP).toBe(180); // ceil((100+50)*1.2)
  });
});

describe('computeStats - 特性倍率', () => {
  it('ボディサイズ補正（メガ HP×1.5）', () => {
    const s = computeStats(baseConfig(monster, { bodySize: 'メガボディ' }));
    expect(s.HP).toBe(180); // ceil(100*1.2*1.5)
  });

  it('AI行動回数補正（AI4回行動 ×0.6）', () => {
    const s = computeStats(baseConfig(monster, { traits: ['AI4回行動'] }));
    expect(s.HP).toBe(72); // ceil(100*1.2*0.6)
  });

  it('メタルボディはHPに倍率、守備力・素早さの補正を1にする', () => {
    const s = computeStats(
      baseConfig(monster, { bodySize: 'メガボディ', traits: ['メタルボディ', 'AI2回行動'] }),
    );
    // HP: A=ceil(100*1.2*0.72(AIメタル)*1.5(メガ))=ceil(129.6)=130, B=ceil(130/3)=44, C=44, D=44 → 44
    expect(s.HP).toBe(44);
    // 守備力: メタルでボディ・AI倍率1 → A=ceil(100*1.2*1*1)=120 → 120
    expect(s.守備力).toBe(120);
  });

  it('つねにアタックカンタはHPを0.75、SP化で無効', () => {
    expect(computeStats(baseConfig(monster, { traits: ['つねにアタックカンタ'] })).HP).toBe(90); // ceil(120*0.75)
    const sp = computeStats(
      baseConfig(monster, {
        traits: ['つねにアタックカンタ'],
        spTraits: new Set(['つねにアタックカンタ']),
      }),
    );
    expect(sp.HP).toBe(120);
  });

  it('HPバブル（スキル由来）はHP×1.5・攻撃/素早×0.5、SP化で強化', () => {
    const buon = createGuardSkill('001', 'ブオーン', ['ＨＰバブル']);
    const s = computeStats(baseConfig(monster, { skills: [buon] }));
    expect(s.HP).toBe(180); // ceil(120*1.5)
    expect(s.攻撃力).toBe(60); // ceil(120*0.5)
    const sp = computeStats(
      baseConfig(monster, { skills: [buon], spTraits: new Set(['ＨＰバブル']) }),
    );
    expect(sp.HP).toBe(240); // ceil(120*2)
    expect(sp.攻撃力).toBe(40); // ceil(120/3)
  });
});

describe('computeStats - ボーナス', () => {
  it('系統ボーナス（両親ドラゴンでHP+8%）', () => {
    const tree = Array(14).fill(null);
    tree[0] = 'ドラゴン';
    tree[1] = 'ドラゴン';
    const s = computeStats(baseConfig(monster, { familyTree: tree }));
    expect(s.HP).toBe(130); // ceil(120*1.08)=129.6→130
  });

  it('系統ボーナス合計が奇数なら偶数に切り上げ', () => {
    const tree = Array(14).fill(null);
    tree[6] = 'ドラゴン'; // 曽祖父母1%（HP1%→偶数化2%）
    const s = computeStats(baseConfig(monster, { familyTree: tree }));
    expect(s.HP).toBe(123); // ceil(120*1.02)=122.4→123
  });

  it('親レベル合計ボーナス（合計200で+5%）', () => {
    const s = computeStats(baseConfig(monster, { parentLevelTotal: 200 }));
    expect(s.HP).toBe(126); // ceil(120*1.05)
  });
});

describe('computeStats - 加算（スキル・武器・紋晶・鍛冶）', () => {
  it('スキルのパラメータ系で加算', () => {
    const skill = createGuardSkill('001', '攻撃強化', ['攻撃力＋４０']);
    expect(computeStats(baseConfig(monster, { skills: [skill] })).攻撃力).toBe(160); // ceil(120+40)
  });

  it('武器の攻撃力が加算', () => {
    const weapon = {
      no: 1,
      name: 'テスト剣',
      type: '剣',
      攻撃力: 100,
      守備力: 0,
      素早さ: 0,
      賢さ: 0,
    };
    expect(computeStats(baseConfig(monster, { weapon })).攻撃力).toBe(220); // ceil(120+100)
  });

  it('紋晶のステータスが加算', () => {
    const monshou = { name: '赤の紋晶', HP: 0, MP: 24, 攻撃力: 30, 守備力: 0, 素早さ: 0, 賢さ: 0 };
    const s = computeStats(baseConfig(monster, { monshouList: [monshou] }));
    expect(s.攻撃力).toBe(150); // ceil(120+30)
    expect(s.MP).toBe(144); // ceil(120+24)
  });

  it('武器鍛冶のステータスアップが加算', () => {
    const s = computeStats(
      baseConfig(monster, { forgeStatUps: [{ label: '素早さ+30', stat: '素早さ', value: 30 }] }),
    );
    expect(s.素早さ).toBe(150); // ceil(120+30)
  });
});
