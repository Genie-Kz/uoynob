<script setup lang="ts">
/** モンスター検索の結果テーブル。各ステータスでの並び替えに対応する（絞り込みフォームは持たない）。 */
import { computed } from 'vue';
import type { Monster } from '@/types/monster';
import type { StatKey } from '@/types/stats';
import { lineageInfoOf } from '@/constants/monsterTaxonomy';
import { STAT_KEYS } from '@/constants/statsRules';
import { sortMonstersByDexOrder } from '@/domain/monsterFilter';
import { LINEAGE_ICON, LINEAGE_LABEL } from '@/shared/icons/lineageIcons';
import BodySizeIcon from '@/shared/icons/BodySizeIcon.vue';
import IconSelect from '@/shared/ui/IconSelect.vue';
import MonsterIcon from '@/shared/icons/MonsterIcon.vue';

const props = defineProps<{
  /** 並び替え対象のモンスター検索結果。 */
  monsters: Monster[];
}>();

/**
 * 並び替え状態は親が保持する（ページ遷移をまたいで維持するため）。
 * '' は既定（図鑑＝位階順）。それ以外は各ステータス。
 */
const sortKey = defineModel<'' | StatKey>('sortKey', { required: true });
const sortDescending = defineModel<boolean>('sortDescending', { required: true });

/** 並び替えキーの選択肢（先頭は既定の No. 順、以降は各ステータス）。 */
const sortKeyOptions = [
  { value: '', label: '既定（No.順）' },
  ...STAT_KEYS.map((key) => ({ value: key, label: key })),
];

/**
 * セレクトでキーを変えたときは、そのキーに自然な方向を既定にする
 * （ステータスは大きい順、No.順は小さい順）。トグルで反転もできる。
 */
const sortKeyProxy = computed<'' | StatKey>({
  get: () => sortKey.value,
  set: (value) => {
    sortKey.value = value;
    sortDescending.value = value !== '';
  },
});

const sortedMonsters = computed<Monster[]>(() => {
  const byDex = sortMonstersByDexOrder(props.monsters);
  if (sortKey.value === '') return sortDescending.value ? byDex.reverse() : byDex;
  const key = sortKey.value;
  const direction = sortDescending.value ? -1 : 1;
  // ステータスは数値。同値は位階順で安定させてから並べ替える。
  return byDex.sort((a, b) => (Number(a[key]) - Number(b[key])) * direction);
});
</script>

<template>
  <div>
    <div class="mb-3 flex flex-wrap items-center justify-end gap-2">
      <span class="text-sm text-gray-600">並び替え</span>
      <IconSelect
        v-model="sortKeyProxy"
        :options="sortKeyOptions"
        aria-label="並び替えるステータス"
        class="w-40"
      />
      <button
        type="button"
        class="btn-neutral !px-3 !py-2"
        :aria-label="sortDescending ? '大きい順' : '小さい順'"
        @click="sortDescending = !sortDescending"
      >
        {{ sortDescending ? '大きい順 ▼' : '小さい順 ▲' }}
      </button>
    </div>

    <p class="text-sm text-gray-500 mb-2">{{ sortedMonsters.length }} 体</p>

    <div class="overflow-x-auto rounded-lg border">
      <table class="w-full text-sm border-collapse">
        <caption class="sr-only">
          検索結果（No.・名前・ランク・系統・サイズ）
        </caption>
        <thead>
          <tr class="table-header-row">
            <th scope="col" class="px-3 py-2 font-semibold">No.</th>
            <th scope="col" class="px-3 py-2 font-semibold">モンスター</th>
            <th scope="col" class="px-3 py-2 font-semibold">ランク</th>
            <th scope="col" class="px-3 py-2 font-semibold">系統</th>
            <th scope="col" class="px-3 py-2 font-semibold">サイズ</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="monster in sortedMonsters"
            :key="monster.id"
            class="border-b last:border-0 hover:bg-gray-50 [content-visibility:auto] [contain-intrinsic-size:auto_41px]"
          >
            <td class="px-3 py-2 text-center whitespace-nowrap">
              <MonsterIcon :lineage="monster.系統" :no="monster.no" />
              <router-link
                :to="{ name: 'monster-detail', params: { id: monster.id } }"
                class="app-link ml-1"
              >
                {{ monster.no }}
              </router-link>
            </td>
            <td class="px-3 py-2">
              <router-link
                :to="{ name: 'monster-detail', params: { id: monster.id } }"
                class="app-link"
              >
                {{ monster.名前 }}
              </router-link>
            </td>
            <td class="px-3 py-2 text-center">{{ monster.ランク }}</td>
            <td class="px-3 py-2 text-center">
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
            <td class="px-3 py-2 text-center">
              <BodySizeIcon :size="monster.サイズ特性" />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
