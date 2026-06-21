/**
 * デプロイ後に古いタブが旧ハッシュの遅延読み込みチャンクを参照した場合の復旧処理。
 * GitHub Pages では新しいビルドが配置されると古い assets/*.js が消えるため、
 * ルート遷移時の dynamic import が 404 になり、画面が止まることがある。
 */
import type { Router } from 'vue-router';

const CHUNK_RELOAD_STORAGE_KEY = 'uoynob:chunk-load-reload-attempted';

const CHUNK_LOAD_ERROR_PATTERNS = [
  'Failed to fetch dynamically imported module',
  'Importing a module script failed',
  'error loading dynamically imported module',
  'Unable to preload CSS',
  'ChunkLoadError',
  'Loading chunk',
];

type ReloadLocation = Pick<Location, 'reload'>;
type WarningLogger = Pick<Console, 'warn'>;

interface RecoveryDependencies {
  storage?: Storage;
  location?: ReloadLocation;
  logger?: WarningLogger;
}

function errorTextOf(error: unknown): string {
  // Error オブジェクトなら name/message/stack をまとめて見る。
  if (error instanceof Error) return [error.name, error.message, error.stack].join('\n');
  // vite:preloadError は CustomEvent の payload に本体エラーが入る。
  if (error instanceof CustomEvent) {
    const customEvent = error as CustomEvent & { payload?: unknown };
    return errorTextOf(customEvent.payload ?? customEvent.detail);
  }
  return String(error);
}

/** エラーが遅延読み込みチャンクの取得失敗（旧チャンク404など）かどうかを判定する。 */
export function isChunkLoadError(error: unknown): boolean {
  const text = errorTextOf(error);
  return CHUNK_LOAD_ERROR_PATTERNS.some((pattern) => text.includes(pattern));
}

function defaultDependencies(): Required<RecoveryDependencies> {
  return {
    storage: window.sessionStorage,
    location: window.location,
    logger: console,
  };
}

function hasReloadAlreadyBeenAttempted(storage: Storage): boolean {
  try {
    return storage.getItem(CHUNK_RELOAD_STORAGE_KEY) === 'true';
  } catch {
    // sessionStorage が使えない環境では、無限リロードを避けるため自動復旧を行わない。
    return true;
  }
}

function markReloadAttempted(storage: Storage): boolean {
  try {
    storage.setItem(CHUNK_RELOAD_STORAGE_KEY, 'true');
    return true;
  } catch {
    return false;
  }
}

/** リロード試行フラグを消す（正常遷移後に呼び、次回デプロイでも自動復旧できるようにする）。 */
export function clearChunkReloadAttempt(storage: Storage = window.sessionStorage): void {
  try {
    storage.removeItem(CHUNK_RELOAD_STORAGE_KEY);
  } catch {
    // sessionStorage が使えない場合は、復旧フラグの掃除も不要。
  }
}

/**
 * チャンク読み込みエラーなら一度だけページをリロードして復旧を試みる。
 * リロード済みフラグで無限リロードを防ぎ、復旧したかどうかを真偽値で返す。
 */
export function reloadOnceForChunkLoadError(
  error: unknown,
  dependencies: RecoveryDependencies = {},
): boolean {
  if (!isChunkLoadError(error)) return false;

  const { storage, location, logger } = { ...defaultDependencies(), ...dependencies };

  // 同じ古いタブで何度もリロードし続けると、オフライン時などに抜けられなくなる。
  if (hasReloadAlreadyBeenAttempted(storage)) {
    logger.warn('Chunk load failed after a reload attempt. Keeping the current page.', error);
    return false;
  }

  // リロード前に必ずフラグを立て、次の読み込みでも同じチャンクが失敗した場合は止める。
  if (!markReloadAttempted(storage)) return false;
  location.reload();
  return true;
}

/** ルーターと window に、チャンク読み込み失敗時の自動リロード復旧を組み込む。 */
export function installChunkLoadRecovery(router: Router): void {
  // ルートコンポーネントの dynamic import 失敗は Vue Router のエラーとして届く。
  router.onError((error) => {
    reloadOnceForChunkLoadError(error);
  });

  // Vite の modulepreload / dynamic import 失敗は vite:preloadError として届くことがある。
  window.addEventListener('vite:preloadError', (event) => {
    if (!isChunkLoadError(event)) return;
    event.preventDefault();
    reloadOnceForChunkLoadError(event);
  });

  // 正常に画面遷移できたら、次回デプロイ時にも自動復旧できるようフラグを戻す。
  router.afterEach((_to, _from, failure) => {
    if (!failure) clearChunkReloadAttempt();
  });
}
