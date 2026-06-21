/** スキル一覧を読み込むコンポーザブル */
import { loadSkills } from '@/shared/data/datasets';
import { useAsyncData } from './useAsyncData';

/** スキル一覧を読み込み、skills/isLoading/errorMessage を返す。 */
export function useSkills() {
  const { data: skills, isLoading, errorMessage } = useAsyncData(loadSkills);
  return { skills, isLoading, errorMessage };
}
