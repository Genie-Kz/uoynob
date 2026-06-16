<script setup lang="ts">
import { computed, ref } from 'vue';
import type { BodySize, Monster } from '@/types/monster';
import { BODY_SIZES, LINEAGE_BY_NAME, MONSTER_RANKS, lineageInfoOf } from '@/constants/monsterTaxonomy';
import { LINEAGE_ICON, LINEAGE_LABEL } from '@/shared/icons/lineageIcons';
import { includesKeywordWithReading } from '@/shared/search/textSearch';
import { loadSearchReadings } from '@/shared/data/datasets';
import { useAsyncData } from '@/composables/useAsyncData';
import BodySizeIcon from '@/shared/icons/BodySizeIcon.vue';
import IconSelect from '@/shared/ui/IconSelect.vue';
import MonsterIcon from '@/shared/icons/MonsterIcon.vue';

const props = defineProps<{
  monsters: Monster[];
  /** 行クリックの遷移先（モンスター詳細 or シミュレーター） */
  linkRouteName: 'monster-detail' | 'simulator-build';
}>();

const keyword = ref('');
const selectedLineage = ref('');
const selectedRank = ref('');
const selectedBodySize = ref('');
const { data: searchReadings } = useAsyncData(loadSearchReadings);
const lineageOptions = [
  { value: '', label: '全系統' },
  ...Object.entries(LINEAGE_BY_NAME).map(([value, info]) => ({
    value,
    label: info.label,
    icon: LINEAGE_ICON[value],
  })),
];
const rankOptions = [
  { value: '', label: '全ランク' },
  ...MONSTER_RANKS.map((rank) => ({ value: rank, label: rank })),
];
const bodySizeOptions = [
  { value: '', label: '全サイズ' },
  ...BODY_SIZES.map((size) => ({ value: size, label: size })),
];

function bodySizeOptionValue(value: string | number | null): BodySize | null {
  return BODY_SIZES.find((size) => size === value) ?? null;
}

// 既定で全件を No.（位階）昇順、同位階は連番昇順で表示する
const sortedMonsters = computed(() =>
  [...props.monsters].sort((a, b) => a.位階 - b.位階 || a.variant - b.variant),
);

const visibleMonsters = computed(() => {
  const query = keyword.value.trim();
  return sortedMonsters.value.filter((monster) => {
    if (query && !includesKeywordWithReading(monster.名前, query, searchReadings.value?.labels)) {
      return false;
    }
    if (selectedLineage.value && monster.系統 !== selectedLineage.value) return false;
    if (selectedRank.value && monster.ランク !== selectedRank.value) return false;
    if (selectedBodySize.value && monster.サイズ特性 !== selectedBodySize.value) return false;
    return true;
  });
});
</script>

<template>
  <div>
    <div class="mb-3">
      <div class="flex flex-nowrap justify-end gap-1 sm:gap-2 mb-2">
        <IconSelect
          v-model="selectedLineage"
          :options="lineageOptions"
          aria-label="系統で絞り込み"
          class="w-28 shrink-0 max-[360px]:w-[5.5rem] sm:w-36"
        />
        <IconSelect
          v-model="selectedRank"
          :options="rankOptions"
          aria-label="ランクで絞り込み"
          class="w-24 shrink-0 max-[360px]:w-20 sm:w-28"
        />
        <IconSelect
          v-model="selectedBodySize"
          :options="bodySizeOptions"
          aria-label="ボディサイズで絞り込み"
          class="w-32 shrink-0 max-[360px]:w-[6rem] sm:w-40"
        >
          <template #icon="{ option }">
            <BodySizeIcon v-if="bodySizeOptionValue(option.value)" :size="bodySizeOptionValue(option.value)!" />
          </template>
        </IconSelect>
      </div>
      <input
        v-model="keyword"
        type="text"
        class="w-full border rounded px-3 py-2"
        placeholder="モンスター名で絞り込み"
      />
    </div>
    <p class="text-sm text-gray-500 mb-2">{{ visibleMonsters.length }} 体</p>

    <div class="overflow-x-auto">
      <table class="w-full text-sm border-collapse">
        <thead>
          <tr class="table-header-row">
            <th class="px-2 py-2 border">No.</th>
            <th class="px-2 py-2 border">モンスター</th>
            <th class="px-2 py-2 border">ランク</th>
            <th class="px-2 py-2 border">系統</th>
            <th class="px-2 py-2 border">サイズ</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="monster in visibleMonsters" :key="monster.id" class="border-b hover:bg-gray-50">
            <td class="px-3 py-2 border whitespace-nowrap">
              <MonsterIcon :lineage="monster.系統" :no="monster.no" />
              <router-link
                :to="{ name: linkRouteName, params: { id: monster.id } }"
                class="app-link ml-1"
              >
                {{ monster.no }}
              </router-link>
            </td>
            <td class="px-3 py-2 border">
              <router-link :to="{ name: linkRouteName, params: { id: monster.id } }" class="app-link">
                {{ monster.名前 }}
              </router-link>
            </td>
            <td class="px-3 py-2 border">{{ monster.ランク }}</td>
            <td class="px-3 py-2 border">
              <img
                v-if="LINEAGE_ICON[monster.系統]"
                :src="LINEAGE_ICON[monster.系統]"
                :alt="LINEAGE_LABEL[monster.系統] ?? monster.系統"
                :title="LINEAGE_LABEL[monster.系統] ?? monster.系統"
                class="inline-block size-6 max-w-none object-contain align-middle"
              />
              <span v-else>{{ lineageInfoOf(monster.系統).label }}</span>
            </td>
            <td class="px-3 py-2 border text-center">
              <BodySizeIcon :size="monster.サイズ特性" />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
