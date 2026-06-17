<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
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
const filterPanelRef = ref<HTMLElement | null>(null);
const stickyFiltersExpanded = ref(false);
const isScrolledPastFilters = ref(false);
let scrollFrame = 0;
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

function selectedLabel(
  options: Array<{ value: string | number | null; label: string }>,
  value: string,
): string {
  return options.find((option) => option.value === value)?.label ?? '';
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

// ランク・系統・サイズ別ページでは、対応するフィルタと表の列を隠す（条件が固定されているため）。
const showsRank = computed(() => !props.hiddenColumns?.includes('rank'));
const showsLineage = computed(() => !props.hiddenColumns?.includes('lineage'));
const showsBodySize = computed(() => !props.hiddenColumns?.includes('bodySize'));

// 固定パネル（モバイル）のグリッド列数は、表示中のフィルタ数に合わせて詰める。
const visibleFilterCount = computed(
  () => [showsLineage.value, showsRank.value, showsBodySize.value].filter(Boolean).length,
);
const stickyFilterGridClass = computed(() => {
  if (visibleFilterCount.value >= 3)
    return 'grid-cols-[minmax(0,1fr)_minmax(0,0.82fr)_minmax(0,1.08fr)]';
  if (visibleFilterCount.value === 2) return 'grid-cols-2';
  return 'grid-cols-1';
});
const tableCaption = computed(() => {
  const columns = ['No.', '名前'];
  if (showsRank.value) columns.push('ランク');
  if (showsLineage.value) columns.push('系統');
  if (showsBodySize.value) columns.push('サイズ');
  return `モンスター一覧（${columns.join('・')}）`;
});

const activeFilterLabels = computed(() => {
  const labels: string[] = [];
  if (selectedLineage.value) labels.push(selectedLabel(lineageOptions, selectedLineage.value));
  if (selectedRank.value) labels.push(selectedLabel(rankOptions, selectedRank.value));
  if (selectedBodySize.value) labels.push(selectedLabel(bodySizeOptions, selectedBodySize.value));
  if (keyword.value.trim()) labels.push(`名称: ${keyword.value.trim()}`);
  return labels;
});

const filterSummary = computed(() => activeFilterLabels.value.join(' / '));

function resetFilters(): void {
  selectedLineage.value = '';
  selectedRank.value = '';
  selectedBodySize.value = '';
  keyword.value = '';
}

function updateStickyFilterVisibility(): void {
  const panel = filterPanelRef.value;
  if (!panel) return;
  isScrolledPastFilters.value = panel.getBoundingClientRect().bottom < 0;
  if (!isScrolledPastFilters.value) stickyFiltersExpanded.value = false;
}

function scheduleStickyFilterUpdate(): void {
  if (scrollFrame) return;
  scrollFrame = window.requestAnimationFrame(() => {
    scrollFrame = 0;
    updateStickyFilterVisibility();
  });
}

onMounted(() => {
  updateStickyFilterVisibility();
  window.addEventListener('scroll', scheduleStickyFilterUpdate, { passive: true });
  window.addEventListener('resize', scheduleStickyFilterUpdate);
});

onBeforeUnmount(() => {
  window.removeEventListener('scroll', scheduleStickyFilterUpdate);
  window.removeEventListener('resize', scheduleStickyFilterUpdate);
  if (scrollFrame) window.cancelAnimationFrame(scrollFrame);
});
</script>

<template>
  <div>
    <div ref="filterPanelRef" class="mb-3">
      <div class="flex flex-nowrap justify-end gap-1 sm:gap-2 mb-2">
        <IconSelect
          v-if="showsLineage"
          v-model="selectedLineage"
          :options="lineageOptions"
          aria-label="系統で絞り込み"
          class="w-28 shrink-0 max-[360px]:w-[5.5rem] sm:w-36"
        />
        <IconSelect
          v-if="showsRank"
          v-model="selectedRank"
          :options="rankOptions"
          aria-label="ランクで絞り込み"
          class="w-24 shrink-0 max-[360px]:w-20 sm:w-28"
        />
        <IconSelect
          v-if="showsBodySize"
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

    <div
      v-if="isScrolledPastFilters"
      class="sticky top-0 z-30 -mx-1 mb-3 rounded border bg-white/95 p-2 shadow-sm backdrop-blur"
    >
      <div class="flex items-center gap-2">
        <button
          type="button"
          class="btn-neutral shrink-0 !px-3 !py-2"
          :aria-expanded="stickyFiltersExpanded"
          @click="stickyFiltersExpanded = !stickyFiltersExpanded"
        >
          絞り込み
        </button>
        <p v-if="activeFilterLabels.length" class="min-w-0 flex-1 truncate text-sm text-gray-600">
          {{ filterSummary }}
        </p>
        <span v-else class="min-w-0 flex-1" aria-hidden="true"></span>
        <button
          v-if="activeFilterLabels.length"
          type="button"
          class="btn-neutral shrink-0 !px-3 !py-2"
          @click="resetFilters"
        >
          解除
        </button>
      </div>

      <div v-if="stickyFiltersExpanded" class="mt-2">
        <div>
          <div
            class="grid gap-1 sm:flex sm:flex-nowrap sm:justify-end sm:gap-2 mb-2 pt-1"
            :class="stickyFilterGridClass"
          >
            <IconSelect
              v-if="showsLineage"
              v-model="selectedLineage"
              :options="lineageOptions"
              aria-label="系統で絞り込み"
              class="min-w-0 sm:w-36 sm:shrink-0"
            />
            <IconSelect
              v-if="showsRank"
              v-model="selectedRank"
              :options="rankOptions"
              aria-label="ランクで絞り込み"
              class="min-w-0 sm:w-28 sm:shrink-0"
            />
            <IconSelect
              v-if="showsBodySize"
              v-model="selectedBodySize"
              :options="bodySizeOptions"
              aria-label="ボディサイズで絞り込み"
              class="min-w-0 sm:w-40 sm:shrink-0"
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
      </div>
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
