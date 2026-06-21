/** 特技一覧を読み込むコンポーザブル */
import { loadAbilities } from '@/shared/data/datasets';
import { useAsyncData } from './useAsyncData';

/** 特技一覧を読み込み、abilities/isLoading/errorMessage を返す。 */
export function useAbilities() {
  const { data: abilities, isLoading, errorMessage } = useAsyncData(loadAbilities);
  return { abilities, isLoading, errorMessage };
}
