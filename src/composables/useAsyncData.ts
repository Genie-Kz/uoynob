/** 非同期データ読み込みを reactive な状態として扱う汎用コンポーザブル */
import { ref, shallowRef, type Ref, type ShallowRef } from 'vue';

export interface AsyncData<T> {
  data: ShallowRef<T | null>;
  isLoading: Ref<boolean>;
  errorMessage: Ref<string | null>;
}

export function useAsyncData<T>(loader: () => Promise<T>): AsyncData<T> {
  const data = shallowRef<T | null>(null);
  const isLoading = ref(true);
  const errorMessage = ref<string | null>(null);

  // 呼び出し時に読み込みを開始し、結果・エラー・完了を reactive な状態へ反映する。
  loader()
    // 成功時はデータを格納する
    .then((result) => {
      data.value = result;
    })
    // 失敗時はエラーメッセージを格納する（Error 以外は汎用文言にする）
    .catch((error: unknown) => {
      errorMessage.value = error instanceof Error ? error.message : '読み込みに失敗しました';
    })
    // 成否に関わらずローディングを終了する
    .finally(() => {
      isLoading.value = false;
    });

  return { data, isLoading, errorMessage };
}
