<script setup lang="ts">
// 該当ルートが無いときに表示する 404 ページ。ホームへ戻る導線を置く。
</script>

<template>
  <div class="py-10 text-center">
    <h2 class="text-2xl font-bold mb-2">ページが見つかりません</h2>
    <p class="text-gray-500 mb-4">お探しのページは存在しないか、移動した可能性があります。</p>
    <router-link :to="{ name: 'home' }" class="app-link">ホームへ戻る</router-link>
  </div>
</template>
