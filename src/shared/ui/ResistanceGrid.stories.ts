import type { Meta, StoryObj } from '@storybook/vue3-vite';
import type { ResistanceCellView } from '@/presentation/resistanceCells';
import ResistanceGrid from './ResistanceGrid.vue';

// 図鑑・ビルド結果と同じ見た目を確認するためのサンプルセル。
// colorClass は main.css で定義した bg-resistance-* ユーティリティ。
const cells: ResistanceCellView[] = [
  { element: 'メラ', text: '弱点', colorClass: 'bg-resistance-weak' },
  { element: 'ギラ', text: '-', colorClass: '' },
  { element: 'ヒャド', text: '半減', colorClass: 'bg-resistance-half' },
  { element: 'バギ', text: '激減', colorClass: 'bg-resistance-large' },
  { element: 'イオ', text: '無効', colorClass: 'bg-resistance-invalid' },
  { element: 'デイン', text: '回復', colorClass: 'bg-resistance-recover' },
  { element: 'ドルマ', text: '反射', colorClass: 'bg-resistance-reflect' },
  { element: '炎', text: '軽減', colorClass: 'bg-resistance-little' },
  { element: '氷', text: '-', colorClass: '' },
];

/**
 * 耐性を 3 列グリッドで表示する。耐性名はグレー帯、値は段階ごとに色付きのピル。
 */
const meta = {
  title: 'shared/ui/ResistanceGrid',
  component: ResistanceGrid,
  tags: ['autodocs'],
  args: {
    title: '耐性',
    cells,
  },
} satisfies Meta<typeof ResistanceGrid>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AllLevels: Story = {
  name: '全段階',
};

/** title を渡さない場合は見出しバーが消える。 */
export const NoTitle: Story = {
  name: '見出しなし',
  args: { title: undefined },
};
