<script setup lang="ts">
import { computed, ref } from 'vue';
import type { BodySize, MonsterListItem } from '@/types/monster';
import {
  BODY_SIZES,
  LINEAGE_BY_NAME,
  MONSTER_RANKS,
  lineageInfoOf,
} from '@/constants/monsterTaxonomy';
import { LINEAGE_ICON, LINEAGE_LABEL } from '@/shared/icons/lineageIcons';
import { filterMonstersByControls, sortMonstersByDexOrder } from '@/domain/monsterFilter';
import { loadSearchReadings } from '@/shared/data/datasets';
import { useAsyncData } from '@/composables/useAsyncData';
import BodySizeIcon from '@/shared/icons/BodySizeIcon.vue';
import IconSelect from '@/shared/ui/IconSelect.vue';
import MonsterIcon from '@/shared/icons/MonsterIcon.vue';

const props = defineProps<{
  monsters: MonsterListItem[];
  /** 行クリックの遷移先（モンスター詳細 or シミュレーター） */
  linkRouteName: 'monster-detail' | 'simulator-build';
  hiddenColumns?: Array<'rank' | 'lineage' | 'bodySize'>;
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
const sortedMonsters = computed(() => sortMonstersByDexOrder(props.monsters));

const visibleMonsters = computed(() =>
  filterMonstersByControls(
    sortedMonsters.value,
    {
      keyword: keyword.value,
      lineage: selectedLineage.value,
      rank: selectedRank.value,
      bodySize: selectedBodySize.value,
    },
    searchReadings.value?.labels,
  ),
);

const showsRank = computed(() => !props.hiddenColumns?.includes('rank'));
const showsLineage = computed(() => !props.hiddenColumns?.includes('lineage'));
const showsBodySize = computed(() => !props.hiddenColumns?.includes('bodySize'));
const tableCaption = computed(() => {
  const columns = ['No.', '名前'];
  if (showsRank.value) columns.push('ランク');
  if (showsLineage.value) columns.push('系統');
  if (showsBodySize.value) columns.push('サイズ');
  return `モンスター一覧（${columns.join('・')}）`;
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
            <BodySizeIcon
              v-if="bodySizeOptionValue(option.value)"
              :size="bodySizeOptionValue(option.value)!"
            />
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
        <caption class="sr-only">
          {{
            tableCaption
          }}
        </caption>
        <thead>
          <tr class="table-header-row">
            <th scope="col" class="px-2 py-2 border">No.</th>
            <th scope="col" class="px-2 py-2 border">モンスター</th>
            <th v-if="showsRank" scope="col" class="px-2 py-2 border">ランク</th>
            <th v-if="showsLineage" scope="col" class="px-2 py-2 border">系統</th>
            <th v-if="showsBodySize" scope="col" class="px-2 py-2 border">サイズ</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="monster in visibleMonsters"
            :key="monster.id"
            class="border-b hover:bg-gray-50 [content-visibility:auto] [contain-intrinsic-size:auto_41px]"
          >
            <td class="px-3 py-2 border text-center whitespace-nowrap">
              <MonsterIcon :lineage="monster.系統" :no="monster.no" />
              <router-link
                :to="{ name: linkRouteName, params: { id: monster.id } }"
                class="app-link ml-1"
              >
                {{ monster.no }}
              </router-link>
            </td>
            <td class="px-3 py-2 border">
              <router-link
                :to="{ name: linkRouteName, params: { id: monster.id } }"
                class="app-link"
              >
                {{ monster.名前 }}
              </router-link>
            </td>
            <td v-if="showsRank" class="px-3 py-2 border text-center">{{ monster.ランク }}</td>
            <td v-if="showsLineage" class="px-3 py-2 border text-center">
              <img
                v-if="LINEAGE_ICON[monster.系統]"
                :src="LINEAGE_ICON[monster.系統]"
                :alt="LINEAGE_LABEL[monster.系統] ?? monster.系統"
                :title="LINEAGE_LABEL[monster.系統] ?? monster.系統"
                width="24"
                height="24"
                loading="lazy"
                decoding="async"
                class="inline-block size-6 max-w-none object-contain align-middle"
              />
              <span v-else>{{ lineageInfoOf(monster.系統).label }}</span>
            </td>
            <td v-if="showsBodySize" class="px-3 py-2 border text-center">
              <BodySizeIcon :size="monster.サイズ特性" />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
