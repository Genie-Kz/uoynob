import type { Preview } from '@storybook/vue3-vite';
import { themes } from 'storybook/theming';
// アプリ本体と同じ Tailwind v4 のスタイル／テーマ／ダークモード定義を読み込む。
// これがないと各コンポーネントがプレーンな見た目になってしまう。
import '../src/assets/main.css';

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },

    // Docs ページ（autodocs）の地もダークテーマに合わせる。
    docs: {
      theme: themes.dark,
    },

    a11y: {
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: 'todo',
    },
  },

  // ツールバーからライト／ダークを切り替える。アプリは html.dark で配色を出し分ける。
  globalTypes: {
    theme: {
      description: 'ライト／ダークの配色切り替え',
      defaultValue: 'light',
      toolbar: {
        title: 'Theme',
        icon: 'circlehollow',
        items: [
          { value: 'light', title: 'Light' },
          { value: 'dark', title: 'Dark' },
        ],
        dynamicTitle: true,
      },
    },
  },

  decorators: [
    (story, context) => {
      const isDark = context.globals.theme === 'dark';
      // html.dark はアプリと同じ前提（固定配置で枠外に出る StatsBar などにも効かせる）。
      document.documentElement.classList.toggle('dark', isDark);
      // コンポーネントは背景透明なので、アプリの body 相当の面を story の下に敷く。
      // これがないとダーク時に Storybook の地（白）が透けてちぐはぐに見える。
      return {
        components: { story },
        setup: () => ({ isDark }),
        template: `
          <div
            :class="{ dark: isDark }"
            :style="{
              backgroundColor: isDark ? '#181818' : '#ffffff',
              color: isDark ? '#e6e6e6' : '#1f2937',
              padding: '1rem',
              borderRadius: '0.25rem',
            }"
          >
            <story />
          </div>
        `,
      };
    },
  ],
};

export default preview;
