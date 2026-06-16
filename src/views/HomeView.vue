<script setup lang="ts">
import SiteNavigation from '@/shared/ui/SiteNavigation.vue';
import logoUrl from '@/assets/images/icons/logo/logo.png';
</script>

<template>
  <div class="max-w-xl mx-auto">
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
