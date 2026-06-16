/** スキル一覧を読み込むコンポーザブル */
import { loadSkills } from '@/shared/data/datasets';
import { useAsyncData } from './useAsyncData';

export function useSkills() {
  const { data: skills, isLoading, errorMessage } = useAsyncData(loadSkills);
  return { skills, isLoading, errorMessage };
}
