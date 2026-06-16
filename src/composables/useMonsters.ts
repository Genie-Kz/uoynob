/** モンスター一覧を読み込むコンポーザブル */
import { loadMonsters } from '@/shared/data/datasets';
import { useAsyncData } from './useAsyncData';

export function useMonsters() {
  const { data: monsters, isLoading, errorMessage } = useAsyncData(loadMonsters);
  return { monsters, isLoading, errorMessage };
}
