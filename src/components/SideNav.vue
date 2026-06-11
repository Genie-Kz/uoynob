<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { NAV_CARDS } from '@/constants/navigation';

const router = useRouter();
const searchKeyword = ref('');
const openCardIds = ref<Record<string, boolean>>({});

function submitSearch(): void {
  const keyword = searchKeyword.value.trim();
  if (!keyword) return;
  router.push({ name: 'monster-list', query: { q: keyword } });
}

function toggleCard(cardId: string): void {
  openCardIds.value[cardId] = !openCardIds.value[cardId];
}
</script>

<template>
  <nav class="my-2">
    <!-- サイト内検索（モンスター名） -->
    <form class="flex mb-3" @submit.prevent="submitSearch">
      <input
        v-model="searchKeyword"
        type="text"
        placeholder="モンスター名で検索"
        class="flex-1 border rounded-l px-2 py-1 text-sm"
        aria-label="モンスター名で検索"
      />
      <button type="submit" class="border border-l-0 rounded-r px-3 text-sm bg-gray-50 hover:bg-gray-100">
        検索
      </button>
    </form>

    <!-- カテゴリ（アコーディオン。開くと各項目が縦1行ずつなめらかに表示される） -->
    <div v-for="card in NAV_CARDS" :key="card.id" class="border rounded mb-2 overflow-hidden">
      <button
        type="button"
        class="w-full flex items-center justify-between px-3 py-2 font-semibold bg-gray-50 hover:bg-gray-100"
        :aria-expanded="!!openCardIds[card.id]"
        @click="toggleCard(card.id)"
      >
        <span>{{ card.title }}</span>
        <span
          class="text-xs text-gray-500 transition-transform duration-200"
          :class="{ 'rotate-180': openCardIds[card.id] }"
        >
          ▼
        </span>
      </button>

      <div class="collapsible" :class="{ 'is-open': openCardIds[card.id] }">
        <div class="collapsible-inner">
          <ul class="divide-y border-t">
            <li v-for="item in card.items" :key="item.label" class="px-3 py-2">
              <router-link v-if="item.to" :to="item.to" class="app-link block">{{ item.label }}</router-link>
              <span v-else class="text-gray-400" title="このデータは未提供です（本サイトはモンスターデータを収録）">
                {{ item.label }}
              </span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </nav>
</template>
