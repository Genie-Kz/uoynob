/** 特性一覧を読み込むコンポーザブル */
import { loadAttributes } from '@/shared/data/datasets';
import { useAsyncData } from './useAsyncData';

export function useAttributes() {
  const { data: attributes, isLoading, errorMessage } = useAsyncData(loadAttributes);
  return { attributes, isLoading, errorMessage };
}
