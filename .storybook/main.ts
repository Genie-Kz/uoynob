import type { StorybookConfig } from '@storybook/vue3-vite';

const config: StorybookConfig = {
  // アプリの vite.config.ts は VitePWA を含むが、Storybook ではサービスワーカー生成が
  // 不要（Storybook 自身の大きなランタイムが workbox の上限に引っかかる）。ここで除外する。
  async viteFinal(viteConfig) {
    viteConfig.plugins = (viteConfig.plugins ?? []).flat(Infinity).filter((plugin) => {
      const name = plugin && typeof plugin === 'object' && 'name' in plugin ? plugin.name : '';
      return !String(name).startsWith('vite-plugin-pwa');
    });
    return viteConfig;
  },
  // 各コンポーネントに併置した *.stories.ts を拾う。autodocs はタグで生成するため MDX は未使用。
  stories: ['../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  addons: [
    '@chromatic-com/storybook',
    '@storybook/addon-vitest',
    '@storybook/addon-a11y',
    '@storybook/addon-docs',
    '@storybook/addon-onboarding',
  ],
  framework: '@storybook/vue3-vite',
};
export default config;
