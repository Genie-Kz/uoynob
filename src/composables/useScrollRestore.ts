/**
 * 一覧ページで「詳細ページへ遷移して戻ってきたとき」にスクロール位置を復元する。
 *
 * 各一覧ページの setup で呼び出し、返り値の restoring をルート要素の
 * visibility 切り替えにバインドして使う。詳細から戻ったときだけ復元する。
 *
 * 戻った直後は離脱アニメやデータ読み込みでページが短く、その状態で合わせると
 * 最下部にクランプされたり、テーブル描画でページが伸びた瞬間にブラウザの
 * スクロールアンカリングで位置が飛んだりする。そこで「保存位置まで到達できる
 * 高さになるまで待ってから合わせる」「合わせた後に数フレーム保持してずれを
 * 打ち消す」「時間切れ時は最下部へ飛ばさず先頭のままにする」を行い、合わせ
 * 終えるまでは本文を隠してちらつきを防ぐ。
 */
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { onBeforeRouteLeave, useRoute } from 'vue-router';
import { previousRouteName } from '@/router';

// ルート（fullPath）ごとのスクロール位置。ページ遷移をまたいで保持する。
const scrollByRoute = new Map<string, number>();

// 合わせた後にこのフレーム数だけ位置を保持し、描画直後のずれを打ち消す。
const HOLD_FRAMES = 4;
// これを過ぎても十分な高さにならなければ復元を諦める（最下部へは飛ばさない）。
const RESTORE_TIMEOUT_MS = 3000;

/** 詳細ページかどうか（戻ってきたときに復元するかの判定に使う）。 */
function isDetailRoute(name: unknown): boolean {
  const value = String(name ?? '');
  return value.endsWith('-detail') || value === 'simulator-build';
}

/**
 * 一覧ページのスクロール位置を遷移をまたいで保存・復元する。
 * 返り値の restoring を本文の表示制御にバインドし、復元完了までちらつきを隠す用途で使う。
 */
export function useScrollRestore() {
  const route = useRoute();
  // この一覧ページを表す key は、インスタンス生成時の URL で固定する。
  const key = route.fullPath;
  const restoring = ref(false);
  let cleanupRestore: (() => void) | null = null;
  let restoreFrame: number | null = null;

  onMounted(() => {
    const saved = scrollByRoute.get(key);
    // 詳細ページから戻ってきて、保存位置があるときだけ復元する。
    if (!saved || saved <= 0 || !isDetailRoute(previousRouteName.value)) return;

    restoring.value = true;
    const start = performance.now();
    let holdFrames = 0;
    // 復元中はスクロールアンカリングを切る。テーブル描画でページ高さが急に伸びた
    // とき、ブラウザが scrollTo の直後にスクロール位置を勝手に動かす（最下部へ
    // 飛ぶ）のを防ぐため。
    const root = document.documentElement;
    const previousAnchor = root.style.overflowAnchor;
    root.style.overflowAnchor = 'none';

    const scheduleStep = (): void => {
      restoreFrame = requestAnimationFrame(step);
    };

    const finish = (): void => {
      if (restoreFrame !== null) {
        cancelAnimationFrame(restoreFrame);
        restoreFrame = null;
      }
      root.style.overflowAnchor = previousAnchor;
      restoring.value = false;
      cleanupRestore = null;
    };
    cleanupRestore = finish;

    const step = (): void => {
      restoreFrame = null;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      // まだ保存位置まで届く高さが無いうちはスクロールしない（最下部クランプ回避）。
      if (maxScroll < saved - 1) {
        if (performance.now() - start > RESTORE_TIMEOUT_MS) {
          finish(); // 諦める（先頭のまま）
          return;
        }
        scheduleStep();
        return;
      }
      // 十分な高さになった。合わせてから数フレーム保持する。
      window.scrollTo(0, saved);
      holdFrames += 1;
      if (holdFrames >= HOLD_FRAMES) {
        finish();
        return;
      }
      scheduleStep();
    };
    scheduleStep();
  });

  onBeforeUnmount(() => {
    cleanupRestore?.();
  });

  // 離れるとき（遷移開始時）に、その時点の正確なスクロール位置を保存する。
  onBeforeRouteLeave(() => {
    scrollByRoute.set(key, window.scrollY);
  });

  return { restoring };
}
