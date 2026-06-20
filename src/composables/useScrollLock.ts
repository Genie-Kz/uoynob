/**
 * モーダル表示中に背景（ページ全体）のスクロールを止めるコンポーザブル。
 * iOS でも確実に効くよう body を position:fixed で固定する方式を使い、
 * 解除時に元のスクロール位置へ戻す。複数モーダルのネストにも参照カウントで対応する。
 */
import { onBeforeUnmount, watch, type Ref } from 'vue';

let lockCount = 0;
let savedScrollY = 0;
let savedBodyStyle: {
  position: string;
  top: string;
  left: string;
  right: string;
  width: string;
} | null = null;

function freezeBody(): void {
  savedScrollY = window.scrollY;
  const { style } = document.body;
  // アプリ外のCSSや別処理が設定した inline style を、解除時に消さず復元する。
  savedBodyStyle = {
    position: style.position,
    top: style.top,
    left: style.left,
    right: style.right,
    width: style.width,
  };
  style.position = 'fixed';
  style.top = `-${savedScrollY}px`;
  style.left = '0';
  style.right = '0';
  style.width = '100%';
}

function unfreezeBody(): void {
  const { style } = document.body;
  const restoreStyle = savedBodyStyle;
  style.position = restoreStyle?.position ?? '';
  style.top = restoreStyle?.top ?? '';
  style.left = restoreStyle?.left ?? '';
  style.right = restoreStyle?.right ?? '';
  style.width = restoreStyle?.width ?? '';
  savedBodyStyle = null;
  window.scrollTo(0, savedScrollY);
}

/** active が true の間だけ背景スクロールを止める。 */
export function useScrollLock(active: Ref<boolean>): void {
  let locked = false;

  function lock(): void {
    if (locked) return;
    locked = true;
    if (lockCount === 0) freezeBody();
    lockCount += 1;
  }

  function unlock(): void {
    if (!locked) return;
    locked = false;
    lockCount -= 1;
    if (lockCount === 0) unfreezeBody();
  }

  watch(active, (value) => (value ? lock() : unlock()), { immediate: true });
  onBeforeUnmount(unlock);
}
