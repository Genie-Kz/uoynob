import { describe, expect, it, vi } from 'vitest';
import {
  clearChunkReloadAttempt,
  isChunkLoadError,
  reloadOnceForChunkLoadError,
} from './chunkLoadRecovery';

function createStorage(): Storage {
  const values = new Map<string, string>();
  return {
    get length() {
      return values.size;
    },
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => [...values.keys()][index] ?? null,
    removeItem: (key) => values.delete(key),
    setItem: (key, value) => values.set(key, value),
  };
}

describe('chunkLoadRecovery', () => {
  it('dynamic import のチャンク取得失敗を検出する', () => {
    expect(
      isChunkLoadError(
        new TypeError(
          'Failed to fetch dynamically imported module: https://example.com/assets/View-old.js',
        ),
      ),
    ).toBe(true);
  });

  it('Vite の preload エラーイベントから元エラーを検出する', () => {
    const event = new CustomEvent('vite:preloadError') as CustomEvent & { payload?: Error };
    event.payload = new Error('Unable to preload CSS for /assets/index-old.css');

    expect(isChunkLoadError(event)).toBe(true);
  });

  it('チャンク取得失敗時は同じタブで1回だけリロードする', () => {
    const storage = createStorage();
    const reload = vi.fn();
    const warn = vi.fn();
    const error = new Error('Loading chunk MonsterDetailView failed.');

    expect(
      reloadOnceForChunkLoadError(error, {
        storage,
        location: { reload } as Pick<Location, 'reload'>,
        logger: { warn },
      }),
    ).toBe(true);
    expect(reload).toHaveBeenCalledTimes(1);

    expect(
      reloadOnceForChunkLoadError(error, {
        storage,
        location: { reload } as Pick<Location, 'reload'>,
        logger: { warn },
      }),
    ).toBe(false);
    expect(reload).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it('正常遷移後に復旧フラグを消せる', () => {
    const storage = createStorage();
    const reload = vi.fn();
    const error = new Error('Failed to fetch dynamically imported module');

    reloadOnceForChunkLoadError(error, {
      storage,
      location: { reload } as Pick<Location, 'reload'>,
    });
    clearChunkReloadAttempt(storage);

    expect(
      reloadOnceForChunkLoadError(error, {
        storage,
        location: { reload } as Pick<Location, 'reload'>,
      }),
    ).toBe(true);
    expect(reload).toHaveBeenCalledTimes(2);
  });

  it('通常のエラーではリロードしない', () => {
    const reload = vi.fn();

    expect(
      reloadOnceForChunkLoadError(new Error('普通の処理エラー'), {
        storage: createStorage(),
        location: { reload } as Pick<Location, 'reload'>,
      }),
    ).toBe(false);
    expect(reload).not.toHaveBeenCalled();
  });
});
