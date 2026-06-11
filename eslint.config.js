import pluginVue from 'eslint-plugin-vue';
import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript';
import globals from 'globals';

export default defineConfigWithVueTs(
  {
    name: 'app/ignores',
    ignores: ['dist/**', 'node_modules/**', 'coverage/**', 'public/**'],
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
  {
    // Node 環境で動くビルドスクリプト・設定ファイル（CommonJS含む）
    name: 'app/node-scripts',
    files: ['scripts/**/*.js', '*.config.{js,ts}', 'eslint.config.js'],
    languageOptions: {
      globals: { ...globals.node },
    },
  },
);
