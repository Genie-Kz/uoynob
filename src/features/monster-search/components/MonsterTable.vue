<script setup lang="ts">
/**
 * モンスター一覧表。系統/ランク/サイズ/名前で絞り込み、結果を表で表示する。
 * スクロールでフィルタが画面外に出たら、上部に追従する固定フィルタ（モバイル向け）を出す。
 */
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
  /** 表示対象のモンスター一覧。 */
  monsters: MonsterListItem[];
  /** 行クリックの遷移先（モンスター詳細 or シミュレーター） */
  linkRouteName: 'monster-detail' | 'simulator-build';
  /** 非表示にする列（ランク/系統/サイズ）。 */
  hiddenColumns?: Array<'rank' | 'lineage' | 'bodySize'>;
}>();

/** --- 絞り込みの入力値 --- */
const keyword = ref(''); // 名前キーワード
const selectedLineage = ref(''); // 系統
const selectedRank = ref(''); // ランク
const selectedBodySize = ref(''); // サイズ
/** --- 追従フィルタ（スクロール連動）用の状態 --- */
const filterPanelRef = ref<HTMLElement | null>(null); // 通常のフィルタ枠への参照（画面外判定に使う）
const stickyFiltersExpanded = ref(false); // 追従フィルタを展開しているか
const isScrolledPastFilters = ref(false); // 通常フィルタを過ぎてスクロールしたか
let scrollFrame = 0; // requestAnimationFrame の多重実行を防ぐためのフレームID
const { data: searchReadings } = useAsyncData(loadSearchReadings);
/** 系統セレクトの選択肢（先頭は「全系統」、各系統はアイコン付き）。 */
const lineageOptions = [
  { value: '', label: '全系統' },
  ...Object.entries(LINEAGE_BY_NAME).map(([value, info]) => ({
    value,
    label: info.label,
    icon: LINEAGE_ICON[value],
  })),
];
/** ランクセレクトの選択肢（先頭は「全ランク」）。 */
const rankOptions = [
  { value: '', label: '全ランク' },
  ...MONSTER_RANKS.map((rank) => ({ value: rank, label: rank })),
];
/** サイズセレクトの選択肢（先頭は「全サイズ」）。 */
const bodySizeOptions = [
  { value: '', label: '全サイズ' },
  ...BODY_SIZES.map((size) => ({ value: size, label: size })),
];

/** IconSelect の選択値を BodySize 型に変換する（BodySizeIcon に渡すため）。該当なしは null。 */
function bodySizeOptionValue(value: string | number | null): BodySize | null {
  return BODY_SIZES.find((size) => size === value) ?? null;
}

/** 選択値に対応する表示ラベルを引く（絞り込み要約の表示に使う）。 */
function selectedLabel(
  options: Array<{ value: string | number | null; label: string }>,
  value: string,
): string {
  return options.find((option) => option.value === value)?.label ?? '';
}

/** 既定で全件を No.（位階）昇順、同位階は連番昇順で表示する */
const sortedMonsters = computed(() => sortMonstersByDexOrder(props.monsters));

/** 並べ替え済みの一覧に、現在の絞り込み条件を適用した表示対象。 */
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

/** ランク・系統・サイズ別ページでは、対応するフィルタと表の列を隠す（条件が固定されているため）。 */
const showsRank = computed(() => !props.hiddenColumns?.includes('rank'));
const showsLineage = computed(() => !props.hiddenColumns?.includes('lineage'));
const showsBodySize = computed(() => !props.hiddenColumns?.includes('bodySize'));

/** 固定パネル（モバイル）のグリッド列数は、表示中のフィルタ数に合わせて詰める。 */
const visibleFilterCount = computed(
  () => [showsLineage.value, showsRank.value, showsBodySize.value].filter(Boolean).length,
);
const stickyFilterGridClass = computed(() => {
  if (visibleFilterCount.value >= 3)
    return 'grid-cols-[minmax(0,1fr)_minmax(0,0.82fr)_minmax(0,1.08fr)]';
  if (visibleFilterCount.value === 2) return 'grid-cols-2';
  return 'grid-cols-1';
});
/** スクリーンリーダー向けの表キャプション。表示中の列名を並べて作る。 */
const tableCaption = computed(() => {
  const columns = ['No.', '名前'];
  if (showsRank.value) columns.push('ランク');
  if (showsLineage.value) columns.push('系統');
  if (showsBodySize.value) columns.push('サイズ');
  return `モンスター一覧（${columns.join('・')}）`;
});

/** 現在有効な絞り込み条件をラベルの配列にする（追従フィルタの要約表示に使う）。 */
const activeFilterLabels = computed(() => {
  const labels: string[] = [];
  if (selectedLineage.value) labels.push(selectedLabel(lineageOptions, selectedLineage.value));
  if (selectedRank.value) labels.push(selectedLabel(rankOptions, selectedRank.value));
  if (selectedBodySize.value) labels.push(selectedLabel(bodySizeOptions, selectedBodySize.value));
  if (keyword.value.trim()) labels.push(`名称: ${keyword.value.trim()}`);
  return labels;
});

/** 絞り込み要約を1行のテキストにまとめたもの。 */
const filterSummary = computed(() => activeFilterLabels.value.join(' / '));

/** すべての絞り込み条件を初期化する。 */
function resetFilters(): void {
  selectedLineage.value = '';
  selectedRank.value = '';
  selectedBodySize.value = '';
  keyword.value = '';
}

/** 通常フィルタが画面外に出たかを判定し、追従フィルタの表示状態を更新する。 */
function updateStickyFilterVisibility(): void {
  const panel = filterPanelRef.value;
  if (!panel) return;
  // フィルタ枠の下端が画面より上にいったら「通り過ぎた」とみなす
  isScrolledPastFilters.value = panel.getBoundingClientRect().bottom < 0;
  // フィルタが見えている間は、追従フィルタの展開状態は閉じておく
  if (!isScrolledPastFilters.value) stickyFiltersExpanded.value = false;
}

/** スクロール毎の処理を1フレームに1回へ間引く（負荷軽減のため requestAnimationFrame でまとめる）。 */
function scheduleStickyFilterUpdate(): void {
  if (scrollFrame) return;
  scrollFrame = window.requestAnimationFrame(() => {
    scrollFrame = 0;
    updateStickyFilterVisibility();
  });
}

// マウント時に初期状態を反映し、スクロール・リサイズの監視を始める。
onMounted(() => {
  updateStickyFilterVisibility();
  window.addEventListener('scroll', scheduleStickyFilterUpdate, { passive: true });
  window.addEventListener('resize', scheduleStickyFilterUpdate);
});

// 破棄時にイベント監視と未処理のフレーム予約を後始末する（リーク防止）。
onBeforeUnmount(() => {
  window.removeEventListener('scroll', scheduleStickyFilterUpdate);
  window.removeEventListener('resize', scheduleStickyFilterUpdate);
  if (scrollFrame) window.cancelAnimationFrame(scrollFrame);
});
</script>

<template>
  <div>
    <!-- 通常のフィルタ枠（系統・ランク・サイズ・名前）。スクロールで画面外に出たら下の追従フィルタへ引き継ぐ -->
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

    <!-- 追従フィルタ。通常フィルタを過ぎてスクロールしたときだけ上部に固定表示する -->
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

    <!-- 絞り込み後の件数 -->
    <p class="text-sm text-gray-500 mb-2">{{ visibleMonsters.length }} 体</p>

    <div class="overflow-x-auto rounded-lg border">
      <table class="w-full text-sm border-collapse">
        <caption class="sr-only">
          {{
            tableCaption
          }}
        </caption>
        <thead>
          <tr class="table-header-row">
            <th scope="col" class="px-3 py-2 font-semibold">No.</th>
            <th scope="col" class="px-3 py-2 font-semibold">モンスター</th>
            <th v-if="showsRank" scope="col" class="px-3 py-2 font-semibold">ランク</th>
            <th v-if="showsLineage" scope="col" class="px-3 py-2 font-semibold">系統</th>
            <th v-if="showsBodySize" scope="col" class="px-3 py-2 font-semibold">サイズ</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="monster in visibleMonsters"
            :key="monster.id"
            class="border-b last:border-0 hover:bg-gray-50 [content-visibility:auto] [contain-intrinsic-size:auto_41px]"
          >
            <td class="px-3 py-2 text-center whitespace-nowrap">
              <MonsterIcon :lineage="monster.系統" :no="monster.no" />
              <router-link
                :to="{ name: linkRouteName, params: { id: monster.id } }"
                class="app-link ml-1"
              >
                {{ monster.no }}
              </router-link>
            </td>
            <td class="px-3 py-2">
              <router-link
                :to="{ name: linkRouteName, params: { id: monster.id } }"
                class="app-link"
              >
                {{ monster.名前 }}
              </router-link>
            </td>
            <td v-if="showsRank" class="px-3 py-2 text-center">{{ monster.ランク }}</td>
            <td v-if="showsLineage" class="px-3 py-2 text-center">
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
            <td v-if="showsBodySize" class="px-3 py-2 text-center">
              <BodySizeIcon :size="monster.サイズ特性" />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
