import type { Meta, StoryObj } from '@storybook/vue3-vite';
import StatusTable from './StatusTable.vue';

/**
 * グレーの見出しバー＋「ラベル／値」を中央寄せで並べる汎用テーブル。
 * モンスター詳細などの基本情報表示に使う。
 */
const meta = {
  title: 'shared/ui/StatusTable',
  component: StatusTable,
  tags: ['autodocs'],
  args: {
    title: '基本情報',
    rows: [
      { label: '系統', value: 'スライム系' },
      { label: 'ランク', value: 'S' },
      { label: 'サイズ', value: '標準' },
      { label: '所持スキル', value: 'ギラ系のコツ' },
    ],
  },
} satisfies Meta<typeof StatusTable>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: '標準',
};

export const SingleRow: Story = {
  name: '一行のみ',
  args: {
    title: '配合元',
    rows: [{ label: 'なし', value: '野生で入手' }],
  },
};
