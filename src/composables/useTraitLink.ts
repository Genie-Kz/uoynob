/** 特性名から特性詳細ページへのリンクを解決するコンポーザブル */
import { computed } from 'vue';
import type { RouteLocationRaw } from 'vue-router';
import { normalizeNfkcCompact } from '@/shared/search/normalization';
import { useAttributes } from './useAttributes';

/** 特性名から特性詳細ページへの遷移先を解決する traitRoute を返す。 */
export function useTraitLink() {
  const { attributes } = useAttributes();

  // 正規化した特性名 → 特性id の索引。表記ゆれを吸収して名前から id を引けるようにする。
  const idByName = computed(() => {
    const map = new Map<string, string>();
    for (const attribute of attributes.value ?? []) {
      map.set(normalizeNfkcCompact(attribute.name), attribute.id);
    }
    return map;
  });

  /** 特性詳細への遷移先。対応する特性が無ければ null（プレーンテキストで表示する想定）。 */
  function traitRoute(name: string): RouteLocationRaw | null {
    const id = idByName.value.get(normalizeNfkcCompact(name));
    return id ? { name: 'attribute-detail', params: { id } } : null;
  }

  return { traitRoute };
}
