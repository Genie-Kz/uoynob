/** サイドナビの構成を宣言的に定義 */
import type { RouteLocationRaw } from 'vue-router';
import {
  BODY_SIZES,
  BODY_SIZE_SLUG,
  LINEAGE_BY_NAME,
  MONSTER_RANKS,
  RANK_FULLWIDTH_LABEL,
} from './monsterTaxonomy';

export interface NavItem {
  label: string;
  /** 遷移先。未指定の項目は「データ未提供」として無効表示する。 */
  to?: RouteLocationRaw;
}

export interface NavCard {
  id: string;
  title: string;
  items: NavItem[];
}

const rankItems: NavItem[] = MONSTER_RANKS.map((rank) => ({
  label: RANK_FULLWIDTH_LABEL[rank],
  to: { name: 'monster-list', query: { rank: rank.toLowerCase() } },
}));

const lineageItems: NavItem[] = Object.values(LINEAGE_BY_NAME).map((lineage) => ({
  label: lineage.label,
  to: { name: 'monster-list', query: { lineage: lineage.slug } },
}));

const bodySizeItems: NavItem[] = BODY_SIZES.map((size) => ({
  label: size,
  to: { name: 'monster-list', query: { size: BODY_SIZE_SLUG[size] } },
}));

export const NAV_CARDS: NavCard[] = [
  {
    id: 'monster',
    title: 'モンスター',
    items: [{ label: 'すべて', to: { name: 'monster-list' } }, ...rankItems, ...lineageItems, ...bodySizeItems],
  },
  {
    id: 'attribute',
    title: '特性',
    items: [
      { label: 'すべて', to: { name: 'attribute-list' } },
      { label: '特性効果系', to: { name: 'attribute-list', query: { cat: 'effect' } } },
      { label: 'パラメータ系', to: { name: 'attribute-list', query: { cat: 'parameter' } } },
      { label: '耐性系', to: { name: 'attribute-list', query: { cat: 'resistance' } } },
    ],
  },
  {
    id: 'ability',
    title: '特技',
    items: [
      { label: 'すべて', to: { name: 'ability-list' } },
      { label: '呪文', to: { name: 'ability-list', query: { cat: 'spell' } } },
      { label: '斬撃', to: { name: 'ability-list', query: { cat: 'slash' } } },
      { label: '体技', to: { name: 'ability-list', query: { cat: 'physical' } } },
      { label: '踊り', to: { name: 'ability-list', query: { cat: 'dance' } } },
      { label: 'ブレス・ふえ', to: { name: 'ability-list', query: { cat: 'breath' } } },
      { label: 'その他', to: { name: 'ability-list', query: { cat: 'other' } } },
    ],
  },
  {
    id: 'skill',
    title: 'スキル',
    items: [
      { label: 'すべて', to: { name: 'skill-list' } },
      { label: '特技系', to: { name: 'skill-list', query: { category: 'ability' } } },
      { label: 'パラメータ系', to: { name: 'skill-list', query: { category: 'parameter' } } },
    ],
  },
  {
    id: 'pickup',
    title: 'ピックアップ',
    items: [
      { label: '転生モンスター', to: { name: 'pickup', params: { pickupKey: 'monster-reincarnation' } } },
      { label: 'ご当地スキル', to: { name: 'pickup', params: { pickupKey: 'skill-local' } } },
      { label: 'キラー系スキル', to: { name: 'pickup', params: { pickupKey: 'skill-killer' } } },
      { label: '呪文耐性スキル', to: { name: 'pickup', params: { pickupKey: 'skill-resistance-spell' } } },
      { label: 'ブレス耐性スキル', to: { name: 'pickup', params: { pickupKey: 'skill-resistance-breath' } } },
      { label: '状態耐性スキル', to: { name: 'pickup', params: { pickupKey: 'skill-resistance-condition' } } },
      { label: '封じ耐性スキル', to: { name: 'pickup', params: { pickupKey: 'skill-resistance-seal' } } },
      { label: '弱体耐性スキル', to: { name: 'pickup', params: { pickupKey: 'skill-resistance-weaken' } } },
      { label: 'パラメータ上昇スキル', to: { name: 'pickup', params: { pickupKey: 'skill-parameter-up' } } },
      { label: 'れんぞく回数', to: { name: 'pickup', params: { pickupKey: 'number-of-consecutive-times' } } },
    ],
  },
  {
    id: 'tool',
    title: 'ツール',
    items: [
      { label: 'ビルドシミュレーター', to: { name: 'simulator-select' } },
      { label: 'モンスター検索', to: { name: 'search-monster' } },
    ],
  },
];
