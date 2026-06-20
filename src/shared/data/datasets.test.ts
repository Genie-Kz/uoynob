import { afterEach, describe, expect, it, vi } from 'vitest';

function jsonResponse<T>(value: T): Response {
  return {
    ok: true,
    status: 200,
    json: async () => value,
  } as Response;
}

function errorResponse(status: number): Response {
  return {
    ok: false,
    status,
    json: async () => null,
  } as Response;
}

async function importDatasets() {
  vi.resetModules();
  return await import('./datasets');
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('datasets', () => {
  it('同じデータセットの取得Promiseをキャッシュする', async () => {
    const fetchMock = vi.fn(async () => jsonResponse([{ id: '001' }]));
    vi.stubGlobal('fetch', fetchMock);
    const { loadSkills } = await importDatasets();

    const first = await loadSkills();
    const second = await loadSkills();

    expect(first).toEqual([{ id: '001' }]);
    expect(second).toBe(first);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('取得に失敗したデータセットは次回再試行できる', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(errorResponse(503))
      .mockResolvedValueOnce(jsonResponse([{ id: '001-1' }]));
    vi.stubGlobal('fetch', fetchMock);
    const { loadMonsterList } = await importDatasets();

    await expect(loadMonsterList()).rejects.toThrow(
      'データ取得に失敗しました (503): data/monsters-list.json',
    );
    await expect(loadMonsterList()).resolves.toEqual([{ id: '001-1' }]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
