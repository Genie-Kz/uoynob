<script setup lang="ts">
import { computed, ref } from 'vue';
import type { BodySize, Monster } from '@/types/monster';
import { useMonsters } from '@/composables/useMonsters';
import { RESISTANCE_ELEMENTS, type ResistanceElement } from '@/constants/resistances';
import { collectAllTraitNames } from '@/domain/monster';
import { isEmptyCriteria, searchMonsters, type ResistanceThreshold } from '@/domain/monsterSearch';
import { includesKeywordWithReading } from '@/shared/search/textSearch';
import { loadSearchReadings } from '@/shared/data/datasets';
import { useAsyncData } from '@/composables/useAsyncData';
import {
  bodySizeOptionValue,
  bodySizeSelectOptions,
  thresholdSelectOptions,
} from '@/features/monster-search/searchOptions';
import BodySizeIcon from '@/shared/icons/BodySizeIcon.vue';
import DataState from '@/shared/ui/DataState.vue';
import IconSelect from '@/shared/ui/IconSelect.vue';
import MonsterTable from '@/features/monster-search/components/MonsterTable.vue';
import PageBreadcrumb from '@/shared/ui/PageBreadcrumb.vue';

const { monsters, isLoading, errorMessage } = useMonsters();
const { data: searchReadings } = useAsyncData(loadSearchReadings);

const selectedLevelByElement = ref<Record<ResistanceElement, number | null>>(
  Object.fromEntries(RESISTANCE_ELEMENTS.map((element) => [element, null])) as Record<
    ResistanceElement,
    number | null
  >,
);
const selectedTraits = ref<string[]>([]);
const traitKeyword = ref('');
const searchResults = ref<Monster[] | null>(null);
const searchBodySize = ref('');

const allTraitNames = computed(() => collectAllTraitNames(monsters.value ?? []));
const visibleTraitNames = computed(() => {
  const keyword = traitKeyword.value.trim();
  return keyword
    ? allTraitNames.value.filter((name) =>
        includesKeywordWithReading(name, keyword, searchReadings.value?.labels),
      )
    : allTraitNames.value;
});

const thresholds = computed<ResistanceThreshold[]>(() =>
  RESISTANCE_ELEMENTS.flatMap((element) => {
    const level = selectedLevelByElement.value[element];
    return level === null ? [] : [{ element, minLevel: level }];
  }),
);

function runSearch(): void {
  const criteria = {
    thresholds: thresholds.value,
    requiredTraits: selectedTraits.value,
    bodySize: (searchBodySize.value || null) as BodySize | null,
  };
  searchResults.value = isEmptyCriteria(criteria)
    ? []
    : searchMonsters(monsters.value ?? [], criteria);
}

function resetAll(): void {
  for (const element of RESISTANCE_ELEMENTS) selectedLevelByElement.value[element] = null;
  selectedTraits.value = [];
  searchBodySize.value = '';
  searchResults.value = null;
}

const hasCriteria = computed(() => thresholds.value.length > 0 || selectedTraits.value.length > 0);
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

      <!-- 耐性 -->
      <h3 class="font-bold mb-2">耐性を選択</h3>
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 mb-4">
        <div v-for="element in RESISTANCE_ELEMENTS" :key="element" class="text-sm">
          <span class="block text-gray-600 mb-0.5">{{ element }}</span>
          <IconSelect
            v-model="selectedLevelByElement[element]"
            :options="thresholdSelectOptions"
            :aria-label="`${element}の耐性閾値`"
          />
        </div>
      </div>

      <!-- 特性 -->
      <h3 class="font-bold mb-2">特性を選択</h3>
      <input
        v-model="traitKeyword"
        type="text"
        class="border rounded w-full px-2 py-1 mb-2"
        placeholder="特性名で絞り込み"
      />
      <div class="border rounded p-2 mb-2 max-h-60 overflow-y-auto">
        <label v-for="name in visibleTraitNames" :key="name" class="block text-sm py-0.5">
          <input v-model="selectedTraits" type="checkbox" :value="name" class="mr-1" />{{ name }}
        </label>
      </div>
      <p v-if="selectedTraits.length" class="text-sm text-gray-600 mb-3">
        選択中: {{ selectedTraits.join('、') }}
      </p>

      <div class="mb-5 flex gap-2">
        <button type="button" class="btn-primary" @click="runSearch">検索する</button>
        <button type="button" class="btn-neutral" @click="resetAll">すべてリセット</button>
      </div>

      <!-- 結果 -->
      <h3 class="font-bold mb-2">検索結果</h3>
      <p v-if="searchResults === null" class="text-gray-500">
        耐性または特性を指定して検索してください。
      </p>
      <p v-else-if="!hasCriteria" class="text-amber-700">
        耐性または特性を1つ以上指定してください。
      </p>
      <MonsterTable v-else :monsters="searchResults" link-route-name="monster-detail" />
    </DataState>

    <PageBreadcrumb
      :items="[{ label: 'ホーム', to: { name: 'home' } }, { label: 'モンスター検索' }]"
      class="mt-6"
    />
  </div>
</template>
