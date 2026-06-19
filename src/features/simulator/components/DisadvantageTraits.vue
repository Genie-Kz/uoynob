<script setup lang="ts">
// ビルドの構成によって付く「不利な特性」を一覧表示する。SP 化できる特性には SP ボタンを出す。
defineProps<{
  // 不利な特性名の配列。
  traits: string[];
  // SP 切り替えボタンを表示するか。
  showSp?: boolean;
  // 現在 SP 化されている特性名。
  spTraits?: string[];
  // SP 化が可能な特性名。
  spAvailableTraits?: string[];
}>();

defineEmits<{
  // SP ボタン押下時に、対象の特性名を親へ通知する。
  toggleSp: [trait: string];
}>();
</script>

<template>
  <!-- 不利な特性が1つも無ければ何も表示しない -->
  <div v-if="traits.length" class="mb-5">
    <h3 class="text-lg font-bold mb-2">不利な特性</h3>
    <ul class="border rounded divide-y">
      <li
        v-for="trait in traits"
        :key="trait"
        class="flex items-center justify-between gap-2 px-3 py-2"
      >
        <span>{{ trait }}</span>
        <!-- SP 表示が有効なときだけ、右側に SP ボタン（または位置合わせの空き）を出す -->
        <span v-if="showSp" class="flex items-center gap-2">
          <!-- SP 化できる特性のみボタンを表示。押下中は塗りつぶし表示 -->
          <button
            v-if="spAvailableTraits?.includes(trait)"
            type="button"
            class="rounded border px-3 py-1 text-sm font-semibold"
            :class="
              spTraits?.includes(trait)
                ? 'border-blue-500 bg-blue-600 text-white'
                : 'border-gray-300 text-gray-500'
            "
            @click="$emit('toggleSp', trait)"
          >
            SP
          </button>
          <span v-else class="w-[42px]" aria-hidden="true"></span>
          <span class="btn-outline-primary invisible" aria-hidden="true">選択</span>
        </span>
      </li>
    </ul>
  </div>
</template>
