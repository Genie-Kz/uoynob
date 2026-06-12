/** 特技一覧を読み込むコンポーザブル */
import { loadAbilities } from '@/api/datasets';
import { useAsyncData } from './useAsyncData';

export function useAbilities() {
  const { data: abilities, isLoading, errorMessage } = useAsyncData(loadAbilities);
  return { abilities, isLoading, errorMessage };
}
