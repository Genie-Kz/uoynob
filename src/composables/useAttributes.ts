/** 特性一覧を読み込むコンポーザブル */
import { loadAttributes } from '@/shared/data/datasets';
import { useAsyncData } from './useAsyncData';

/** 特性一覧を読み込み、attributes/isLoading/errorMessage を返す。 */
export function useAttributes() {
  const { data: attributes, isLoading, errorMessage } = useAsyncData(loadAttributes);
  return { attributes, isLoading, errorMessage };
}
