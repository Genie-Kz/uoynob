import type { MonsterRank } from '@/types/monster';

const EXACT_COSTS: Record<string, number> = {
  みかわしアップ: -4,
  アンチみかわしアップ: -4,
  会心出やすい: -2,
  ひん死で会心: -4,
  呪文会心出やすい: -2,
  ひん死で呪文会心: -4,
  れんぞく: -6,
  会心かんぜんガード: 3,
  こうどうはやい: 2,
  超こうどうはやい: 2,
  こうどうおそい: -2,
  ロケットスタート: -1,
  先手ハンター: -1,
  負けずぎらい: 0,
  ラッキー: -2,
  魔神攻撃: -4,
  カウンター: 0,
  ギャンブルカウンター: 0,
  ヒートアップ: -4,
  しっぺがえし: -2,
  受け流し: -2,
  スモールボディ: 0,
  スタンダードボディ: 0,
  メガボディ: 0,
  ギガボディ: 0,
  超ギガボディ: 0,
  どくどくボディ: -4,
  ビリビリボディ: -2,
  マホキテボディ: -4,
  タメキテボディ: -4,
  やいばのボディ: -2,
  ギャンブルボディ: 0,
  メタルハンター: -6,
  メタルキラー: -4,
  スタンダードキラー: -1,
  ギガキラー: -1,
  ライトメタルボディ: -2,
  メタルボディ: 2,
  ハードメタルボディ: 2,
  超ハードメタルボディ: 2,
  自動ＭＰ回復: -3,
  自動ＨＰ回復: -3,
  つねにマホカンタ: 3,
  つねにアタックカンタ: 3,
  どく攻撃: -4,
  マホトラ攻撃: -4,
  タメトラ攻撃: -4,
  わるぐち: 2,
  おうえん: 2,
  ぼやき: 2,
  ラブリー: 2,
  ギロギロ: 2,
  いあつ: 2,
  プレッシャー: 2,
  秘めたるチカラ: 2,
  くじけぬ心: -2,
  てんしのきまぐれ: -2,
  亡者の執念: 2,
  最後のあがき: -2,
  根に持つタイプ: 0,
  最後の息吹: -1,
  ねがえり: -4,
  たいでんたいしつ: -4,
  きょうせんし: -4,
  ふくつのとうし: -4,
  一族のほこり: -4,
  光のはどう: 2,
  いてつくはどう: 2,
  やみのはどう: 0,
  クスリのちしき: -2,
  ツッコミ: -2,
  かばう: -6,
  一発逆転: -4,
  全ガードブレイク: 2,
  強ガードブレイク: 2,
  超ガードブレイク: 2,
  大剣豪: 2,
  大賢者: 2,
  格闘王: 2,
  神の息吹: 2,
  神の踊り手: 1,
  '全ガード＋': 2,
  暴走機関: 2,
  いきなりテンション: 1,
  いきなりバイキルト: 2,
  いきなりスカラ: 2,
  いきなりピオラ: 0,
  いきなりインテ: 2,
  いきなり黒い霧: 2,
  いきなり白い霧: 2,
  いきなり赤い霧: 2,
  いきなり冥界の霧: 0,
  いきなりリバース: 4,
  いきなりシャッフル: -2,
  ときどきテンション: 0,
  ときどきバイキルト: 0,
  ときどきスカラ: 0,
  ときどきピオラ: -2,
  ときどきインテ: 0,
  ときどき黒い霧: 2,
  ときどき白い霧: 2,
  ときどき赤い霧: 2,
  ときどき冥界の霧: 2,
  ときどきリバース: 2,
  ときどきシャッフル: -2,
  まれにハイテンション: 0,
  まれにマジックバリア: 0,
  まれにまもりの霧: 0,
  星のいかり: -2,
  星のまもり: -2,
  星のおくりもの: -2,
  スイーツカーニバル: 1,
  ＨＰギャンブル: -6,
  ＭＰギャンブル: -6,
  攻撃力ギャンブル: -6,
  守備力ギャンブル: -6,
  すばやさギャンブル: -6,
  かしこさギャンブル: -6,
  にげあし: -8,
  経験値増: -8,
  ゴールド増: -8,
  'アイテム％アップ': -8,
  'スカウト％アップ': -8,
  'スカウト％アップＳ': -8,
  にくをきらせて: 0,
  ノリノリ: 1,
  れいせい: 0,
  ながばなし: 1,
  切り込み隊長: 1,
  いきなりマホトーン: 0,
  ライダー: 2,
  おいろけ: 2,
  めざめのいやし: 0,
  吹雪呼び: 0,
  がんばりや: 0,
  しれいとう: 2,
  バーニングハート: 2,
  きりがくれ: 0,
  だましうち: 1,
  まりょくのさざめき: 2,
};

const MONTO_BRAVE_TRAITS = ['ゆうかん', 'さいごのきぼう'] as const;

function normalizeTraitName(name: string): string {
  return name.replace(/\s+/g, '').replace(/HP/g, 'ＨＰ').replace(/MP/g, 'ＭＰ').replace(/%/g, '％');
}

/** 特性単体のデメリット指数。個別値不明のモントナー特例はここでは0。 */
export function disadvantageCostOfTrait(name: string): number {
  const normalized = normalizeTraitName(name);
  const exact = EXACT_COSTS[normalized];
  if (exact !== undefined) return exact;
  if (/^AI\d(?:～\d)?回行動$/.test(normalized)) return -3;
  if (normalized.endsWith('攻撃')) return -2;
  if (normalized.endsWith('のコツ')) return 3;
  if (normalized.endsWith('ブレイク')) return -2;
  return 0;
}

/** スキル由来を除いた、装備中の特性だけからデメリット指数合計を求める。 */
export function totalDisadvantageCost(traits: string[], monsterName = ''): number {
  const normalizedTraits = traits.filter(Boolean).map(normalizeTraitName);
  let total = normalizedTraits.reduce((sum, trait) => sum + disadvantageCostOfTrait(trait), 0);
  const hasBravePair = MONTO_BRAVE_TRAITS.every((trait) => normalizedTraits.includes(trait));
  if (monsterName === 'モントナー(ゆうかん)' && hasBravePair) total += 2;
  return total;
}

const DISADVANTAGES_BY_RANK: Record<'low' | 'c' | 'mid' | 'high', Record<number, string[]>> = {
  low: {
    1: ['自動ＭＰダウン'],
    2: ['ちょうはつ'],
    3: ['オロオロ'],
    4: ['自動ＭＰダウン'],
    5: ['ちょうはつ', 'オロオロ'],
  },
  c: {
    1: ['自動ＭＰダウン'],
    2: ['ダメージ増ボディ'],
    3: ['ヘロヘロ'],
    4: ['自動ＭＰダウン', 'ヘロヘロ'],
    5: ['ダメージ増ボディ', 'ヘロヘロ'],
  },
  mid: {
    1: ['しょうひＭＰ✕２'],
    2: ['ダメージ増ボディ'],
    3: ['ヘロヘロ'],
    4: ['しょうひＭＰ✕２', '強者のよゆう'],
    5: ['ダメージ増ボディ', 'ヘロヘロ'],
  },
  high: {
    1: ['しょうひＭＰ✕２'],
    2: ['アンラッキー'],
    3: ['強者のよゆう'],
    4: ['しょうひＭＰ✕２', '強者のよゆう'],
    5: ['アンラッキー', '強者のよゆう'],
  },
};

function rankGroup(rank: MonsterRank): keyof typeof DISADVANTAGES_BY_RANK {
  if (rank === 'F' || rank === 'E' || rank === 'D') return 'low';
  if (rank === 'C') return 'c';
  if (rank === 'B' || rank === 'A') return 'mid';
  return 'high';
}

/** ランクと指数合計から付与される不利な特性を返す。 */
export function disadvantageTraits(rank: MonsterRank, totalCost: number): string[] {
  if (totalCost <= 0) return [];
  if (totalCost >= 6) return ['ヘロヘロ', '強者のよゆう'];
  return DISADVANTAGES_BY_RANK[rankGroup(rank)][totalCost] ?? [];
}
