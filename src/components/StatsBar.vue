<script setup lang="ts">
import { ref } from 'vue';
import type { StatKey, StatValues } from '@/types/stats';
import { STAT_KEYS } from '@/constants/statsRules';

defineProps<{ stats: StatValues | null }>();

const expanded = ref(false);

const COLLAPSED_KEYS: StatKey[] = ['HP', '攻撃力', '守備力'];
const SHORT_LABEL: Record<StatKey, string> = {
  HP: 'HP',
  MP: 'MP',
  攻撃力: '攻撃',
  守備力: '守備',
  素早さ: '素早',
  賢さ: '賢さ',
};

function display(stats: StatValues | null, key: StatKey): string {
  return stats ? String(stats[key]) : '-';
}
</script>

<template>
  <div class="fixed inset-x-0 bottom-0 z-40 border-t bg-white/95 shadow-[0_-2px_10px_rgba(0,0,0,0.08)] backdrop-blur">
    <div class="max-w-5xl mx-auto px-3 py-2">
      <button
        type="button"
        class="w-full flex items-center justify-between"
        :aria-expanded="expanded"
        @click="expanded = !expanded"
      >
        <div class="flex gap-4 text-sm">
          <span v-for="key in COLLAPSED_KEYS" :key="key">
            <span class="text-gray-500">{{ SHORT_LABEL[key] }}</span>
            <span class="font-bold ml-1">{{ display(stats, key) }}</span>
          </span>
        </div>
        <span class="text-xs text-gray-500">{{ expanded ? '閉じる ▼' : 'ステータス ▲' }}</span>
      </button>

      <div v-if="expanded" class="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2 text-sm">
        <div v-for="key in STAT_KEYS" :key="key" class="flex justify-between border rounded px-3 py-1.5">
          <span class="text-gray-500">{{ SHORT_LABEL[key] }}</span>
          <span class="font-bold">{{ display(stats, key) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
