<script setup lang="ts">
import { computed, ref } from 'vue';
import type { Monster, MonsterRank } from '@/types/monster';
import { LINEAGE_BY_NAME, MONSTER_RANKS, lineageInfoOf } from '@/constants/monsterTaxonomy';
import { LINEAGE_ICON, LINEAGE_LABEL } from '@/constants/lineageIcons';
import { includesKeywordWithReading } from '@/domain/textSearch';
import { loadSearchReadings } from '@/api/datasets';
import { useAsyncData } from '@/composables/useAsyncData';
import BodySizeIcon from './BodySizeIcon.vue';
import MonsterIcon from './MonsterIcon.vue';

const props = defineProps<{
  monsters: Monster[];
  /** 行クリックの遷移先（モンスター詳細 or シミュレーター） */
  linkRouteName: 'monster-detail' | 'simulator-build';
}>();

const keyword = ref('');
const selectedLineage = ref('');
const selectedRank = ref<MonsterRank | ''>('');
const { data: searchReadings } = useAsyncData(loadSearchReadings);
const lineageOptions = Object.entries(LINEAGE_BY_NAME).map(([value, info]) => ({
  value,
  label: info.label,
}));

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
    return true;
  });
});
</script>

<template>
  <div>
    <div class="mb-3">
      <div class="flex justify-end gap-2 mb-2">
        <select v-model="selectedLineage" class="w-28 border rounded px-2 py-2" aria-label="系統で絞り込み">
          <option value="">全系統</option>
          <option v-for="option in lineageOptions" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
        </select>
        <select v-model="selectedRank" class="w-24 border rounded px-2 py-2" aria-label="ランクで絞り込み">
          <option value="">全ランク</option>
          <option v-for="rank in MONSTER_RANKS" :key="rank" :value="rank">
            {{ rank }}
          </option>
        </select>
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
          <tr class="bg-gray-50 border-b text-left">
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
                class="w-6 h-6 inline-block"
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
