<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { PickerItem } from '@/types/picker';
import { includesKeyword } from '@/domain/textSearch';

const props = defineProps<{
  open: boolean;
  title: string;
  items: PickerItem[];
  /** 現在選択中の値（開いたときに反転表示する） */
  current?: string;
}>();

const emit = defineEmits<{
  select: [value: string];
  close: [];
}>();

const keyword = ref('');
/** 反転表示中の値。null は未選択。 */
const selectedValue = ref<string | null>(null);

// 開くたびに検索をリセットし、現在値を選択状態にする
watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      keyword.value = '';
      selectedValue.value = props.current ?? null;
    }
  },
);

const filteredItems = computed(() => {
  const query = keyword.value.trim();
  if (!query) return props.items;
  return props.items.filter(
    (item) =>
      includesKeyword(item.label, query) ||
      (item.searchText ? includesKeyword(item.searchText, query) : false),
  );
});

function selectItem(value: string): void {
  selectedValue.value = value;
}

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
      <div class="modal-panel bg-white rounded shadow-lg w-full max-w-2xl mt-10 max-h-[80vh] flex flex-col">
        <!-- ヘッダー -->
        <div class="border-b px-4 py-2 font-bold">{{ title }}</div>

        <!-- 選択肢（スクロール）。選択中は文字色・背景色を反転表示。 -->
        <div class="p-3 overflow-y-auto flex-1">
          <div class="flex flex-wrap gap-2">
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
            <button type="button" class="btn-primary" :disabled="selectedValue === null" @click="confirm">
              選択
            </button>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>
