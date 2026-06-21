/**
 * 直近のタイマーだけを有効にし、コンポーネント破棄時には必ず解除する小さなヘルパー。
 * ボタン押下フィードバックのように「一定時間だけ状態を戻す」用途で、古いタイマーの残留を防ぐ。
 */
import { onBeforeUnmount } from 'vue';

/** 直近の1件だけ有効なタイマー。start で予約・clear で解除し、破棄時に自動解除する。 */
export function useResettableTimeout() {
  let timeoutId: number | null = null;

  function clear(): void {
    if (timeoutId === null) return;
    window.clearTimeout(timeoutId);
    timeoutId = null;
  }

  function start(callback: () => void, delay: number): void {
    // 同じUIで連続操作された場合は、古い復帰予約を捨てて最新の操作を基準にする。
    clear();
    timeoutId = window.setTimeout(() => {
      timeoutId = null;
      callback();
    }, delay);
  }

  onBeforeUnmount(clear);

  return { start, clear };
}
