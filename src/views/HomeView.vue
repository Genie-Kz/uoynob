<script setup lang="ts">
import { computed, ref } from 'vue';
import type { RouteLocationRaw } from 'vue-router';
import { NAV_CARDS } from '@/constants/navigation';
import { useMonsters } from '@/composables/useMonsters';
import { useSkills } from '@/composables/useSkills';
import { useAsyncData } from '@/composables/useAsyncData';
import { loadAttributes } from '@/api/datasets';
import { includesKeyword } from '@/domain/textSearch';

const { monsters } = useMonsters();
const { skills } = useSkills();
const { data: attributes } = useAsyncData(loadAttributes);

const searchKeyword = ref('');
const openCardIds = ref<Record<string, boolean>>({});

/** 1グループあたりの最大表示件数 */
const MAX_PER_GROUP = 20;

interface SearchHit {
  id: string;
  label: string;
  to: RouteLocationRaw;
}
interface SearchGroup {
  type: string;
  hits: SearchHit[];
  total: number;
}

const searchGroups = computed<SearchGroup[]>(() => {
  const keyword = searchKeyword.value.trim();
  if (!keyword) return [];

  const monsterHits = (monsters.value ?? []).filter((m) => includesKeyword(m.名前, keyword));
  const traitHits = (attributes.value ?? []).filter((a) => includesKeyword(a.name, keyword));
  const skillHits = (skills.value ?? []).filter((s) => includesKeyword(s.name, keyword));

  return [
    {
      type: 'モンスター',
      total: monsterHits.length,
      hits: monsterHits.slice(0, MAX_PER_GROUP).map((m) => ({
        id: m.id,
        label: m.名前,
        to: { name: 'monster-detail', params: { id: m.id } },
      })),
    },
    {
      type: '特性',
      total: traitHits.length,
      hits: traitHits.slice(0, MAX_PER_GROUP).map((a) => ({
        id: a.id,
        label: a.name,
        to: { name: 'attribute-detail', params: { id: a.id } },
      })),
    },
    {
      type: 'スキル',
      total: skillHits.length,
      hits: skillHits.slice(0, MAX_PER_GROUP).map((s) => ({
        id: s.id,
        label: s.name,
        to: { name: 'skill-detail', params: { id: s.id } },
      })),
    },
  ].filter((group) => group.total > 0);
});

const hasResults = computed(() => searchGroups.value.length > 0);

function toggleCard(cardId: string): void {
  openCardIds.value[cardId] = !openCardIds.value[cardId];
}
</script>

<template>
  <div class="max-w-xl mx-auto">
    <div class="text-center my-4">
      <p class="text-sm text-gray-500">ドラゴンクエストモンスターズ２ イルとルカの不思議な鍵SP</p>
    </div>

    <!-- サイト内検索（モンスター・特性・スキル名）→ 各詳細ページへ直接遷移 -->
    <div class="mb-4">
      <input
        v-model="searchKeyword"
        type="text"
        placeholder="モンスター・特性・スキル名で検索"
        class="w-full border rounded px-3 py-2"
        aria-label="モンスター・特性・スキル名で検索"
      />

      <div v-if="searchKeyword.trim()" class="border rounded mt-2 divide-y">
        <p v-if="!hasResults" class="px-3 py-3 text-sm text-gray-500">該当する項目が見つかりませんでした。</p>
        <section v-for="group in searchGroups" :key="group.type" class="py-2">
          <p class="px-3 pb-1 text-xs font-bold text-gray-500">
            {{ group.type }}<span class="font-normal text-gray-400 ml-1">{{ group.total }}件</span>
          </p>
          <ul>
            <li v-for="hit in group.hits" :key="hit.id">
              <router-link :to="hit.to" class="block px-3 py-1.5 text-sm hover:bg-gray-50 app-link">
                {{ hit.label }}
              </router-link>
            </li>
          </ul>
          <p v-if="group.total > group.hits.length" class="px-3 pt-1 text-xs text-gray-400">
            ほか {{ group.total - group.hits.length }} 件（絞り込んでください）
          </p>
        </section>
      </div>
    </div>

    <!-- カテゴリ（アコーディオン。項目を押すと各ページへ遷移） -->
    <div v-for="card in NAV_CARDS" :key="card.id" class="border rounded mb-2 overflow-hidden">
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
