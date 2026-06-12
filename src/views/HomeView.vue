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
  <div class="max-w-xl mx-auto">
    <div class="text-center my-4">
      <p class="text-sm text-gray-500">ドラゴンクエストモンスターズ２ イルとルカの不思議な鍵SP</p>
    </div>

    <!-- サイト内検索（モンスター名）→ 検索結果ページへ遷移 -->
    <form class="flex mb-4" @submit.prevent="submitSearch">
      <input
        v-model="searchKeyword"
        type="text"
        placeholder="モンスター名で検索"
        class="flex-1 border rounded-l px-3 py-2"
        aria-label="モンスター名で検索"
      />
      <button type="submit" class="border border-l-0 rounded-r px-4 bg-gray-50 hover:bg-gray-100">検索</button>
    </form>

    <!-- カテゴリ（アコーディオン。項目を押すと各ページへ遷移） -->
    <div v-for="card in NAV_CARDS" :key="card.id" class="border rounded mb-2 overflow-hidden">
      <button
        type="button"
        class="group w-full flex items-center justify-between px-3 py-2 font-semibold bg-gray-50 hover:bg-gray-100"
        :aria-expanded="!!openCardIds[card.id]"
        @click="toggleCard(card.id)"
      >
        <span class="group-hover:underline">{{ card.title }}</span>
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
            <li v-for="item in card.items" :key="item.label" class="px-3 py-2 hover:bg-gray-50">
              <router-link v-if="item.to" :to="item.to" class="app-link block">{{ item.label }}</router-link>
              <span
                v-else
                class="text-gray-400 hover:underline"
                title="このデータは未提供です（本サイトはモンスターデータを収録）"
              >
                {{ item.label }}
              </span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>
