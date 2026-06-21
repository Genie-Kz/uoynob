/** 一覧画面用の軽量モンスターデータを読み込むコンポーザブル */
import { loadMonsterList } from '@/shared/data/datasets';
import { useAsyncData } from './useAsyncData';

/** 一覧画面用の軽量モンスターデータを読み込み、monsters/isLoading/errorMessage を返す。 */
export function useMonsterList() {
  const { data: monsters, isLoading, errorMessage } = useAsyncData(loadMonsterList);
  return { monsters, isLoading, errorMessage };
}
