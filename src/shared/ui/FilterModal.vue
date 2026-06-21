<script setup lang="ts">
/** 絞り込み条件を編集するモーダル。本文はスロットで差し込み、クリア／閉じる／検索を発火する。 */
import { toRef } from 'vue';
import { useScrollLock } from '@/composables/useScrollLock';

const props = defineProps<{
  /** モーダルを開いているか。 */
  open: boolean;
  /** ヘッダーに表示するタイトル。 */
  title: string;
  /** 検索ボタンの活性状態。false のときは薄く非活性表示にする。 */
  canSearch: boolean;
}>();

const emit = defineEmits<{
  clear: [];
  close: [];
  search: [];
}>();

// 表示中は背景のスクロールを止める。
useScrollLock(toRef(props, 'open'));
</script>

<template>
  <Transition name="modal">
    <div
      v-if="open"
      class="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4"
      @click.self="emit('close')"
    >
      <div
        class="modal-panel bg-white rounded shadow-lg w-full max-w-2xl mt-10 max-h-[80vh] flex flex-col"
      >
        <!-- ヘッダー -->
        <div class="border-b px-4 py-2 font-bold">{{ title }}</div>

        <!-- 本体（スクロール）。overscroll-contain で背景へのスクロール波及を防ぐ。 -->
        <div class="p-3 overflow-y-auto overscroll-contain flex-1 min-h-0">
          <slot />
        </div>

        <!-- 操作ボタン（右下にクリア・閉じる・検索） -->
        <div class="border-t p-3 flex justify-end gap-2">
          <button type="button" class="btn-neutral" @click="emit('clear')">クリア</button>
          <button type="button" class="btn-neutral" @click="emit('close')">閉じる</button>
          <button type="button" class="btn-primary" :disabled="!canSearch" @click="emit('search')">
            検索
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>
