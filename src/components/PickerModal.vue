<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { PickerItem } from '@/types/picker';

const props = defineProps<{
  open: boolean;
  title: string;
  items: PickerItem[];
}>();

const emit = defineEmits<{
  select: [value: string];
  close: [];
}>();

const keyword = ref('');

// 開くたびに検索欄をリセット
watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) keyword.value = '';
  },
);

const filteredItems = computed(() => {
  const query = keyword.value.trim();
  if (!query) return props.items;
  return props.items.filter((item) => item.label.includes(query));
});
</script>

<template>
  <Transition name="modal">
    <div
      v-if="open"
      class="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4"
      @click.self="emit('close')"
    >
      <div class="modal-panel bg-white rounded shadow-lg w-full max-w-2xl mt-10 max-h-[80vh] flex flex-col">
      <div class="flex items-center justify-between border-b px-4 py-2">
        <h3 class="font-bold">{{ title }}</h3>
        <button class="text-gray-500 text-2xl leading-none" aria-label="閉じる" @click="emit('close')">
          &times;
        </button>
      </div>
      <div class="p-3 overflow-y-auto">
        <input
          v-model="keyword"
          type="text"
          class="border rounded w-full px-2 py-1 mb-3"
          placeholder="入力して絞り込み（未入力なら一覧から選択）"
        />
        <div class="flex flex-wrap gap-2">
          <!-- 青枠・青字・白背景の選択ボタン -->
          <button
            v-for="item in filteredItems"
            :key="item.value"
            type="button"
            class="border border-blue-500 text-blue-600 bg-white rounded px-3 py-1 text-sm hover:bg-blue-50"
            @click="emit('select', item.value)"
          >
            {{ item.label }}
          </button>
        </div>
      </div>
      </div>
    </div>
  </Transition>
</template>
