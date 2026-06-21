<script setup lang="ts">
/**
 * 詳細ページ向けの読み込み中スケルトン。
 * 図鑑・スキル・特技・特性などで共通する「ヘッダー＋本文セクション＋タグ群」の
 * だいたいの高さを先に確保し、データ到着時のレイアウト移動を抑える。
 */
import Skeleton from '@/shared/ui/Skeleton.vue';

withDefaults(
  defineProps<{
    /** モンスター詳細のように左にアイコン枠を持つヘッダーなら true。 */
    icon?: boolean;
    /** 見出し＋本文ブロックをいくつ表示するか。 */
    sections?: number;
    /** タグ状リンク群のプレースホルダを表示するか。 */
    tags?: boolean;
  }>(),
  { icon: false, sections: 2, tags: true },
);
</script>

<template>
  <div>
    <!-- 詳細ヘッダー。実データのカードと同じ余白・枠で高さを合わせる。 -->
    <div class="mb-4 flex items-center rounded border p-4">
      <Skeleton v-if="icon" class="size-12 shrink-0 rounded" />
      <div :class="icon ? 'ml-3 flex-1' : 'flex-1'">
        <Skeleton class="mb-2 h-7 w-44 max-w-full" />
        <div class="flex flex-wrap gap-1">
          <Skeleton class="h-5 w-16" />
          <Skeleton class="h-5 w-20" />
          <Skeleton class="h-5 w-24" />
        </div>
      </div>
    </div>

    <!-- 本文セクション。見出しと複数行テキスト/リストの高さを先に置く。 -->
    <div v-for="section in sections" :key="section" class="mb-4">
      <Skeleton class="mb-2 h-6 w-32" />
      <div class="rounded border p-3">
        <Skeleton class="mb-2 h-4 w-full" />
        <Skeleton class="mb-2 h-4 w-5/6" />
        <Skeleton class="h-4 w-2/3" />
      </div>
    </div>

    <!-- リンクタグ群。折り返しで高さが変わりやすい領域をあらかじめ確保する。 -->
    <div v-if="tags" class="flex flex-wrap gap-1">
      <Skeleton v-for="tag in 10" :key="tag" class="h-9 w-24" />
    </div>
  </div>
</template>
