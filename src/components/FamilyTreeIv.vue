<script setup lang="ts">
import { ref } from 'vue';
import type { StatKey, StatValues } from '@/types/stats';
import { STAT_KEYS, INDIVIDUAL_VALUE_RANGE } from '@/constants/statsRules';
import { LINEAGE_ICON, LINEAGE_LABEL, STAT_LINEAGES } from '@/constants/lineageIcons';

const props = defineProps<{
  familyTree: (string | null)[];
  individualValues: StatValues;
}>();

const emit = defineEmits<{
  setLineage: [index: number, lineage: string | null];
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

/* ---- 個体値 ---- */
function onIvInput(stat: StatKey, event: Event): void {
  const range = INDIVIDUAL_VALUE_RANGE[stat];
  const raw = Number((event.target as HTMLInputElement).value);
  const clamped = Math.max(range.min, Math.min(range.max, Number.isFinite(raw) ? raw : 0));
  emit('setIv', stat, clamped);
}
</script>

<template>
  <div>
    <!-- 家系図 -->
    <h3 class="text-lg font-bold mb-2">系図</h3>
    <p class="text-sm text-gray-500 mb-2">各枠の系統を選ぶと、系統ボーナスがステータスに反映されます。</p>
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
              <span class="text-sm">{{ lineageOf(i) ? LINEAGE_LABEL[lineageOf(i)!] : '未設定' }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 個体値 -->
    <h3 class="text-lg font-bold mb-2">個体値</h3>
    <p class="text-sm text-gray-500 mb-2">HP・攻撃力・素早さは±100、MP・守備力・賢さは±200。</p>
    <div class="space-y-2">
      <div v-for="stat in STAT_KEYS" :key="stat" class="flex items-center gap-2">
        <span class="w-16 text-sm text-gray-600">{{ STAT_LABEL[stat] }}</span>
        <input
          type="number"
          class="border rounded px-3 py-2 w-24 text-sm"
          :min="INDIVIDUAL_VALUE_RANGE[stat].min"
          :max="INDIVIDUAL_VALUE_RANGE[stat].max"
          :value="individualValues[stat]"
          @input="onIvInput(stat, $event)"
        />
        <div class="flex gap-1">
          <button type="button" class="btn-neutral !px-3 !py-1" @click="emit('setIv', stat, INDIVIDUAL_VALUE_RANGE[stat].min)">最小</button>
          <button type="button" class="btn-neutral !px-3 !py-1" @click="emit('setIv', stat, 0)">0</button>
          <button type="button" class="btn-neutral !px-3 !py-1" @click="emit('setIv', stat, INDIVIDUAL_VALUE_RANGE[stat].max)">最大</button>
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
  </div>
</template>
