<script setup lang="ts" generic="T extends string | number | null">
import { computed, nextTick, ref, useId, watch } from 'vue';

interface IconOption {
  value: T;
  label: string;
  /** 任意のアイコン画像URL（無い選択肢は揃えるための余白を表示） */
  icon?: string;
}

const props = defineProps<{
  options: IconOption[];
  ariaLabel?: string;
}>();

// ネイティブ <select> は <option> に画像を入れられないため、listbox パターンで自作する
const modelValue = defineModel<T>({ required: true });

const baseId = useId();
const listboxId = `${baseId}-listbox`;
const optionId = (index: number): string => `${baseId}-option-${index}`;

const open = ref(false);
/** キーボード操作でハイライト中の選択肢 */
const activeIndex = ref(-1);
const triggerRef = ref<HTMLButtonElement | null>(null);

const selectedIndex = computed(() =>
  props.options.findIndex((option) => option.value === modelValue.value),
);
const selected = computed(() => props.options[selectedIndex.value] ?? props.options[0]);
/** いずれかの選択肢にアイコンがある場合のみ、無アイコンの選択肢に位置合わせの余白を出す */
const hasAnyIcon = computed(() => props.options.some((option) => option.icon));

function openList(): void {
  if (open.value) return;
  open.value = true;
  activeIndex.value = selectedIndex.value >= 0 ? selectedIndex.value : 0;
}

function closeList(refocus = true): void {
  if (!open.value) return;
  open.value = false;
  if (refocus) triggerRef.value?.focus();
}

function choose(value: T): void {
  modelValue.value = value;
  closeList();
}

function moveActive(delta: number): void {
  const count = props.options.length;
  if (count === 0) return;
  activeIndex.value = Math.min(count - 1, Math.max(0, activeIndex.value + delta));
}

function onKeydown(event: KeyboardEvent): void {
  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault();
      if (open.value) moveActive(1);
      else openList();
      break;
    case 'ArrowUp':
      event.preventDefault();
      if (open.value) moveActive(-1);
      else openList();
      break;
    case 'Home':
      if (open.value) {
        event.preventDefault();
        activeIndex.value = 0;
      }
      break;
    case 'End':
      if (open.value) {
        event.preventDefault();
        activeIndex.value = props.options.length - 1;
      }
      break;
    case 'Enter':
    case ' ':
      event.preventDefault();
      if (open.value) {
        const option = props.options[activeIndex.value];
        if (option) choose(option.value);
      } else {
        openList();
      }
      break;
    case 'Escape':
      if (open.value) {
        event.preventDefault();
        closeList();
      }
      break;
    case 'Tab':
      closeList(false);
      break;
  }
}

// ハイライト中の選択肢を表示領域内にスクロールする
watch(activeIndex, async (index) => {
  if (!open.value) return;
  await nextTick();
  document.getElementById(optionId(index))?.scrollIntoView?.({ block: 'nearest' });
});
</script>

<template>
  <div class="relative">
    <button
      ref="triggerRef"
      type="button"
      class="w-full flex items-center justify-between gap-1 border rounded bg-white px-2 py-2 text-sm"
      :aria-label="ariaLabel"
      aria-haspopup="listbox"
      :aria-expanded="open"
      :aria-controls="open ? listboxId : undefined"
      :aria-activedescendant="open && activeIndex >= 0 ? optionId(activeIndex) : undefined"
      @click="open ? closeList(false) : openList()"
      @keydown="onKeydown"
    >
      <span class="flex items-center gap-1.5 min-w-0">
        <slot name="icon" :option="selected">
          <img
            v-if="selected?.icon"
            :src="selected.icon"
            alt=""
            width="20"
            height="20"
            class="inline-block size-5 max-w-none object-contain shrink-0"
          />
        </slot>
        <span class="truncate">{{ selected?.label || ' ' }}</span>
      </span>
      <span class="text-xs text-gray-500 shrink-0" aria-hidden="true">▼</span>
    </button>

    <template v-if="open">
      <!-- 外側クリックで閉じる透明レイヤー -->
      <div class="fixed inset-0 z-40" @click="closeList(false)"></div>
      <ul
        :id="listboxId"
        role="listbox"
        :aria-label="ariaLabel"
        class="absolute left-0 right-0 z-50 mt-1 max-h-72 overflow-auto rounded border bg-white shadow-lg"
      >
        <li
          v-for="(option, index) in options"
          :id="optionId(index)"
          :key="String(option.value)"
          role="option"
          :aria-selected="option.value === modelValue"
          class="flex min-h-8 items-center gap-2 px-3 py-1.5 text-left text-sm cursor-pointer"
          :class="{
            'bg-blue-50': option.value === modelValue,
            'bg-gray-100': index === activeIndex,
          }"
          @click="choose(option.value)"
          @mousemove="activeIndex = index"
        >
          <slot name="icon" :option="option">
            <img
              v-if="option.icon"
              :src="option.icon"
              alt=""
              width="20"
              height="20"
              class="inline-block size-5 max-w-none object-contain shrink-0"
            />
            <span v-else-if="hasAnyIcon" class="inline-block size-5 shrink-0"></span>
          </slot>
          <span>{{ option.label || ' ' }}</span>
        </li>
      </ul>
    </template>
  </div>
</template>
