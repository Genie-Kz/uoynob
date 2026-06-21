/** モンスター一覧を読み込むコンポーザブル */
import { loadMonsters } from '@/shared/data/datasets';
import { useAsyncData } from './useAsyncData';

/** モンスター一覧（全フィールド）を読み込み、monsters/isLoading/errorMessage を返す。 */
export function useMonsters() {
  const { data: monsters, isLoading, errorMessage } = useAsyncData(loadMonsters);
  return { monsters, isLoading, errorMessage };
}
