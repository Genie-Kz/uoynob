/// <reference types="vitest/config" />
import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import tailwindcss from '@tailwindcss/vite';

// GitHub Pages のサブパス配信に対応するため base は相対パス。
// ルーティングはハッシュ方式なので、どのリポジトリ名でもそのまま動作する。
export default defineConfig({
  base: './',
  plugins: [vue(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/**/*.{test,spec}.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['src/**/*.{ts,vue}'],
      exclude: ['src/**/*.{test,spec}.ts', 'src/test/**', 'src/**/*.d.ts'],
      // 現状値より少し低い下限。これを下回ったら CI で失敗させ、カバレッジの後退を防ぐ
      thresholds: {
        statements: 30,
        branches: 22,
        functions: 22,
        lines: 30,
      },
    },
  },
});
