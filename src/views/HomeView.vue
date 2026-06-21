<script setup lang="ts">
/** トップページ。ロゴと一言説明、そしてサイト内メニュー（検索・各分類への入口）を表示する。 */
import { onMounted, ref } from 'vue';
import SiteNavigation from '@/shared/ui/SiteNavigation.vue';
import Skeleton from '@/shared/ui/Skeleton.vue';
import logoUrl from '@/assets/images/icons/logo/logo.png';

/**
 * ロゴ画像の読み込み状態。読み込み中はスケルトンを表示してガタつき（CLS）を防ぐ。
 * 成否を別々のフラグで持つと「成功でも失敗でもある」といった不整合な状態を作れて
 * しまうため、起こりうる状態を一つの値で表す。
 * loading: 読み込み中（スケルトン表示）
 * loaded : 成功（画像を表示）
 * failed : 失敗（空の壊れた画像ではなくタイトル文字で代替）
 */
type LogoStatus = 'loading' | 'loaded' | 'failed';
const logoStatus = ref<LogoStatus>('loading');
const logoEl = ref<HTMLImageElement | null>(null);

// キャッシュ済みで @load / @error が発火しないことがあるため、マウント時に状態を確認する。
// complete は読み込み失敗時も true になるので、中身の有無を naturalWidth で見分ける。
onMounted(() => {
  const el = logoEl.value;
  if (!el || !el.complete) return;
  logoStatus.value = el.naturalWidth > 0 ? 'loaded' : 'failed';
});
</script>

<template>
  <div class="max-w-xl mx-auto">
    <!-- ロゴと説明文 -->
    <div class="text-center my-4">
      <!-- ロゴ。アスペクト比で先に表示領域を確保し、読み込み完了までスケルトンを重ねる -->
      <div class="relative mx-auto w-full max-w-[280px] aspect-[576/308]">
        <!-- 読み込み中はスケルトンを表示 -->
        <Skeleton v-if="logoStatus === 'loading'" class="absolute inset-0 h-full w-full" />
        <!-- 読み込めなかった場合は、空の壊れた画像ではなくタイトル文字で代替する -->
        <div
          v-else-if="logoStatus === 'failed'"
          class="absolute inset-0 flex h-full w-full items-center justify-center px-2 text-center text-sm font-bold text-gray-700"
        >
          ドラゴンクエストモンスターズ２ イルとルカの不思議な鍵SP
        </div>
        <img
          v-show="logoStatus !== 'failed'"
          ref="logoEl"
          :src="logoUrl"
          alt="ドラゴンクエストモンスターズ２ イルとルカの不思議な鍵SP"
          width="576"
          height="308"
          class="h-full w-full object-contain transition-opacity duration-200"
          :class="logoStatus === 'loaded' ? 'opacity-100' : 'opacity-0'"
          @load="logoStatus = 'loaded'"
          @error="logoStatus = 'failed'"
        />
      </div>
      <p class="mt-3 text-sm text-gray-600">イルルカSPの攻略データベース。</p>
    </div>

    <SiteNavigation />
  </div>
</template>
