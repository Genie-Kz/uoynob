import { describe, expect, it } from 'vitest';
import { effectScope, nextTick } from 'vue';
import { useAsyncData } from './useAsyncData';

async function flushAsyncData(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
  await nextTick();
}

describe('useAsyncData', () => {
  it('読み込み成功時にデータとローディング状態を更新する', async () => {
    const scope = effectScope();
    const state = scope.run(() => useAsyncData(async () => 'loaded'));

    await flushAsyncData();

    expect(state?.data.value).toBe('loaded');
    expect(state?.isLoading.value).toBe(false);
    expect(state?.errorMessage.value).toBeNull();
    scope.stop();
  });

  it('スコープ破棄後に解決した結果では状態を更新しない', async () => {
    let resolve!: (value: string) => void;
    const loader = new Promise<string>((done) => {
      resolve = done;
    });
    const scope = effectScope();
    const state = scope.run(() => useAsyncData(() => loader));

    scope.stop();
    resolve('late result');
    await flushAsyncData();

    expect(state?.data.value).toBeNull();
    expect(state?.isLoading.value).toBe(true);
    expect(state?.errorMessage.value).toBeNull();
  });
});
