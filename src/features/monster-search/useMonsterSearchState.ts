/**
 * モンスター検索画面の状態を、ページ遷移をまたいで保持するためのストア。
 * モジュールレベルの singleton なので、詳細ページへ遷移して戻っても
 * 検索条件・検索結果・並び替え・スクロール位置が維持される。
 */
import { ref } from 'vue';
import type { Monster } from '@/types/monster';
import type { StatKey } from '@/types/stats';
import { RESISTANCE_ELEMENTS, type ResistanceElement } from '@/constants/resistances';

function emptyLevels(): Record<ResistanceElement, number | null> {
  return Object.fromEntries(RESISTANCE_ELEMENTS.map((element) => [element, null])) as Record<
    ResistanceElement,
    number | null
  >;
}

// 耐性の閾値選択
const selectedLevelByElement = ref<Record<ResistanceElement, number | null>>(emptyLevels());
// 特性スロット（初期3行）。空文字は未選択。
const traitSlots = ref<string[]>(['', '', '']);
// 本来のサイズ特性での絞り込み（空文字＝指定なし）
const requiredOriginalBodySize = ref('');
// 検索時のボディサイズ（変換）
const searchBodySize = ref('');
// 検索結果。null は未検索。
const searchResults = ref<Monster[] | null>(null);
// 並び替え（'' は既定＝No.順）と方向
const sortKey = ref<'' | StatKey>('');
const sortDescending = ref(false);
// 詳細ページから戻ったときに復元するスクロール位置
const scrollY = ref(0);

export function useMonsterSearchState() {
  return {
    selectedLevelByElement,
    traitSlots,
    requiredOriginalBodySize,
    searchBodySize,
    searchResults,
    sortKey,
    sortDescending,
    scrollY,
    resetResistance(): void {
      selectedLevelByElement.value = emptyLevels();
    },
  };
}
