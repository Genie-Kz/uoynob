<script setup lang="ts">
import { computed, ref } from 'vue';

interface IconOption {
  value: string;
  label: string;
  /** 任意のアイコン画像URL（無い選択肢は揃えるための余白を表示） */
  icon?: string;
}

const props = defineProps<{
  options: IconOption[];
  ariaLabel?: string;
}>();

// ネイティブ <select> は <option> に画像を入れられないため、アイコン表示用に自作する
const modelValue = defineModel<string>({ required: true });

const open = ref(false);
const selected = computed(
  () => props.options.find((option) => option.value === modelValue.value) ?? props.options[0],
);

function choose(value: string): void {
  modelValue.value = value;
  open.value = false;
}
</script>

<template>
  <div class="relative">
    <button
      type="button"
      class="w-full flex items-center justify-between gap-1 border rounded bg-white px-2 py-2 text-sm"
      :aria-label="ariaLabel"
      :aria-expanded="open"
      @click="open = !open"
    >
      <span class="flex items-center gap-1.5 min-w-0">
        <img
          v-if="selected?.icon"
          :src="selected.icon"
          alt=""
          class="inline-block size-5 max-w-none object-contain shrink-0"
        />
        <span class="truncate">{{ selected?.label }}</span>
      </span>
      <span class="text-xs text-gray-500 shrink-0">▼</span>
    </button>

    <template v-if="open">
      <!-- 外側クリックで閉じる透明レイヤー -->
      <div class="fixed inset-0 z-40" @click="open = false"></div>
      <ul class="absolute left-0 right-0 z-50 mt-1 max-h-72 overflow-auto rounded border bg-white shadow-lg">
        <li v-for="option in options" :key="option.value">
          <button
            type="button"
            class="w-full flex items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-50"
            :class="{ 'bg-blue-50': option.value === modelValue }"
            @click="choose(option.value)"
          >
            <img
              v-if="option.icon"
              :src="option.icon"
              alt=""
              class="inline-block size-5 max-w-none object-contain shrink-0"
            />
            <span v-else class="inline-block size-5 shrink-0"></span>
            <span>{{ option.label }}</span>
          </button>
        </li>
      </ul>
    </template>
  </div>
</template>
