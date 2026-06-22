/** 非同期データ読み込みを reactive な状態として扱う汎用コンポーザブル */
import { onScopeDispose, ref, shallowRef, type Ref, type ShallowRef } from 'vue';
import { logger } from '@/shared/logging/logger';

/** 非同期読み込みの状態（データ・ローディング・エラーメッセージ）。 */
export interface AsyncData<T> {
  data: ShallowRef<T | null>;
  isLoading: Ref<boolean>;
  errorMessage: Ref<string | null>;
}

/**
 * loader を呼んで結果を reactive な {@link AsyncData} として返す。
 * スコープ破棄後に遅れて解決した結果は無視するため、画面遷移後の更新事故を防ぐ。
 */
export function useAsyncData<T>(loader: () => Promise<T>): AsyncData<T> {
  const data = shallowRef<T | null>(null);
  const isLoading = ref(true);
  const errorMessage = ref<string | null>(null);
  let disposed = false;

  // 画面遷移などで呼び出し元のスコープが破棄された後は、遅れて返った結果で状態を更新しない。
  onScopeDispose(() => {
    disposed = true;
  }, true);

  // 呼び出し時に読み込みを開始し、結果・エラー・完了を reactive な状態へ反映する。
  loader()
    // 成功時はデータを格納する
    .then((result) => {
      if (disposed) return;
      data.value = result;
    })
    // 失敗時はエラーメッセージを格納する（Error 以外は汎用文言にする）
    .catch((error: unknown) => {
      if (disposed) return;
      errorMessage.value = error instanceof Error ? error.message : '読み込みに失敗しました';
      // 画面にはユーザー向け文言を出すが、原因調査用に例外そのものも記録する。
      logger.error('非同期データの読み込みに失敗しました', error);
    })
    // 成否に関わらずローディングを終了する
    .finally(() => {
      if (disposed) return;
      isLoading.value = false;
    });

  return { data, isLoading, errorMessage };
}
