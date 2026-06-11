/** 系統・サイズ・ランクの分類に関する定数 */
import type { BodySize, MonsterRank } from '@/types/monster';

export interface LineageInfo {
  /** URLや内部識別に使うスラッグ */
  slug: string;
  /** 表示ラベル（例: "スライム系"） */
  label: string;
  /** アイコン背景色クラス（Tailwind, リテラルで保持） */
  colorClass: string;
}

/** 系統（日本語キー）→ 表示情報 */
export const LINEAGE_BY_NAME: Record<string, LineageInfo> = {
  スライム: { slug: 'slime', label: 'スライム系', colorClass: 'bg-lineage-slime' },
  ドラゴン: { slug: 'dragon', label: 'ドラゴン系', colorClass: 'bg-lineage-dragon' },
  魔獣: { slug: 'beast', label: '魔獣系', colorClass: 'bg-lineage-beast' },
  自然: { slug: 'nature', label: '自然系', colorClass: 'bg-lineage-nature' },
  悪魔: { slug: 'devil', label: '悪魔系', colorClass: 'bg-lineage-devil' },
  ゾンビ: { slug: 'zombie', label: 'ゾンビ系', colorClass: 'bg-lineage-zombie' },
  物質: { slug: 'material', label: '物質系', colorClass: 'bg-lineage-material' },
  '???': { slug: 'special', label: '？？？系', colorClass: 'bg-lineage-special' },
};

/** スラッグ → 系統名 */
export const LINEAGE_NAME_BY_SLUG: Record<string, string> = Object.fromEntries(
  Object.entries(LINEAGE_BY_NAME).map(([name, info]) => [info.slug, name]),
);

export const UNKNOWN_LINEAGE: LineageInfo = {
  slug: 'special',
  label: '？？？系',
  colorClass: 'bg-lineage-special',
};

export function lineageInfoOf(lineageName: string): LineageInfo {
  return LINEAGE_BY_NAME[lineageName] ?? UNKNOWN_LINEAGE;
}

/** ボディサイズ（小→大の順） */
export const BODY_SIZES: BodySize[] = [
  'スモールボディ', 'スタンダードボディ', 'メガボディ', 'ギガボディ', '超ギガボディ',
];

/** ボディサイズ → スラッグ */
export const BODY_SIZE_SLUG: Record<BodySize, string> = {
  スモールボディ: 'small',
  スタンダードボディ: 'standard',
  メガボディ: 'mega',
  ギガボディ: 'giga',
  超ギガボディ: 'super-giga',
};

export const BODY_SIZE_NAME_BY_SLUG: Record<string, BodySize> = Object.fromEntries(
  Object.entries(BODY_SIZE_SLUG).map(([name, slug]) => [slug, name]),
) as Record<string, BodySize>;

/** ランク（強い順） */
export const MONSTER_RANKS: MonsterRank[] = ['SS', 'S', 'A', 'B', 'C', 'D', 'E', 'F'];

/** ランク → 全角表記 */
export const RANK_FULLWIDTH_LABEL: Record<MonsterRank, string> = {
  SS: 'ＳＳ', S: 'Ｓ', A: 'Ａ', B: 'Ｂ', C: 'Ｃ', D: 'Ｄ', E: 'Ｅ', F: 'Ｆ',
};

/** モンスターが持つ「特性」を取り出すフィールド一覧 */
export const TRAIT_FIELDS = [
  '新生前特性1', '新生前特性2', '特性25', '特性50', '特性100', 'メガ特性', 'ギガ特性', '超ギガ特性',
] as const;

/** 武器の種類 */
export const WEAPONS = ['剣', 'ヤリ', 'オノ', 'ハンマー', 'ムチ', 'ツメ', '杖'] as const;
