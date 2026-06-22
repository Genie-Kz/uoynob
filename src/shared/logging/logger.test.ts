import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  addLogTransport,
  createConsoleTransport,
  logger,
  resetLogTransports,
  setLogTransports,
  type LogEntry,
  type LogTransport,
} from './logger';

/** 受け取ったログを記録するだけのテスト用トランスポート。 */
function recordingTransport(): { transport: LogTransport; entries: LogEntry[] } {
  const entries: LogEntry[] = [];
  return { transport: { log: (entry) => entries.push(entry) }, entries };
}

describe('logger', () => {
  // 各テストの後でトランスポートを既定へ戻し、相互干渉を防ぐ。
  afterEach(() => {
    resetLogTransports();
    vi.restoreAllMocks();
  });

  it('各レベルが正しい level でトランスポートへ流れる', () => {
    const { transport, entries } = recordingTransport();
    setLogTransports([transport]);

    logger.debug('d');
    logger.info('i');
    logger.warn('w');
    logger.error('e');

    expect(entries.map((entry) => entry.level)).toEqual(['debug', 'info', 'warn', 'error']);
  });

  it('warn/error は error と context を、info/debug は context を添える', () => {
    const { transport, entries } = recordingTransport();
    setLogTransports([transport]);
    const cause = new Error('boom');

    logger.error('失敗', cause, { id: 1 });
    logger.info('情報', { page: 'home' });

    expect(entries[0]).toMatchObject({
      level: 'error',
      message: '失敗',
      error: cause,
      context: { id: 1 },
    });
    expect(entries[1]).toMatchObject({ level: 'info', message: '情報', context: { page: 'home' } });
  });

  it('複数トランスポートへ同じログが配られる', () => {
    const a = recordingTransport();
    const b = recordingTransport();
    setLogTransports([a.transport]);
    addLogTransport(b.transport);

    logger.warn('注意');

    expect(a.entries).toHaveLength(1);
    expect(b.entries).toHaveLength(1);
  });

  it('1つのトランスポートが例外を投げても他へは届く', () => {
    const failing: LogTransport = {
      log: () => {
        throw new Error('transport down');
      },
    };
    const ok = recordingTransport();
    setLogTransports([failing, ok.transport]);

    expect(() => logger.error('x')).not.toThrow();
    expect(ok.entries).toHaveLength(1);
  });

  it('console トランスポートはレベルに対応する console メソッドを呼ぶ', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    setLogTransports([createConsoleTransport()]);

    logger.warn('注意メッセージ', new Error('e'), { a: 1 });

    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(String(warnSpy.mock.calls[0]?.[0])).toContain('[WARN] 注意メッセージ');
  });
});
