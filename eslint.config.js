import storybook from 'eslint-plugin-storybook';
import pluginVue from 'eslint-plugin-vue';
import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript';
import eslintConfigPrettier from 'eslint-config-prettier';
import globals from 'globals';

export default defineConfigWithVueTs(
  {
    name: 'app/ignores',
    ignores: [
      'dist/**',
      'node_modules/**',
      'coverage/**',
      'public/**',
      'playwright-report/**',
      'test-results/**',
    ],
  },
  {
    name: 'app/source',
    files: ['**/*.{ts,mts,vue}'],
    languageOptions: {
      globals: { ...globals.browser },
    },
  },
  pluginVue.configs['flat/essential'],
  vueTsConfigs.recommended,
  // Storybook 推奨ルール（*.stories.* と .storybook を対象にする）
  storybook.configs['flat/recommended'],
  {
    // Node 環境で動くビルドスクリプト・設定ファイル（CommonJS含む）
    name: 'app/node-scripts',
    files: ['scripts/**/*.js', '*.config.{js,ts}', 'eslint.config.js'],
    languageOptions: {
      globals: { ...globals.node },
    },
  },
  // 整形は Prettier に委ね、競合する ESLint の整形ルールを無効化する（必ず最後に置く）
  eslintConfigPrettier,
);
