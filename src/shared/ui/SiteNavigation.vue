<script setup lang="ts">
// サイト内メニュー。サイト内検索フォームと、分類ごとに折りたためるリンクカード群を表示する。
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { NAV_CARDS } from '@/constants/navigation';

const router = useRouter();
// サイト内検索の入力値。
const searchKeyword = ref('');
// カードID → 開いているか。各カードの開閉状態を保持する。
const openCardIds = ref<Record<string, boolean>>({});

// 検索を実行する。空入力のときは何もしない。
function submitSearch(): void {
  const keyword = searchKeyword.value.trim();
  // 空白だけ／未入力なら遷移しない
  if (!keyword) return;
  void router.push({ name: 'site-search', query: { q: keyword } });
}

// 指定カードの開閉を反転する。
function toggleCard(cardId: string): void {
  openCardIds.value[cardId] = !openCardIds.value[cardId];
}
</script>

<template>
  <nav aria-label="サイト内メニュー">
    <!-- サイト内検索フォーム -->
    <form class="flex gap-2 mb-4" @submit.prevent="submitSearch">
      <input
        v-model="searchKeyword"
        type="search"
        placeholder="サイト内を検索"
        class="min-w-0 flex-1 border rounded px-3 py-2"
        aria-label="サイト内を検索"
      />
      <button type="submit" class="btn-primary">検索</button>
    </form>

    <!-- 分類ごとのリンクカード。見出しをタップで開閉する -->
    <div v-for="card in NAV_CARDS" :key="card.id" class="border rounded mb-2 overflow-hidden">
      <!-- カード見出し。開いていると右の▼が180°回転する -->
      <button
        type="button"
        class="group w-full flex items-center justify-between px-3 py-2 font-semibold bg-gray-50 hover:bg-gray-100"
        :aria-expanded="!!openCardIds[card.id]"
        @click="toggleCard(card.id)"
      >
        <span class="group-hover:underline group-active:underline">{{ card.title }}</span>
        <span
          class="text-xs text-gray-500 transition-transform duration-200"
          :class="{ 'rotate-180': openCardIds[card.id] }"
        >
          ▼
        </span>
      </button>

      <!-- 開閉でなめらかに高さが変わる中身 -->
      <div class="collapsible" :class="{ 'is-open': openCardIds[card.id] }">
        <div class="collapsible-inner">
          <ul class="divide-y border-t">
            <li v-for="item in card.items" :key="item.label" class="px-3 py-2 hover:bg-gray-50">
              <!-- to があればリンク。無い項目は未提供データなので淡色の文字で示す -->
              <router-link v-if="item.to" :to="item.to" class="app-link block">{{
                item.label
              }}</router-link>
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
  </nav>
</template>
