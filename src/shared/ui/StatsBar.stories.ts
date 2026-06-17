import type { Meta, StoryObj } from '@storybook/vue3-vite';
import type { StatValues } from '@/types/stats';
import StatsBar from './StatsBar.vue';

const sampleStats: StatValues = {
  HP: 999,
  MP: 420,
  攻撃力: 685,
  守備力: 540,
  素早さ: 612,
  賢さ: 388,
};

/**
 * 画面下部に固定表示するステータスバー。展開／折りたたみできる。
 * `fixed bottom-0` のため、Storybook 上でもプレビュー枠の下端に貼り付く。
 */
const meta = {
  title: 'shared/ui/StatsBar',
  component: StatsBar,
  tags: ['autodocs'],
} satisfies Meta<typeof StatsBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithValues: Story = {
  name: '値あり',
  args: { stats: sampleStats },
};

/** stats が null のときは各値が「-」になる。 */
export const Empty: Story = {
  name: '値なし',
  args: { stats: null },
};
