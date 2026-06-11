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
    items: [{ label: 'すべて' }, { label: '特性効果系' }, { label: 'パラメータ系' }, { label: '耐性系' }],
  },
  {
    id: 'ability',
    title: '特技',
    items: [
      { label: 'すべて' }, { label: '呪文' }, { label: '斬撃' }, { label: '体技' },
      { label: '踊り' }, { label: 'ブレス・ふえ' }, { label: 'その他' },
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
      { label: '転生モンスター' }, { label: 'ご当地スキル' }, { label: 'キラー系スキル' },
      { label: '呪文耐性スキル' }, { label: 'ブレス耐性スキル' }, { label: '状態耐性スキル' },
      { label: '封じ耐性スキル' }, { label: '弱体耐性スキル' }, { label: 'パラメータ上昇スキル' }, { label: 'れんぞく回数' },
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
