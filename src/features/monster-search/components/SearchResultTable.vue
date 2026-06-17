<script setup lang="ts">
import { computed, ref } from 'vue';
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
  monsters: Monster[];
}>();

// 並び替えキー。'' は既定（図鑑＝位階順）。それ以外は各ステータス。
const sortKey = ref<'' | StatKey>('');
const sortDescending = ref(true);

const sortKeyOptions = [
  { value: '', label: '既定（No.順）' },
  ...STAT_KEYS.map((key) => ({ value: key, label: key })),
];

const sortedMonsters = computed<Monster[]>(() => {
  if (sortKey.value === '') return sortMonstersByDexOrder(props.monsters);
  const key = sortKey.value;
  const direction = sortDescending.value ? -1 : 1;
  // ステータスは数値。同値は位階順で安定させてから並べ替える。
  return sortMonstersByDexOrder(props.monsters).sort(
    (a, b) => (Number(a[key]) - Number(b[key])) * direction,
  );
});
</script>

<template>
  <div>
    <div class="mb-3 flex flex-wrap items-center justify-end gap-2">
      <span class="text-sm text-gray-600">並び替え</span>
      <IconSelect
        v-model="sortKey"
        :options="sortKeyOptions"
        aria-label="並び替えるステータス"
        class="w-40"
      />
      <button
        type="button"
        class="btn-neutral !px-3 !py-2"
        :disabled="sortKey === ''"
        :aria-label="sortDescending ? '降順（大きい順）' : '昇順（小さい順）'"
        @click="sortDescending = !sortDescending"
      >
        {{ sortDescending ? '大きい順 ▼' : '小さい順 ▲' }}
      </button>
    </div>

    <p class="text-sm text-gray-500 mb-2">{{ sortedMonsters.length }} 体</p>

    <div class="overflow-x-auto">
      <table class="w-full text-sm border-collapse">
        <caption class="sr-only">
          検索結果（No.・名前・ランク・系統・サイズ）
        </caption>
        <thead>
          <tr class="table-header-row">
            <th scope="col" class="px-2 py-2 border">No.</th>
            <th scope="col" class="px-2 py-2 border">モンスター</th>
            <th scope="col" class="px-2 py-2 border">ランク</th>
            <th scope="col" class="px-2 py-2 border">系統</th>
            <th scope="col" class="px-2 py-2 border">サイズ</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="monster in sortedMonsters"
            :key="monster.id"
            class="border-b hover:bg-gray-50 [content-visibility:auto] [contain-intrinsic-size:auto_41px]"
          >
            <td class="px-3 py-2 border text-center whitespace-nowrap">
              <MonsterIcon :lineage="monster.系統" :no="monster.no" />
              <router-link
                :to="{ name: 'monster-detail', params: { id: monster.id } }"
                class="app-link ml-1"
              >
                {{ monster.no }}
              </router-link>
            </td>
            <td class="px-3 py-2 border">
              <router-link
                :to="{ name: 'monster-detail', params: { id: monster.id } }"
                class="app-link"
              >
                {{ monster.名前 }}
              </router-link>
            </td>
            <td class="px-3 py-2 border text-center">{{ monster.ランク }}</td>
            <td class="px-3 py-2 border text-center">
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
            <td class="px-3 py-2 border text-center">
              <BodySizeIcon :size="monster.サイズ特性" />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
