// アプリのエントリーポイント。Vue アプリを生成してルーターを組み込み、#app へマウントする。
import { createApp } from 'vue';
import App from './App.vue';
import { router } from './router';
import { initTheme } from './composables/useTheme';
// Tailwind を含む全体のスタイル（テーマ・ダークモード定義）を読み込む。
import './assets/main.css';

// 画面が描画される前にテーマ（ライト/ダーク）を適用し、初期表示のちらつきを防ぐ。
initTheme();
// ルーターを登録したうえでアプリをマウントする。
createApp(App).use(router).mount('#app');
