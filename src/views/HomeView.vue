<script setup lang="ts">
// トップページ。ロゴと一言説明、そしてサイト内メニュー（検索・各分類への入口）を表示する。
import { onMounted, ref } from 'vue';
import SiteNavigation from '@/shared/ui/SiteNavigation.vue';
import Skeleton from '@/shared/ui/Skeleton.vue';
import logoUrl from '@/assets/images/icons/logo/logo.png';

// ロゴ画像の読み込み完了フラグ。完了までスケルトンを表示してガタつき（CLS）を防ぐ。
const logoLoaded = ref(false);
const logoEl = ref<HTMLImageElement | null>(null);

// キャッシュ済みで @load が発火しないことがあるため、マウント時に完了状態を確認する。
onMounted(() => {
  if (logoEl.value?.complete) logoLoaded.value = true;
});
</script>

<template>
  <div class="max-w-xl mx-auto">
    <!-- ロゴと説明文 -->
    <div class="text-center my-4">
      <!-- ロゴ。アスペクト比で先に表示領域を確保し、読み込み完了までスケルトンを重ねる -->
      <div class="relative mx-auto w-full max-w-[280px] aspect-[576/308]">
        <Skeleton v-if="!logoLoaded" class="absolute inset-0 h-full w-full" />
        <img
          ref="logoEl"
          :src="logoUrl"
          alt="ドラゴンクエストモンスターズ２ イルとルカの不思議な鍵SP"
          width="576"
          height="308"
          class="h-full w-full object-contain transition-opacity duration-200"
          :class="logoLoaded ? 'opacity-100' : 'opacity-0'"
          @load="logoLoaded = true"
          @error="logoLoaded = true"
        />
      </div>
      <p class="mt-3 text-sm text-gray-600">イルルカSPの攻略データベース。</p>
    </div>

    <SiteNavigation />
  </div>
</template>
