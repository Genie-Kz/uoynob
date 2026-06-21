<script setup lang="ts">
/**
 * スキル・特性などが参照するモンスター（{id, name}）を、アイコン付きのタグリンク列で表示する。
 * 図鑑のモンスター一覧で参照idを解決し、見つかればアイコン＋名前の詳細リンクを、
 * 見つからなければ名前だけのタグを表示する。複数の詳細ページで同じ表示を使うため共通化している。
 */
import { computed } from 'vue';
import type { MonsterListItem } from '@/types/monster';
import { createMonsterResolver } from '@/domain/skillLookup';
import MonsterIcon from '@/shared/icons/MonsterIcon.vue';

const props = defineProps<{
  /** 表示するモンスター参照（スキル/特性データ側の {id, name}）。 */
  monsterRefs: { id: string; name: string }[];
  /** 参照idの解決とアイコン情報（系統・no）の取得に使う、図鑑の軽量モンスター一覧。 */
  monsterList: MonsterListItem[];
}>();

/** 参照id → モンスター情報 の解決関数。アイコン（系統・no）と詳細リンク（id）に使う。 */
const resolve = computed(() => createMonsterResolver(props.monsterList));

/** 各参照を、解決済みモンスター（あれば）とともに表示用へ展開する。 */
const items = computed(() =>
  props.monsterRefs.map((monsterRef) => ({ monsterRef, monster: resolve.value(monsterRef.id) })),
);
</script>

<template>
  <div class="flex flex-wrap gap-1">
    <template v-for="{ monsterRef, monster } in items" :key="monsterRef.id">
      <!-- 図鑑にいるモンスターはアイコン＋名前の詳細リンク -->
      <router-link
        v-if="monster"
        :to="{ name: 'monster-detail', params: { id: monster.id } }"
        class="tag-link app-link inline-flex items-center gap-1"
      >
        <MonsterIcon :lineage="monster.系統" :no="monster.no" />
        {{ monsterRef.name }}
      </router-link>
      <!-- 図鑑に見つからない参照は、アイコン無しで名前だけのタグにする -->
      <span v-else class="tag-link text-gray-600">{{ monsterRef.name }}</span>
    </template>
    <span v-if="!monsterRefs.length" class="text-gray-500">なし</span>
  </div>
</template>
