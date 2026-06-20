// アプリのエントリーポイント。Vue アプリを生成してルーターを組み込み、#app へマウントする。
import { createApp } from 'vue';
import App from './App.vue';
import { router } from './router';
import { initTheme } from './composables/useTheme';
// Tailwind を含む全体のスタイル（テーマ・ダークモード定義）を読み込む。
import './assets/main.css';

// 画面が描画される前にテーマ（ライト/ダーク）を適用し、初期表示のちらつきを防ぐ。
initTheme();

// ルーターを登録したアプリ。マウントは初期遷移の解決を待ってから行う（下記）。
const app = createApp(App).use(router);

// ルーターの初期遷移が解決してからマウントする。
// 解決前にマウントすると、最初の描画時点では route.name が未確定（undefined）で、
// ホーム判定・ページタイトル・2カラム/1カラムのレイアウトが一瞬ぶれる
// （PC でホームが通常ページ扱いになり中央寄せ→左寄せに揺れる等）。
// isReady() を待つことで、最初の描画から正しい route 情報で描画できる。
// 初期遷移が失敗した場合でもマウントは行い、画面側のエラー表示やチャンク復旧に委ねる。
router.isReady().finally(() => {
  app.mount('#app');
});
