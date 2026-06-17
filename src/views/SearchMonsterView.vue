<script setup lang="ts">
import { computed, ref } from 'vue';
import type { BodySize, Monster } from '@/types/monster';
import { useMonsters } from '@/composables/useMonsters';
import { RESISTANCE_ELEMENTS, type ResistanceElement } from '@/constants/resistances';
import { collectAllTraitNames } from '@/domain/monster';
import { isEmptyCriteria, searchMonsters, type ResistanceThreshold } from '@/domain/monsterSearch';
import { traitPickerItems } from '@/features/simulator/simulatorViewModel';
import {
  bodySizeOptionValue,
  bodySizeSelectOptions,
  thresholdSelectOptions,
} from '@/features/monster-search/searchOptions';
import BodySizeIcon from '@/shared/icons/BodySizeIcon.vue';
import DataState from '@/shared/ui/DataState.vue';
import IconSelect from '@/shared/ui/IconSelect.vue';
import FilterModal from '@/shared/ui/FilterModal.vue';
import PickerModal from '@/shared/ui/PickerModal.vue';
import SearchResultTable from '@/features/monster-search/components/SearchResultTable.vue';
import PageBreadcrumb from '@/shared/ui/PageBreadcrumb.vue';

const { monsters, isLoading, errorMessage } = useMonsters();

const selectedLevelByElement = ref<Record<ResistanceElement, number | null>>(
  Object.fromEntries(RESISTANCE_ELEMENTS.map((element) => [element, null])) as Record<
    ResistanceElement,
    number | null
  >,
);
// 特性スロット（初期3行）。空文字は未選択。
const traitSlots = ref<string[]>(['', '', '']);
const searchBodySize = ref('');
const searchResults = ref<Monster[] | null>(null);

const resistanceModalOpen = ref(false);
const traitModalOpen = ref(false);
const traitPicker = ref<{ open: boolean; index: number }>({ open: false, index: 0 });

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

// 条件が1つでも指定されていれば検索可能。どちらも空なら検索ボタンを非活性にする。
const canSearch = computed(() => thresholds.value.length > 0 || requiredTraits.value.length > 0);

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
const traitSummary = computed(() =>
  requiredTraits.value.length ? requiredTraits.value.join('、') : '未設定',
);

function runSearch(): void {
  const criteria = {
    thresholds: thresholds.value,
    requiredTraits: requiredTraits.value,
    bodySize: (searchBodySize.value || null) as BodySize | null,
  };
  searchResults.value = isEmptyCriteria(criteria)
    ? []
    : searchMonsters(monsters.value ?? [], criteria);
  resistanceModalOpen.value = false;
  traitModalOpen.value = false;
}

function clearResistance(): void {
  for (const element of RESISTANCE_ELEMENTS) selectedLevelByElement.value[element] = null;
}
function clearTraits(): void {
  traitSlots.value = ['', '', ''];
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
  <div>
    <PageBreadcrumb
      :items="[{ label: 'ホーム', to: { name: 'home' } }, { label: 'モンスター検索' }]"
    />
    <h2 class="text-xl font-bold mb-1">モンスター検索</h2>
    <p class="text-sm text-gray-500 mb-4">
      モンスターを耐性・特性から検索します。「○○↑」は、その耐性以上（より強い）モンスターを対象にします。
    </p>

    <DataState :is-loading="isLoading" :error-message="errorMessage">
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
      <h3 class="font-bold mb-2">検索結果</h3>
      <p v-if="searchResults === null" class="text-gray-500">
        「耐性」または「特性」を設定し、モーダル内の検索ボタンを押してください。
      </p>
      <p v-else-if="!searchResults.length" class="text-gray-500">
        条件に合うモンスターはいません。
      </p>
      <SearchResultTable v-else :monsters="searchResults" />
    </DataState>

    <PageBreadcrumb
      :items="[{ label: 'ホーム', to: { name: 'home' } }, { label: 'モンスター検索' }]"
      class="mt-6"
    />

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
