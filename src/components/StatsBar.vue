<script setup lang="ts">
import { ref } from 'vue';
import type { StatKey, StatValues } from '@/types/stats';
import { STAT_KEYS } from '@/constants/statsRules';

defineProps<{ stats: StatValues | null }>();

/** 初期状態は展開。折りたたみ可能。 */
const expanded = ref(true);

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
        class="w-full flex items-center justify-between mb-1"
        :aria-expanded="expanded"
        @click="expanded = !expanded"
      >
        <span class="text-xs font-bold text-gray-600">ステータス</span>
        <span class="text-xs text-gray-500">{{ expanded ? '閉じる ▼' : '開く ▲' }}</span>
      </button>

      <div v-show="expanded" class="grid grid-cols-3 sm:grid-cols-6 gap-2 text-sm">
        <div
          v-for="key in STAT_KEYS"
          :key="key"
          class="flex items-center justify-between gap-1 border rounded px-2 py-1"
        >
          <span class="text-gray-500 text-xs">{{ SHORT_LABEL[key] }}</span>
          <span class="font-bold">{{ display(stats, key) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
