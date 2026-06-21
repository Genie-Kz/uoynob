<script setup lang="ts">
/**
 * 入れ替え用の選択モーダル。候補をボタンで選び、下部の検索欄で絞り込める。
 * 開いた時点の高さを固定し、絞り込みで件数が変わってもモーダルが伸縮しないようにする。
 */
import { computed, nextTick, onBeforeUnmount, ref, toRef, watch } from 'vue';
import type { PickerItem } from '@/types/picker';
import { includesKeywordWithReading } from '@/shared/search/textSearch';
import { loadSearchReadings } from '@/shared/data/datasets';
import { useAsyncData } from '@/composables/useAsyncData';
import { useScrollLock } from '@/composables/useScrollLock';

const props = defineProps<{
  /** モーダルを開いているか。 */
  open: boolean;
  /** ヘッダーに表示するタイトル。 */
  title: string;
  /** 選択候補の一覧。 */
  items: PickerItem[];
  /** 現在選択中の値（開いたときに反転表示する） */
  current?: string;
}>();

// 表示中は背景のスクロールを止める。
useScrollLock(toRef(props, 'open'));

const emit = defineEmits<{
  select: [value: string];
  close: [];
}>();

const keyword = ref('');
const { data: searchReadings } = useAsyncData(loadSearchReadings);
/** 反転表示中の値。null は未選択。 */
const selectedValue = ref<string | null>(null);
const panelEl = ref<HTMLElement | null>(null);
/**
 * 開いた時点の高さを固定する。検索で候補数が変わってもモーダルの高さを動かさないため。
 * 開いた直後の高さ＝（全候補の内容に応じた高さ、上限 max-h-[80vh]）なので、
 * 候補が少ないモーダルは小さく、多いモーダルは上限まで、で安定する。
 */
const lockedHeight = ref<number | null>(null);
let lockHeightFrame: number | null = null;

/** 予約済みの高さ計測（requestAnimationFrame）をキャンセルする。 */
function cancelHeightMeasurement(): void {
  if (lockHeightFrame === null) return;
  cancelAnimationFrame(lockHeightFrame);
  lockHeightFrame = null;
}

/** 次フレームでパネルの高さを計測し、固定高さとして記録する。 */
function measureLockedHeight(): void {
  // 開閉を素早く繰り返した場合は、古い計測予約が後から高さを書き戻さないようにする。
  cancelHeightMeasurement();
  lockHeightFrame = requestAnimationFrame(() => {
    lockHeightFrame = null;
    if (!props.open) return;
    lockedHeight.value = panelEl.value?.getBoundingClientRect().height ?? null;
  });
}

// 開くたびに検索をリセットし、現在値を選択状態にして、その時点の高さを固定する
watch(
  () => props.open,
  async (isOpen) => {
    if (!isOpen) return;
    keyword.value = '';
    selectedValue.value = props.current ?? null;
    lockedHeight.value = null;
    await nextTick();
    measureLockedHeight();
  },
);

onBeforeUnmount(cancelHeightMeasurement);

const filteredItems = computed(() => {
  const query = keyword.value.trim();
  if (!query) return props.items;
  return props.items.filter(
    (item) =>
      includesKeywordWithReading(item.label, query, searchReadings.value?.labels) ||
      (item.searchText
        ? includesKeywordWithReading(item.searchText, query, searchReadings.value?.labels)
        : false),
  );
});

/** 候補を反転表示の選択状態にする（確定はしない）。 */
function selectItem(value: string): void {
  selectedValue.value = value;
}

/** 選択中の値を確定し、親へ select イベントで通知する。 */
function confirm(): void {
  if (selectedValue.value === null) return;
  emit('select', selectedValue.value);
}
</script>

<template>
  <Transition name="modal">
    <div
      v-if="open"
      class="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4"
      @click.self="emit('close')"
    >
      <div
        ref="panelEl"
        class="modal-panel bg-white rounded shadow-lg w-full max-w-2xl mt-10 max-h-[80vh] flex flex-col"
        :style="lockedHeight ? { height: lockedHeight + 'px' } : undefined"
      >
        <!-- ヘッダー -->
        <div class="border-b px-4 py-2 font-bold">{{ title }}</div>

        <!-- 選択肢（スクロール）。開いた時点の高さで固定するので、
             検索で件数が変わってもモーダルの高さは変化しない。 -->
        <div class="p-3 overflow-y-auto overscroll-contain flex-1 min-h-0">
          <div v-if="filteredItems.length" class="flex flex-wrap gap-2">
            <button
              v-for="item in filteredItems"
              :key="item.value"
              type="button"
              class="border border-blue-500 rounded px-3 py-2 text-sm transition-colors duration-200"
              :class="
                selectedValue === item.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-blue-600 hover:bg-blue-50'
              "
              @click="selectItem(item.value)"
            >
              {{ item.label }}
            </button>
          </div>
          <p v-else class="text-gray-500 text-sm text-center py-6">
            「{{ keyword }}」に一致する候補がありません
          </p>
        </div>

        <!-- 検索欄＋操作ボタン（下部。検索欄は閉じる/選択ボタンの上） -->
        <div class="border-t p-3">
          <input
            v-model="keyword"
            type="text"
            class="border rounded w-full px-3 py-2 mb-3"
            placeholder="入力して絞り込み"
          />
          <div class="flex justify-end gap-2">
            <button type="button" class="btn-neutral" @click="emit('close')">閉じる</button>
            <button
              type="button"
              class="btn-primary"
              :disabled="selectedValue === null"
              @click="confirm"
            >
              選択
            </button>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>
