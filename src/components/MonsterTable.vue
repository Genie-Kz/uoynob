<script setup lang="ts">
import { computed, ref } from 'vue';
import type { Monster } from '@/types/monster';
import { lineageInfoOf } from '@/constants/monsterTaxonomy';
import { LINEAGE_ICON, LINEAGE_LABEL } from '@/constants/lineageIcons';
import { includesKeyword } from '@/domain/textSearch';
import MonsterIcon from './MonsterIcon.vue';

const props = defineProps<{
  monsters: Monster[];
  /** 行クリックの遷移先（モンスター詳細 or シミュレーター） */
  linkRouteName: 'monster-detail' | 'simulator-build';
}>();

const keyword = ref('');

// 既定で全件を No.（位階）昇順、同位階は連番昇順で表示する
const sortedMonsters = computed(() =>
  [...props.monsters].sort((a, b) => a.位階 - b.位階 || a.variant - b.variant),
);

const visibleMonsters = computed(() => {
  const query = keyword.value.trim();
  if (!query) return sortedMonsters.value;
  return sortedMonsters.value.filter(
    (monster) =>
      includesKeyword(monster.名前, query) ||
      includesKeyword(lineageInfoOf(monster.系統).label, query) ||
      includesKeyword(monster.ランク, query),
  );
});
</script>

<template>
  <div>
    <input
      v-model="keyword"
      type="text"
      class="border rounded w-full px-3 py-2 mb-3"
      placeholder="モンスター名・系統・ランクで絞り込み"
    />
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
            <td class="px-2 py-1 border whitespace-nowrap">
              <MonsterIcon :lineage="monster.系統" :no="monster.no" />
              <router-link
                :to="{ name: linkRouteName, params: { id: monster.id } }"
                class="app-link ml-1"
              >
                {{ monster.no }}
              </router-link>
            </td>
            <td class="px-2 py-1 border">
              <router-link :to="{ name: linkRouteName, params: { id: monster.id } }" class="app-link">
                {{ monster.名前 }}
              </router-link>
            </td>
            <td class="px-2 py-1 border">{{ monster.ランク }}</td>
            <td class="px-2 py-1 border">
              <img
                v-if="LINEAGE_ICON[monster.系統]"
                :src="LINEAGE_ICON[monster.系統]"
                :alt="LINEAGE_LABEL[monster.系統] ?? monster.系統"
                :title="LINEAGE_LABEL[monster.系統] ?? monster.系統"
                class="w-6 h-6 inline-block"
              />
              <span v-else>{{ lineageInfoOf(monster.系統).label }}</span>
            </td>
            <td class="px-2 py-1 border">{{ monster.サイズ特性 }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
