/** ビルドシミュレーターの計算ルールに関する定数 */
import type { BodySize } from '@/types/monster';

/** ボディサイズごとの特性枠数（ボディサイズ自身の枠を含む） */
export const TRAIT_SLOT_COUNT_BY_SIZE: Record<BodySize, number> = {
  スモールボディ: 6,
  スタンダードボディ: 6,
  メガボディ: 7,
  ギガボディ: 8,
  超ギガボディ: 9,
};

/** ボディサイズごとのスキル枠数 */
export const SKILL_SLOT_COUNT_BY_SIZE: Record<BodySize, number> = {
  スモールボディ: 3,
  スタンダードボディ: 3,
  メガボディ: 4,
  ギガボディ: 5,
  超ギガボディ: 6,
};

/** ボディサイズによる耐性ボーナス段階（状態異常系へ加算） */
export const SIZE_RESISTANCE_BONUS: Record<BodySize, number> = {
  スモールボディ: 0,
  スタンダードボディ: 0,
  メガボディ: 2,
  ギガボディ: 3,
  超ギガボディ: 4,
};

/** メガ／ギガ／超ギガボディが耐性を上げる対象（状態異常系） */
export const SIZE_AILMENT_ELEMENTS = ['ザキ', 'どく', '呪い', 'こんらん', 'マインド', 'マヒ', 'ねむり'];

/** メタル系ボディが耐性を上げる対象 */
export const METAL_BODY_AILMENT_ELEMENTS = ['どく', '呪い', 'こんらん', 'マヒ', 'ねむり'];

/** こうどう系特性が耐性を増減させる対象 */
export const KOUDOU_AILMENT_ELEMENTS = ['どく', '呪い', 'マインド', 'こんらん', 'マヒ', 'ねむり'];

/** すべての耐性を1段階上げる特性 */
export const ALL_GUARD_TRAIT = '全ガード＋';

/** メタル系ボディ特性（耐性に影響。複数持っても効果は1回のみ） */
export const METAL_BODY_TRAITS = ['メタルボディ', 'ハードメタルボディ', '超ハードメタルボディ'];

/** ライトメタルボディは耐性に影響しないが、メタル系の枠は専有する */
export const LIGHT_METAL_BODY_TRAIT = 'ライトメタルボディ';

/** こうどう系特性 → 状態異常耐性への増減段階 */
export const KOUDOU_TRAIT_DELTA: Record<string, number> = {
  こうどうおそい: 2,
  こうどうはやい: -2,
  超こうどうはやい: -4,
};

/** スキルの「〇〇ガード＋」1つあたりの耐性上昇段階 */
export const GUARD_ABILITY_BOOST_STEP = 2;

/** 武器鍛冶1枠あたりの耐性上昇段階 */
export const WEAPON_FORGE_BOOST_STEP = 1;

/** 武器鍛冶の最大枠数 */
export const WEAPON_FORGE_SLOT_COUNT = 3;
