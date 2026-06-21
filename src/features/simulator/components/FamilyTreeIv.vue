<script setup lang="ts">
/**
 * 系図（4体の親系統）と個体値（テンプレート/手入力）を編集するコンポーネント。
 * 系統の組み合わせや個体値テンプレートが、最終ステータスの計算に影響する。
 */
import { computed, ref } from 'vue';
import type { StatKey, StatValues } from '@/types/stats';
import { STAT_KEYS, INDIVIDUAL_VALUE_RANGE } from '@/constants/statsRules';
import { LINEAGE_ICON, LINEAGE_LABEL, STAT_LINEAGES } from '@/shared/icons/lineageIcons';
import {
  INDIVIDUAL_VALUE_TEMPLATES,
  individualValuesFromTemplate,
} from '@/domain/individualValueTemplate';
import { useResettableTimeout } from '@/composables/useResettableTimeout';
import PickerModal from '@/shared/ui/PickerModal.vue';

const props = defineProps<{
  /** 家系図14枠の系統（仕様の重み順。null/空は未設定）。 */
  familyTree: (string | null)[];
  /** 現在の個体値6種。 */
  individualValues: StatValues;
}>();

const emit = defineEmits<{
  /** 指定枠の系統を変更したことを親へ通知する。 */
  setLineage: [index: number, lineage: string | null];
  /** 家系図を1系統で一括設定するよう親へ要求する。 */
  fill: [lineage: string];
  /** 指定ステータスの個体値変更を親へ通知する。 */
  setIv: [stat: StatKey, value: number];
}>();

/** 家系図の段（仕様の重み順 index に対応）。grid-cols-8 上での桁数で配置を揃える。 */
// 曽祖父母 index 6..13（各1桁）、祖父母 index 2..5（各2桁）、両親 index 0..1（各4桁）
const GREAT_GRANDPARENTS = [6, 7, 8, 9, 10, 11, 12, 13];
const GRANDPARENTS = [2, 3, 4, 5];
const PARENTS = [0, 1];

const STAT_LABEL: Record<StatKey, string> = {
  HP: 'HP',
  MP: 'MP',
  攻撃力: '攻撃力',
  守備力: '守備力',
  素早さ: '素早さ',
  賢さ: '賢さ',
};

/* ---- 系統選択モーダル ---- */
const pickerOpen = ref(false);
const pickerIndex = ref(0);

function openPicker(index: number): void {
  pickerIndex.value = index;
  pickerOpen.value = true;
}
function chooseLineage(lineage: string): void {
  emit('setLineage', pickerIndex.value, lineage);
  pickerOpen.value = false;
}

function lineageOf(index: number): string | null {
  return props.familyTree[index] ?? null;
}

/* ---- 系統で一括設定（押下フィードバック） ---- */
const lastFilled = ref<string | null>(null);
const fillFeedbackTimeout = useResettableTimeout();
function onFill(lineage: string): void {
  emit('fill', lineage);
  lastFilled.value = lineage;
  fillFeedbackTimeout.start(() => {
    if (lastFilled.value === lineage) lastFilled.value = null;
  }, 800);
}

/* ---- 個体値 ---- */
function onIvInput(stat: StatKey, event: Event): void {
  const range = INDIVIDUAL_VALUE_RANGE[stat];
  const raw = Number((event.target as HTMLInputElement).value);
  const clamped = Math.max(range.min, Math.min(range.max, Number.isFinite(raw) ? raw : 0));
  emit('setIv', stat, clamped);
}

const lastIvPreset = ref<string | null>(null);
const ivPresetFeedbackTimeout = useResettableTimeout();
function setIvPreset(stat: StatKey, value: number): void {
  emit('setIv', stat, value);
  const presetKey = `${stat}:${value}`;
  lastIvPreset.value = presetKey;
  ivPresetFeedbackTimeout.start(() => {
    if (lastIvPreset.value === presetKey) lastIvPreset.value = null;
  }, 800);
}

function ivPresetClass(stat: StatKey, value: number): string {
  return lastIvPreset.value === `${stat}:${value}`
    ? 'border-blue-500 bg-blue-100 ring-2 ring-blue-300'
    : '';
}

const templatePickerOpen = ref(false);
const templateItems = INDIVIDUAL_VALUE_TEMPLATES.map((template) => ({
  label: template,
  value: template,
}));
const currentTemplate = computed(
  () =>
    INDIVIDUAL_VALUE_TEMPLATES.find((template) => {
      const values = individualValuesFromTemplate(template);
      return STAT_KEYS.every((stat) => values[stat] === props.individualValues[stat]);
    }) ?? '',
);

function applyIvTemplate(template: string): void {
  const values = individualValuesFromTemplate(template);
  for (const stat of STAT_KEYS) emit('setIv', stat, values[stat]);
  templatePickerOpen.value = false;
}

/** 個体値が最大（＋方向）／最小（−方向）／中間のいずれか */
function ivState(stat: StatKey): 'max' | 'min' | 'mid' {
  const value = props.individualValues[stat];
  const range = INDIVIDUAL_VALUE_RANGE[stat];
  if (value >= range.max) return 'max';
  if (value <= range.min) return 'min';
  return 'mid';
}
/** 個体値入力欄の状態別カラー（落ち着いた赤系／青系） */
function ivInputClass(stat: StatKey): string {
  const state = ivState(stat);
  if (state === 'max') return 'border-rose-300 bg-rose-50 text-rose-700';
  if (state === 'min') return 'border-sky-300 bg-sky-50 text-sky-700';
  return '';
}
</script>

<template>
  <div>
    <!-- 家系図 -->
    <h3 class="text-lg font-bold mb-2">系図</h3>
    <p class="text-sm text-gray-500 mb-2">
      各枠の系統を選ぶと、系統ボーナスがステータスに反映されます。
    </p>
    <div class="overflow-x-auto pb-2 mb-5">
      <div class="min-w-[640px] space-y-3">
        <!-- 曽祖父母 -->
        <div>
          <p class="text-xs text-gray-500 mb-1">曽祖父母</p>
          <div class="grid grid-cols-8 gap-1">
            <button
              v-for="i in GREAT_GRANDPARENTS"
              :key="i"
              type="button"
              class="flex flex-col items-center border rounded py-1 hover:bg-gray-50"
              @click="openPicker(i)"
            >
              <img v-if="lineageOf(i)" :src="LINEAGE_ICON[lineageOf(i)!]" alt="" class="w-7 h-7" />
              <span v-else class="w-7 h-7 rounded bg-gray-100"></span>
            </button>
          </div>
        </div>
        <!-- 祖父母 -->
        <div>
          <p class="text-xs text-gray-500 mb-1">祖父母</p>
          <div class="grid grid-cols-8 gap-1">
            <button
              v-for="i in GRANDPARENTS"
              :key="i"
              type="button"
              class="col-span-2 flex flex-col items-center border rounded py-1 hover:bg-gray-50"
              @click="openPicker(i)"
            >
              <img v-if="lineageOf(i)" :src="LINEAGE_ICON[lineageOf(i)!]" alt="" class="w-8 h-8" />
              <span v-else class="w-8 h-8 rounded bg-gray-100"></span>
            </button>
          </div>
        </div>
        <!-- 両親 -->
        <div>
          <p class="text-xs text-gray-500 mb-1">両親</p>
          <div class="grid grid-cols-8 gap-1">
            <button
              v-for="i in PARENTS"
              :key="i"
              type="button"
              class="col-span-4 flex items-center justify-center gap-2 border rounded py-2 hover:bg-gray-50"
              @click="openPicker(i)"
            >
              <img v-if="lineageOf(i)" :src="LINEAGE_ICON[lineageOf(i)!]" alt="" class="w-8 h-8" />
              <span v-else class="w-8 h-8 rounded bg-gray-100"></span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 系統で一括設定 -->
    <div class="mb-6">
      <p class="text-xs text-gray-500 mb-1">系統で一括設定</p>
      <p class="text-xs text-gray-400 mb-2">
        選んだ系統で系図を埋めます。左の親・左の祖父母・曽祖父母の一番左は自身の系統、曽祖父母の左から2番目は対応系統になります。
      </p>
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <button
          v-for="lineage in STAT_LINEAGES"
          :key="lineage"
          type="button"
          class="flex items-center gap-2 border rounded px-3 py-2 transition active:scale-95"
          :class="
            lastFilled === lineage
              ? 'border-blue-500 bg-blue-100 ring-2 ring-blue-300'
              : 'hover:bg-blue-50'
          "
          @click="onFill(lineage)"
        >
          <img :src="LINEAGE_ICON[lineage]" alt="" class="w-6 h-6" />
          <span class="text-sm">{{ LINEAGE_LABEL[lineage] }}</span>
          <span v-if="lastFilled === lineage" class="ml-auto text-blue-600 text-sm font-bold"
            >✓設定</span
          >
        </button>
      </div>
    </div>

    <!-- 個体値 -->
    <div class="flex items-center justify-between gap-2 mb-2">
      <h3 class="text-lg font-bold">個体値</h3>
      <button type="button" class="btn-outline-primary" @click="templatePickerOpen = true">
        よく使う個体値
      </button>
    </div>
    <p class="text-sm text-gray-500 mb-2">HP・攻撃力・素早さは±100、MP・守備力・賢さは±200。</p>
    <p class="text-xs text-gray-400 mb-3">
      大文字が最大、小文字が最小です。3文字の全大文字表記では、書かれていない能力は最小になります。
      H=HP、M=MP、A=攻撃力、D=守備力、S=素早さ、W=賢さ。
    </p>
    <div class="space-y-2">
      <div v-for="stat in STAT_KEYS" :key="stat" class="flex items-center gap-2">
        <span class="w-16 text-sm text-gray-600">{{ STAT_LABEL[stat] }}</span>
        <div class="relative">
          <input
            type="number"
            class="border rounded pl-3 pr-7 py-2 w-24 text-sm"
            :class="ivInputClass(stat)"
            :min="INDIVIDUAL_VALUE_RANGE[stat].min"
            :max="INDIVIDUAL_VALUE_RANGE[stat].max"
            :value="individualValues[stat]"
            @input="onIvInput(stat, $event)"
          />
          <span
            v-if="ivState(stat) !== 'mid'"
            class="absolute right-2 top-1/2 -translate-y-1/2 text-sm font-bold pointer-events-none"
            :class="ivState(stat) === 'max' ? 'text-rose-500' : 'text-sky-500'"
          >
            {{ ivState(stat) === 'max' ? '↑' : '↓' }}
          </span>
        </div>
        <div class="flex gap-1">
          <button
            type="button"
            class="btn-neutral !px-3 !py-1 active:scale-95"
            :class="ivPresetClass(stat, INDIVIDUAL_VALUE_RANGE[stat].min)"
            @click="setIvPreset(stat, INDIVIDUAL_VALUE_RANGE[stat].min)"
          >
            最小
          </button>
          <button
            type="button"
            class="btn-neutral !px-3 !py-1 active:scale-95"
            :class="ivPresetClass(stat, 0)"
            @click="setIvPreset(stat, 0)"
          >
            0
          </button>
          <button
            type="button"
            class="btn-neutral !px-3 !py-1 active:scale-95"
            :class="ivPresetClass(stat, INDIVIDUAL_VALUE_RANGE[stat].max)"
            @click="setIvPreset(stat, INDIVIDUAL_VALUE_RANGE[stat].max)"
          >
            最大
          </button>
        </div>
      </div>
    </div>

    <!-- 系統選択モーダル -->
    <Transition name="modal">
      <div
        v-if="pickerOpen"
        class="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4"
        @click.self="pickerOpen = false"
      >
        <div class="modal-panel bg-white rounded shadow-lg w-full max-w-md mt-10">
          <div class="border-b px-4 py-2 font-bold">系統を選択</div>
          <div class="p-3 grid grid-cols-2 gap-2">
            <button
              v-for="lineage in STAT_LINEAGES"
              :key="lineage"
              type="button"
              class="flex items-center gap-2 border rounded px-3 py-2 hover:bg-blue-50"
              @click="chooseLineage(lineage)"
            >
              <img :src="LINEAGE_ICON[lineage]" alt="" class="w-7 h-7" />
              <span class="text-sm">{{ LINEAGE_LABEL[lineage] }}</span>
            </button>
          </div>
          <div class="border-t p-3 flex justify-end">
            <button type="button" class="btn-neutral" @click="pickerOpen = false">閉じる</button>
          </div>
        </div>
      </div>
    </Transition>

    <PickerModal
      :open="templatePickerOpen"
      title="よく使う個体値を選択"
      :items="templateItems"
      :current="currentTemplate"
      @select="applyIvTemplate"
      @close="templatePickerOpen = false"
    />
  </div>
</template>
