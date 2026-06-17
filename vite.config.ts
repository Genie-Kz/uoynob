/// <reference types="vitest/config" />
import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

// GitHub Pages のサブパス配信に対応するため base は相対パス。
// ルーティングはハッシュ方式なので、どのリポジトリ名でもそのまま動作する。
export default defineConfig({
  base: './',
  plugins: [
    vue(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'favicon-16x16.png',
        'favicon-32x32.png',
        'favicon-48x48.png',
        'apple-touch-icon.png',
      ],
      manifest: {
        name: 'Re:凡庸な イルルカSP',
        short_name: '凡庸なイルルカSP',
        description: 'イルルカSPのモンスター図鑑・耐性検索・ビルドシミュレーター',
        lang: 'ja',
        theme_color: '#3a52cf',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: './',
        scope: './',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // アプリシェル（JS/CSS/HTML）だけをプリキャッシュし、巨大なデータ・画像は除外する
        globPatterns: ['**/*.{js,css,html}'],
        globIgnores: ['**/data/**'],
        runtimeCaching: [
          {
            // モンスターアイコンは内容が変わらないので CacheFirst
            urlPattern: ({ url }) => url.pathname.includes('/data/monster-icons/'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'monster-icons',
              expiration: { maxEntries: 1000, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
          {
            // ゲームデータJSONは更新を取り込みつつ即表示できる StaleWhileRevalidate
            urlPattern: ({ url }) =>
              url.pathname.includes('/data/') && url.pathname.endsWith('.json'),
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'game-data', expiration: { maxEntries: 20 } },
          },
        ],
      },
    }),
  ],
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
