/**
 * モーダル表示中に背景（ページ全体）のスクロールを止めるコンポーザブル。
 * iOS でも確実に効くよう body を position:fixed で固定する方式を使い、
 * 解除時に元のスクロール位置へ戻す。複数モーダルのネストにも参照カウントで対応する。
 */
import { onBeforeUnmount, watch, type Ref } from 'vue';

let lockCount = 0;
let savedScrollY = 0;

function freezeBody(): void {
  savedScrollY = window.scrollY;
  const { style } = document.body;
  style.position = 'fixed';
  style.top = `-${savedScrollY}px`;
  style.left = '0';
  style.right = '0';
  style.width = '100%';
}

function unfreezeBody(): void {
  const { style } = document.body;
  style.position = '';
  style.top = '';
  style.left = '';
  style.right = '';
  style.width = '';
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
