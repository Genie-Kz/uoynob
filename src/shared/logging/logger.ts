/**
 * アプリ共通のログ出力レイヤー。
 *
 * 呼び出し側は {@link logger} の debug/info/warn/error だけを使う。実際の出力先は
 * {@link LogTransport} として抽象化してあり、現状は開発環境のみ console に出す。
 *
 * ## 将来 Sentry などを導入するとき
 * 呼び出し側（logger.error(...) など）は一切変更せず、トランスポートを足すだけでよい。
 *
 * ```ts
 * // 例: src/shared/logging/sentryTransport.ts を作って実装する
 * import * as Sentry from '@sentry/vue';
 * import type { LogTransport } from './logger';
 * export const sentryTransport: LogTransport = {
 *   log({ level, message, error, context }) {
 *     if (error !== undefined) Sentry.captureException(error, { extra: { message, ...context } });
 *     else Sentry.captureMessage(message, { level, extra: context });
 *   },
 * };
 *
 * // main.ts で本番のみ登録する
 * if (import.meta.env.PROD) addLogTransport(sentryTransport);
 * ```
 */

/** ログの重大度。 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/** ログに添える構造化コンテキスト（Sentry の extra/tags 相当）。 */
export type LogContext = Record<string, unknown>;

/** 1件分のログ。トランスポートはこれを受け取って各出力先へ送る。 */
export interface LogEntry {
  level: LogLevel;
  message: string;
  /** 例外オブジェクト。warn/error で握りつぶした原因を渡す（captureException 用）。 */
  error?: unknown;
  /** 追加の文脈情報（識別子・状態など）。 */
  context?: LogContext;
}

/** ログの出力先。console・Sentry などをこのインターフェースで差し替える。 */
export interface LogTransport {
  log(entry: LogEntry): void;
}

/** LogLevel → console のメソッド名。 */
const CONSOLE_METHOD: Record<LogLevel, 'debug' | 'info' | 'warn' | 'error'> = {
  debug: 'debug',
  info: 'info',
  warn: 'warn',
  error: 'error',
};

/** ブラウザの console へ出力するトランスポート（主に開発環境向け）。 */
export function createConsoleTransport(): LogTransport {
  return {
    log({ level, message, error, context }) {
      // レベルに応じた console メソッドへ、メッセージ・文脈・例外を順に渡す。
      const args: unknown[] = [`[${level.toUpperCase()}] ${message}`];
      if (context) args.push(context);
      if (error !== undefined) args.push(error);
      console[CONSOLE_METHOD[level]](...args);
    },
  };
}

/** 既定のトランスポート。開発環境のみ console に出し、本番は何も出さない。 */
function defaultTransports(): LogTransport[] {
  return import.meta.env.DEV ? [createConsoleTransport()] : [];
}

let transports: LogTransport[] = defaultTransports();

/** 全トランスポートへ1件のログを流す。出力先の失敗でアプリを止めない。 */
function emit(entry: LogEntry): void {
  for (const transport of transports) {
    try {
      transport.log(entry);
    } catch {
      /* ログ出力自体の失敗はアプリの動作に影響させない */
    }
  }
}

/**
 * アプリ共通のロガー。
 * warn/error は握りつぶした例外を第2引数で渡せる（info/debug は文脈のみ）。
 */
export const logger = {
  /** 詳細な開発用ログ。 */
  debug(message: string, context?: LogContext): void {
    emit({ level: 'debug', message, context });
  },
  /** 通常の情報ログ。 */
  info(message: string, context?: LogContext): void {
    emit({ level: 'info', message, context });
  },
  /** 想定内だが注意したい事象（フォールバックした等）。 */
  warn(message: string, error?: unknown, context?: LogContext): void {
    emit({ level: 'warn', message, error, context });
  },
  /** 想定外の失敗。例外オブジェクトを添えて記録する。 */
  error(message: string, error?: unknown, context?: LogContext): void {
    emit({ level: 'error', message, error, context });
  },
};

/** トランスポートを丸ごと差し替える（将来 Sentry を有効化する際などに使う）。 */
export function setLogTransports(next: LogTransport[]): void {
  transports = next;
}

/** トランスポートを1つ追加する（既定の console 出力を残したまま Sentry を足す等）。 */
export function addLogTransport(transport: LogTransport): void {
  transports = [...transports, transport];
}

/** トランスポートを既定（DEV: console / PROD: なし）へ戻す。主にテストの後始末用。 */
export function resetLogTransports(): void {
  transports = defaultTransports();
}
