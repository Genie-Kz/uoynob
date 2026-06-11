<script setup lang="ts">
import { computed, ref } from 'vue';
import type { BodySize } from '@/types/monster';
import type { Skill } from '@/types/skill';
import { useMonsters } from '@/composables/useMonsters';
import { useSkills } from '@/composables/useSkills';
import { useBuildSimulator } from '@/composables/useBuildSimulator';
import {
  BODY_SIZES,
  lineageInfoOf,
} from '@/constants/monsterTaxonomy';
import { SKILL_SLOT_COUNT_BY_SIZE, TRAIT_SLOT_COUNT_BY_SIZE } from '@/constants/buildRules';
import { RESISTANCE_ELEMENTS } from '@/constants/resistances';
import { collectAllTraitNames } from '@/domain/monster';
import { summarizeGuardEffects } from '@/domain/skillAnalysis';
import { buildOutcomeResistanceCells } from '@/presentation/resistanceCells';
import DataState from '@/components/DataState.vue';
import MonsterIcon from '@/components/MonsterIcon.vue';
import ResistanceGrid from '@/components/ResistanceGrid.vue';
import PageBreadcrumb from '@/components/PageBreadcrumb.vue';
import PickerModal from '@/components/PickerModal.vue';
import type { PickerItem } from '@/types/picker';

const props = defineProps<{ id: string }>();

const { monsters, isLoading, errorMessage } = useMonsters();
const { skills } = useSkills();

const monster = computed(() => monsters.value?.find((candidate) => candidate.id === props.id) ?? null);

const {
  bodySize,
  traitSlots,
  skillSlots,
  forgeSlots,
  resistanceOutcomes,
  changeBodySize,
  setTrait,
  setSkill,
  setForgeElement,
} = useBuildSimulator(monster);

const lineage = computed(() => (monster.value ? lineageInfoOf(monster.value.系統) : null));
const resistanceCells = computed(() => buildOutcomeResistanceCells(resistanceOutcomes.value));

const allTraitNames = computed(() => collectAllTraitNames(monsters.value ?? []));
const skillById = computed(() => new Map((skills.value ?? []).map((skill) => [skill.id, skill])));

const statRows = computed(() => {
  const target = monster.value;
  if (!target) return [];
  return [
    { label: 'ＨＰ', value: target.HP },
    { label: 'ＭＰ', value: target.MP },
    { label: '攻撃力', value: target.攻撃力 },
    { label: '守備力', value: target.守備力 },
    { label: '素早さ', value: target.素早さ },
    { label: 'かしこさ', value: target.賢さ },
  ];
});

function bodySizeLabel(size: BodySize): string {
  return `${size}（特性${TRAIT_SLOT_COUNT_BY_SIZE[size]}・スキル${SKILL_SLOT_COUNT_BY_SIZE[size]}）`;
}

function skillGuardSummary(skill: Skill): string {
  return [...summarizeGuardEffects(skill)].map(([element, count]) => `${element}+${count * 2}`).join(' ');
}

/* ---- 入れ替えモーダル ---- */
type PickerMode = 'trait' | 'skill' | 'forge';

const picker = ref<{ open: boolean; mode: PickerMode; index: number; title: string; items: PickerItem[] }>({
  open: false,
  mode: 'trait',
  index: 0,
  title: '',
  items: [],
});

function openTraitPicker(index: number): void {
  picker.value = {
    open: true,
    mode: 'trait',
    index,
    title: '特性を選択',
    items: [{ label: '（空きにする）', value: '' }, ...allTraitNames.value.map((name) => ({ label: name, value: name }))],
  };
}

function openSkillPicker(index: number): void {
  picker.value = {
    open: true,
    mode: 'skill',
    index,
    title: 'スキルを選択',
    items: [
      { label: '（空きにする）', value: '' },
      ...(skills.value ?? []).map((skill) => ({ label: `${skill.name}〔${skill.category}〕`, value: skill.id })),
    ],
  };
}

function openForgePicker(index: number): void {
  picker.value = {
    open: true,
    mode: 'forge',
    index,
    title: '武器鍛冶を選択',
    items: [{ label: '（なし）', value: '' }, ...RESISTANCE_ELEMENTS.map((element) => ({ label: element, value: element }))],
  };
}

function handlePick(value: string): void {
  const { mode, index } = picker.value;
  if (mode === 'trait') setTrait(index, value);
  else if (mode === 'skill') setSkill(index, value ? (skillById.value.get(value) ?? null) : null);
  else setForgeElement(index, value);
  picker.value.open = false;
}
</script>

<template>
  <div>
    <PageBreadcrumb
      :items="[
        { label: 'ホーム', to: { name: 'home' } },
        { label: 'ビルドシミュレーター', to: { name: 'simulator-select' } },
        { label: monster?.名前 ?? '詳細' },
      ]"
    />

    <DataState :is-loading="isLoading" :error-message="errorMessage">
      <div v-if="!monster" class="border border-yellow-300 bg-yellow-50 rounded p-3">
        モンスターが見つかりませんでした（id={{ id }}）。
        <router-link :to="{ name: 'simulator-select' }" class="app-link">検索へ戻る</router-link>
      </div>

      <div v-else>
        <!-- ヘッダー -->
        <div class="border rounded p-4 mb-4 flex items-center">
          <MonsterIcon :lineage="monster.系統" :no="monster.no" size="lg" />
          <div class="ml-3">
            <h2 class="text-xl font-bold">{{ monster.名前 }}</h2>
            <div class="mt-1 flex flex-wrap gap-1 text-xs">
              <span class="bg-gray-200 rounded px-2 py-0.5">No.{{ monster.no }}</span>
              <span class="bg-sky-200 rounded px-2 py-0.5">ランク{{ monster.ランク }}</span>
              <span class="bg-gray-100 rounded px-2 py-0.5">{{ lineage?.label }}</span>
              <router-link :to="{ name: 'monster-detail', params: { id: monster.id } }" class="app-link ml-1">
                図鑑を見る
              </router-link>
            </div>
          </div>
        </div>

        <!-- 最終耐性 -->
        <h3 class="text-lg font-bold mb-2">最終耐性</h3>
        <ResistanceGrid :cells="resistanceCells" class="mb-5" />

        <!-- 特性 -->
        <h3 class="text-lg font-bold mb-2">
          特性
          <span class="text-sm text-gray-500 font-normal">
            {{ TRAIT_SLOT_COUNT_BY_SIZE[bodySize] }}枠（サイズ1＋{{ TRAIT_SLOT_COUNT_BY_SIZE[bodySize] - 1 }}）
          </span>
        </h3>
        <div class="mb-2">
          <label class="text-sm text-gray-600 block mb-1">ボディサイズ（枠数・耐性に影響）</label>
          <select
            :value="bodySize"
            class="border rounded px-2 py-1 text-sm"
            @change="changeBodySize(($event.target as HTMLSelectElement).value as BodySize)"
          >
            <option v-for="size in BODY_SIZES" :key="size" :value="size">{{ bodySizeLabel(size) }}</option>
          </select>
        </div>
        <ul class="border rounded divide-y mb-5">
          <li v-for="(trait, index) in traitSlots" :key="index" class="flex items-center justify-between px-3 py-2">
            <span :class="{ 'text-gray-400': !trait }">{{ trait || '（空き）' }}</span>
            <button
              type="button"
              class="border border-blue-500 text-blue-600 rounded px-2 py-0.5 text-sm hover:bg-blue-50"
              @click="openTraitPicker(index)"
            >
              編集
            </button>
          </li>
        </ul>

        <!-- スキル -->
        <h3 class="text-lg font-bold mb-2">
          スキル <span class="text-sm text-gray-500 font-normal">{{ SKILL_SLOT_COUNT_BY_SIZE[bodySize] }}枠</span>
        </h3>
        <ul class="border rounded divide-y mb-5">
          <li v-for="(skill, index) in skillSlots" :key="index" class="flex items-center justify-between px-3 py-2">
            <span v-if="skill">
              {{ skill.name }}
              <span class="bg-sky-200 rounded px-1.5 py-0.5 text-xs ml-1">{{ skill.category }}</span>
              <span v-if="skillGuardSummary(skill)" class="text-xs text-gray-600 ml-1">{{ skillGuardSummary(skill) }}</span>
            </span>
            <span v-else class="text-gray-400">（空き）</span>
            <button
              type="button"
              class="border border-blue-500 text-blue-600 rounded px-2 py-0.5 text-sm hover:bg-blue-50"
              @click="openSkillPicker(index)"
            >
              編集
            </button>
          </li>
        </ul>

        <!-- 武器鍛冶 -->
        <h3 class="text-lg font-bold mb-2">
          武器鍛冶 <span class="text-sm text-gray-500 font-normal">別々の耐性を3つまで・各+1</span>
        </h3>
        <ul class="border rounded divide-y mb-5">
          <li v-for="(element, index) in forgeSlots" :key="index" class="flex items-center justify-between px-3 py-2">
            <span>
              鍛冶{{ index + 1 }}：
              <template v-if="element">
                {{ element }} <span class="bg-sky-200 rounded px-1.5 py-0.5 text-xs">+1</span>
              </template>
              <span v-else class="text-gray-400">（なし）</span>
            </span>
            <button
              type="button"
              class="border border-blue-500 text-blue-600 rounded px-2 py-0.5 text-sm hover:bg-blue-50"
              @click="openForgePicker(index)"
            >
              編集
            </button>
          </li>
        </ul>

        <!-- ステータス -->
        <h3 class="text-lg font-bold mb-2">ステータス</h3>
        <table class="w-full text-sm border-collapse mb-4">
          <tbody>
            <tr v-for="row in statRows" :key="row.label" class="border-b">
              <th class="text-left bg-gray-50 border px-2 py-1 w-1/4">{{ row.label }}</th>
              <td class="border px-2 py-1">{{ row.value }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </DataState>

    <PickerModal
      :open="picker.open"
      :title="picker.title"
      :items="picker.items"
      @select="handlePick"
      @close="picker.open = false"
    />
  </div>
</template>
