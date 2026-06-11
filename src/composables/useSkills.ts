/** スキル一覧を読み込むコンポーザブル */
import { loadSkills } from '@/api/datasets';
import { useAsyncData } from './useAsyncData';

export function useSkills() {
  const { data: skills, isLoading, errorMessage } = useAsyncData(loadSkills);
  return { skills, isLoading, errorMessage };
}
