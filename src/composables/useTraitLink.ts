/** 特性名から特性詳細ページへのリンクを解決するコンポーザブル */
import { computed } from 'vue';
import type { RouteLocationRaw } from 'vue-router';
import { useAttributes } from './useAttributes';

/** 特性名の表記揺れ（全角半角・空白）を吸収する */
function normalizeTraitName(name: string): string {
  return name.normalize('NFKC').replace(/[\s　]/g, '');
}

export function useTraitLink() {
  const { attributes } = useAttributes();

  const idByName = computed(() => {
    const map = new Map<string, string>();
    for (const attribute of attributes.value ?? []) {
      map.set(normalizeTraitName(attribute.name), attribute.id);
    }
    return map;
  });

  /** 特性詳細への遷移先。対応する特性が無ければ null（プレーンテキストで表示する想定）。 */
  function traitRoute(name: string): RouteLocationRaw | null {
    const id = idByName.value.get(normalizeTraitName(name));
    return id ? { name: 'attribute-detail', params: { id } } : null;
  }

  return { traitRoute };
}
