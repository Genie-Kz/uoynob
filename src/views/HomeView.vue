<script setup lang="ts">
// トップページ。ロゴと一言説明、そしてサイト内メニュー（検索・各分類への入口）を表示する。
import SiteNavigation from '@/shared/ui/SiteNavigation.vue';
import logoUrl from '@/assets/images/icons/logo/logo.png';
</script>

<template>
  <div class="max-w-xl mx-auto">
    <!-- ロゴと説明文 -->
    <div class="text-center my-4">
      <img
        :src="logoUrl"
        alt="ドラゴンクエストモンスターズ２ イルとルカの不思議な鍵SP"
        class="mx-auto w-full max-w-[280px] h-auto"
      />
      <p class="mt-3 text-sm text-gray-600">イルルカSPの攻略データベース。</p>
    </div>

    <SiteNavigation />
  </div>
</template>
