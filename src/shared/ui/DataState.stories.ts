import type { Meta, StoryObj } from '@storybook/vue3-vite';
import DataState from './DataState.vue';

/**
 * 非同期データの「読み込み中 / エラー / 成功」を出し分ける薄いラッパー。
 * 成功時はデフォルトスロットの中身を表示する。
 */
const meta = {
  title: 'shared/ui/DataState',
  component: DataState,
  tags: ['autodocs'],
  args: {
    isLoading: false,
    errorMessage: null,
  },
  render: (args) => ({
    components: { DataState },
    setup: () => ({ args }),
    template: `
      <DataState v-bind="args">
        <p class="text-gray-800">読み込みに成功した中身がここに表示されます。</p>
      </DataState>
    `,
  }),
} satisfies Meta<typeof DataState>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Loading: Story = {
  name: '読み込み中',
  args: { isLoading: true },
};

export const ErrorState: Story = {
  name: 'エラー',
  args: { errorMessage: 'データの取得に失敗しました。' },
};

export const Success: Story = {
  name: '成功',
};
