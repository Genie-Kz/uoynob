<script setup lang="ts">
import { useMonsters } from '@/composables/useMonsters';
import { useScrollRestore } from '@/composables/useScrollRestore';
import { BODY_SIZES } from '@/constants/monsterTaxonomy';
import { RESISTANCE_ELEMENTS } from '@/constants/resistances';
import { collectAllTraitNames } from '@/domain/monster';
import { isEmptyCriteria, searchMonsters, type ResistanceThreshold } from '@/domain/monsterSearch';
import SearchResultTable from '@/features/monster-search/components/SearchResultTable.vue';
import {
  bodySizeOptionValue,
  bodySizeSelectOptions,
  thresholdSelectOptions,
} from '@/features/monster-search/searchOptions';
import { useMonsterSearchState } from '@/features/monster-search/useMonsterSearchState';
import { traitPickerItems } from '@/features/simulator/simulatorViewModel';
import { previousRouteName } from '@/router';
import BodySizeIcon from '@/shared/icons/BodySizeIcon.vue';
import DataState from '@/shared/ui/DataState.vue';
import FormSkeleton from '@/shared/ui/FormSkeleton.vue';
import FilterModal from '@/shared/ui/FilterModal.vue';
import IconSelect from '@/shared/ui/IconSelect.vue';
import PageBreadcrumb from '@/shared/ui/PageBreadcrumb.vue';
import PickerModal from '@/shared/ui/PickerModal.vue';
import type { BodySize } from '@/types/monster';
import { computed, ref } from 'vue';

const { monsters, isLoading, errorMessage } = useMonsters();

// ページ遷移をまたいで保持する検索状態（詳細ページから戻っても維持される）。
const {
  selectedLevelByElement,
  traitSlots,
  requiredOriginalBodySize,
  searchBodySize,
  searchResults,
  sortKey,
  sortDescending,
  resetResistance,
  resetAll,
} = useMonsterSearchState();

// モンスター詳細から来たときだけ検索状態を復元し、それ以外の経路から来たときは
// 初期化された状態で表示する。（setup 時点で直前ルートが確定している）
if (previousRouteName.value !== 'monster-detail') resetAll();

const originalBodySizeOptions = [
  { value: '', label: '指定なし' },
  ...BODY_SIZES.map((size) => ({ value: size, label: size })),
];

const resistanceModalOpen = ref(false);
const traitModalOpen = ref(false);
const traitPicker = ref<{ open: boolean; index: number }>({ open: false, index: 0 });
// 詳細ページから戻ったときのスクロール位置復元は、他の一覧画面と同じ共通処理に委ねる。
// 復元し終えるまで本文を隠してちらつき（上→保存位置への飛び）を防ぐ点も共通化されている。
const { restoring } = useScrollRestore();

const allTraitNames = computed(() => collectAllTraitNames(monsters.value ?? []));
const traitOptions = computed(() => traitPickerItems(allTraitNames.value));

const thresholds = computed<ResistanceThreshold[]>(() =>
  RESISTANCE_ELEMENTS.flatMap((element) => {
    const level = selectedLevelByElement.value[element];
    return level === null ? [] : [{ element, minLevel: level }];
  }),
);
// スロットから重複・空を除いた検索対象の特性。
const requiredTraits = computed(() => [
  ...new Set(traitSlots.value.map((name) => name.trim()).filter(Boolean)),
]);

// 条件が1つでも指定されていれば検索可能。すべて空なら検索ボタンを非活性にする。
const canSearch = computed(
  () =>
    thresholds.value.length > 0 ||
    requiredTraits.value.length > 0 ||
    requiredOriginalBodySize.value !== '',
);

function thresholdLabel(level: number | null): string {
  return thresholdSelectOptions.find((option) => option.value === level)?.label ?? '';
}
const resistanceSummary = computed(() => {
  const parts = RESISTANCE_ELEMENTS.flatMap((element) => {
    const level = selectedLevelByElement.value[element];
    return level === null ? [] : [`${element} ${thresholdLabel(level)}`];
  });
  return parts.length ? parts.join('、') : '未設定';
});
const traitSummary = computed(() => {
  const parts: string[] = [];
  if (requiredOriginalBodySize.value) parts.push(`サイズ特性: ${requiredOriginalBodySize.value}`);
  if (requiredTraits.value.length) parts.push(requiredTraits.value.join('、'));
  return parts.length ? parts.join(' / ') : '未設定';
});

function runSearch(): void {
  const criteria = {
    thresholds: thresholds.value,
    requiredTraits: requiredTraits.value,
    bodySize: (searchBodySize.value || null) as BodySize | null,
    originalBodySize: (requiredOriginalBodySize.value || null) as BodySize | null,
  };
  searchResults.value = isEmptyCriteria(criteria)
    ? []
    : searchMonsters(monsters.value ?? [], criteria);
  resistanceModalOpen.value = false;
  traitModalOpen.value = false;
}

function clearResistance(): void {
  resetResistance();
}
function clearTraits(): void {
  traitSlots.value = ['', '', ''];
  requiredOriginalBodySize.value = '';
}
function addTraitSlot(): void {
  traitSlots.value.push('');
}
function openTraitPicker(index: number): void {
  traitPicker.value = { open: true, index };
}
function handleTraitPick(value: string): void {
  traitSlots.value[traitPicker.value.index] = value;
  traitPicker.value.open = false;
}
</script>

<template>
  <div :style="restoring ? { visibility: 'hidden' } : undefined">
    <PageBreadcrumb
      :items="[{ label: 'ホーム', to: { name: 'home' } }, { label: 'モンスター検索' }]"
    />
    <h2 class="text-xl font-bold mb-1">モンスター検索</h2>

    <DataState :is-loading="isLoading" :error-message="errorMessage">
      <template #skeleton>
        <FormSkeleton />
      </template>
      <h3 class="font-bold mb-2">検索時のボディサイズ</h3>
      <IconSelect
        v-model="searchBodySize"
        :options="bodySizeSelectOptions"
        aria-label="検索時のボディサイズ"
        class="w-full sm:w-64 mb-2"
      >
        <template #icon="{ option }">
          <BodySizeIcon
            v-if="bodySizeOptionValue(option.value)"
            :size="bodySizeOptionValue(option.value)!"
          />
        </template>
      </IconSelect>
      <p class="text-sm text-gray-500 mb-4">
        デフォルトサイズでは本来のサイズ、それ以外では全モンスターを選択したサイズにしたときの耐性・特性を検索します。
      </p>

      <!-- 耐性・特性の設定（モーダルを開く） -->
      <div class="grid gap-3 sm:grid-cols-2 mb-4">
        <div class="border rounded p-3">
          <div class="flex items-center justify-between mb-1">
            <h3 class="font-bold">耐性</h3>
            <button type="button" class="btn-outline-primary" @click="resistanceModalOpen = true">
              設定
            </button>
          </div>
          <p class="text-sm text-gray-600 break-words">{{ resistanceSummary }}</p>
        </div>
        <div class="border rounded p-3">
          <div class="flex items-center justify-between mb-1">
            <h3 class="font-bold">特性</h3>
            <button type="button" class="btn-outline-primary" @click="traitModalOpen = true">
              設定
            </button>
          </div>
          <p class="text-sm text-gray-600 break-words">{{ traitSummary }}</p>
        </div>
      </div>

      <!-- 結果 -->
      <h3 v-if="searchResults !== null" class="font-bold mb-2">検索結果</h3>
      <!-- 未検索（null）のときは何も出さない。SearchResultTable の v-else に null を渡さないための受け皿 -->
      <template v-if="searchResults === null" />
      <p v-else-if="!searchResults.length" class="text-gray-500">
        条件に合うモンスターはいません。
      </p>
      <SearchResultTable
        v-else
        v-model:sort-key="sortKey"
        v-model:sort-descending="sortDescending"
        :monsters="searchResults"
      />
    </DataState>

    <PageBreadcrumb
      :items="[{ label: 'ホーム', to: { name: 'home' } }, { label: 'モンスター検索' }]"
      class="mt-6"
    />

    <!-- スマホでは下部のサイト内検索（紛らわしい「検索」ボタン）が初期表示に入らないよう、
         本文の下に余白を取ってスクロールするまで見えないようにする。 -->
    <div class="h-[70vh] sm:hidden" aria-hidden="true"></div>

    <!-- 耐性モーダル -->
    <FilterModal
      :open="resistanceModalOpen"
      title="耐性を選択"
      :can-search="canSearch"
      @clear="clearResistance"
      @close="resistanceModalOpen = false"
      @search="runSearch"
    >
      <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
        <div v-for="element in RESISTANCE_ELEMENTS" :key="element" class="text-sm">
          <span class="block text-gray-600 mb-0.5">{{ element }}</span>
          <IconSelect
            v-model="selectedLevelByElement[element]"
            :options="thresholdSelectOptions"
            :aria-label="`${element}の耐性閾値`"
          />
        </div>
      </div>
    </FilterModal>

    <!-- 特性モーダル -->
    <FilterModal
      :open="traitModalOpen"
      title="特性を選択"
      :can-search="canSearch"
      @clear="clearTraits"
      @close="traitModalOpen = false"
      @search="runSearch"
    >
      <div class="mb-3">
        <span class="block text-sm font-bold mb-1">ボディサイズ特性（本来のサイズ）</span>
        <IconSelect
          v-model="requiredOriginalBodySize"
          :options="originalBodySizeOptions"
          aria-label="本来のボディサイズ特性で絞り込み"
          class="w-full sm:w-64"
        >
          <template #icon="{ option }">
            <BodySizeIcon
              v-if="bodySizeOptionValue(option.value)"
              :size="bodySizeOptionValue(option.value)!"
            />
          </template>
        </IconSelect>
      </div>

      <span class="block text-sm font-bold mb-1">特性</span>
      <ul class="border rounded divide-y">
        <li
          v-for="(trait, index) in traitSlots"
          :key="index"
          class="flex items-center justify-between gap-2 px-3 py-2"
        >
          <span :class="{ 'text-gray-400': !trait }">{{ trait || '（空き）' }}</span>
          <button type="button" class="btn-outline-primary" @click="openTraitPicker(index)">
            選択
          </button>
        </li>
      </ul>
      <div class="mt-3">
        <button type="button" class="btn-neutral" @click="addTraitSlot">スロットを追加</button>
      </div>
    </FilterModal>

    <!-- 特性スロットの選択ピッカー（特性モーダルの上に重ねて表示） -->
    <PickerModal
      :open="traitPicker.open"
      title="特性を選択"
      :items="traitOptions"
      :current="traitSlots[traitPicker.index] ?? ''"
      @select="handleTraitPick"
      @close="traitPicker.open = false"
    />
  </div>
</template>
