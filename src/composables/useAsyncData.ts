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

  loader()
    .then((result) => {
      data.value = result;
    })
    .catch((error: unknown) => {
      errorMessage.value = error instanceof Error ? error.message : '読み込みに失敗しました';
    })
    .finally(() => {
      isLoading.value = false;
    });

  return { data, isLoading, errorMessage };
}
