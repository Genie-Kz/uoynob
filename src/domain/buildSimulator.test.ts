import { describe, expect, it } from 'vitest';
import { computeBuildResistances, type BuildConfiguration } from './buildSimulator';
import type { ResistanceOutcome } from './buildSimulator';
import { resistanceDisplayForElement } from './resistance';
import { createGuardSkill, createMonster } from '@/test/fixtures';
import type { BodySize, Monster } from '@/types/monster';

function buildConfig(
  monster: Monster,
  overrides: Partial<BuildConfiguration> = {},
): BuildConfiguration {
  return {
    monster,
    bodySize: monster.サイズ特性,
    traits: [],
    skills: [],
    forgeElements: [],
    ...overrides,
  };
}

function outcomeOf(results: ResistanceOutcome[], element: string): ResistanceOutcome {
  const found = results.find((result) => result.element === element);
  if (!found) throw new Error(`要素が見つかりません: ${element}`);
  return found;
}

describe('computeBuildResistances - 基本', () => {
  it('何も設定しなければ元の耐性のまま', () => {
    const monster = createMonster({ メラ: '半減', ねむり: '弱点' });
    const results = computeBuildResistances(buildConfig(monster));
    expect(outcomeOf(results, 'メラ').finalValue).toBe('半減');
    expect(outcomeOf(results, 'ねむり').finalValue).toBe('弱点');
    expect(outcomeOf(results, 'メラ').changed).toBe(false);
  });

  it('全ガード＋ですべての耐性が1段階上がる', () => {
    const monster = createMonster({ メラ: '普通', イオ: '弱点' });
    const results = computeBuildResistances(buildConfig(monster, { traits: ['全ガード＋'] }));
    expect(outcomeOf(results, 'メラ').finalValue).toBe('軽減');
    expect(outcomeOf(results, 'イオ').finalValue).toBe('普通');
    expect(outcomeOf(results, 'メラ').raised).toBe(true);
  });
});

describe('computeBuildResistances - 上限ルール', () => {
  it('属性耐性はスキル等で「回復」まで上がる', () => {
    const monster = createMonster({ メラ: '無効' });
    const skill = createGuardSkill('001', 'メラ強化', ['メラガード＋']);
    const results = computeBuildResistances(
      buildConfig(monster, { traits: ['全ガード＋'], skills: [skill] }),
    );
    // 無効(5) + 全ガード(1) + メラガード＋(2) = 8 → 属性なので回復(6)止まり（反射にはならない）
    expect(outcomeOf(results, 'メラ').finalValue).toBe('回復');
  });

  it('属性以外の耐性は「無効」を超えて 無効+N まで上がる', () => {
    const monster = createMonster({ ねむり: '激減' });
    const skill = createGuardSkill('001', 'ねむり強化', ['ねむりガード＋']);
    const results = computeBuildResistances(
      buildConfig(monster, { traits: ['全ガード＋'], skills: [skill] }),
    );
    // 激減(4) + 全ガード(1) + ねむりガード＋(2) = 7 → 無効(5)+2
    const outcome = outcomeOf(results, 'ねむり');
    expect(outcome.finalLevel).toBe(7);
    expect(resistanceDisplayForElement('ねむり', outcome.finalLevel)).toBe('無効+2');
  });

  it('元々反射の耐性も下降補正で下がる（例: JOKERのねむり）', () => {
    const monster = createMonster({ ねむり: '反射' });
    // こうどうはやい は ねむり を -2 するため、反射(7) → 無効(5)
    const results = computeBuildResistances(buildConfig(monster, { traits: ['こうどうはやい'] }));
    const outcome = outcomeOf(results, 'ねむり');
    expect(outcome.finalLevel).toBe(5);
    expect(outcome.finalValue).toBe('無効');
    expect(outcome.changed).toBe(true);
    expect(outcome.raised).toBe(false);
    expect(resistanceDisplayForElement('ねむり', outcome.finalLevel, true)).toBe('無効');
  });

  it('下降した反射耐性への武器鍛冶は確定後の段階から1だけ上げる', () => {
    const monster = createMonster({ ねむり: '反射' });
    // 反射(7) + こうどうはやい(-2) = 無効(5)、そこから鍛冶+1で回復(6)
    const results = computeBuildResistances(
      buildConfig(monster, { traits: ['こうどうはやい'], forgeElements: ['ねむり'] }),
    );
    const outcome = outcomeOf(results, 'ねむり');
    expect(outcome.finalLevel).toBe(6);
    expect(outcome.finalValue).toBe('回復');
  });

  it('非属性で元々「回復」のものは 無効+1 と表記される', () => {
    const monster = createMonster({ ねむり: '回復' });
    const results = computeBuildResistances(buildConfig(monster));
    const outcome = outcomeOf(results, 'ねむり');
    expect(outcome.finalLevel).toBe(6);
    expect(resistanceDisplayForElement('ねむり', outcome.finalLevel)).toBe('無効+1');
  });
});

describe('computeBuildResistances - 武器鍛冶+1の特殊仕様', () => {
  it('弱点の負の蓄積を無視して、最後に一段階引き上げる', () => {
    const monster = createMonster({ ねむり: '弱点' });
    // こうどうはやい(-2)で弱点をさらに下回るが、鍛冶+1は確定後の弱点から一段階上げる
    const results = computeBuildResistances(
      buildConfig(monster, { traits: ['こうどうはやい'], forgeElements: ['ねむり'] }),
    );
    expect(outcomeOf(results, 'ねむり').finalValue).toBe('普通');
  });
});

describe('computeBuildResistances - 下限・負の蓄積', () => {
  it('弱点を下回ると蓄積され、上回るまで弱点のまま', () => {
    const monster = createMonster({ マインド: '弱点' });
    // こうどうはやい(-2) のみ → 弱点-2 → 弱点表示
    const onlyHayai = computeBuildResistances(buildConfig(monster, { traits: ['こうどうはやい'] }));
    expect(outcomeOf(onlyHayai, 'マインド').finalValue).toBe('弱点');

    // こうどうはやい(-2) + マインドガード＋×2(+4) → -2+4=2 → 軽減
    const nebuta = createGuardSkill('001', 'ねぶた魂', ['マインドガード＋', 'マインドガード＋']);
    const withSkill = computeBuildResistances(
      buildConfig(monster, { traits: ['こうどうはやい'], skills: [nebuta] }),
    );
    expect(outcomeOf(withSkill, 'マインド').finalValue).toBe('軽減');
  });
});

describe('computeBuildResistances - 各補正', () => {
  it('ボディサイズ補正は素の値（スタンダード基準）に選択サイズの補正をそのまま加算', () => {
    const standard = createMonster({ サイズ特性: 'スタンダードボディ', ザキ: '普通' });
    const asMega = computeBuildResistances(
      buildConfig(standard, { bodySize: 'メガボディ' as BodySize }),
    );
    // ザキは状態異常系。メガ(+2) → 普通(1)+2=3=半減
    expect(outcomeOf(asMega, 'ザキ').finalValue).toBe('半減');

    // 元々メガのモンスターも、素データはスタンダード基準なので +2 が乗る
    const naturalMega = createMonster({ サイズ特性: 'メガボディ', ザキ: '普通' });
    const keepMega = computeBuildResistances(buildConfig(naturalMega));
    expect(outcomeOf(keepMega, 'ザキ').finalValue).toBe('半減');

    // スタンダードのままなら補正0
    const keepStandard = computeBuildResistances(buildConfig(standard));
    expect(outcomeOf(keepStandard, 'ザキ').finalValue).toBe('普通');
  });

  it('スキルのガード＋は重複で+4になる', () => {
    const monster = createMonster({ 炎: '普通' });
    const dosanko = createGuardSkill('001', 'どさんこソウル', [
      '炎ブレスガード＋',
      '炎ブレスガード＋',
    ]);
    const results = computeBuildResistances(buildConfig(monster, { skills: [dosanko] }));
    // 炎は属性。普通(1)+4=5=無効
    expect(outcomeOf(results, '炎').finalValue).toBe('無効');
  });

  it('武器鍛冶は別々の耐性に+1（重複は1回扱い）', () => {
    const monster = createMonster({ メラ: '普通', ギラ: '半減' });
    const results = computeBuildResistances(
      buildConfig(monster, { forgeElements: ['メラ', 'メラ', 'ギラ'] }),
    );
    expect(outcomeOf(results, 'メラ').finalValue).toBe('軽減'); // 重複しても+1のみ
    expect(outcomeOf(results, 'ギラ').finalValue).toBe('激減');
  });

  it('メタル系ボディは複数持っても効果は1回のみ', () => {
    const monster = createMonster({ どく: '普通' });
    const results = computeBuildResistances(
      buildConfig(monster, { traits: ['メタルボディ', 'ハードメタルボディ'] }),
    );
    // どくは +1 のみ → 軽減
    expect(outcomeOf(results, 'どく').finalValue).toBe('軽減');
  });

  it('こうどうおそいは状態異常系を+2する', () => {
    const monster = createMonster({ どく: '普通', マインド: '普通', メラ: '普通' });
    const results = computeBuildResistances(buildConfig(monster, { traits: ['こうどうおそい'] }));
    expect(outcomeOf(results, 'どく').finalValue).toBe('半減'); // +2
    expect(outcomeOf(results, 'マインド').finalValue).toBe('半減'); // +2
    expect(outcomeOf(results, 'メラ').finalValue).toBe('普通'); // 対象外
  });
});
