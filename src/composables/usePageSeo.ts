import { toValue, watchEffect, type MaybeRefOrGetter } from 'vue';

const SITE_NAME = 'Re:凡庸な イルルカSP';
export const DEFAULT_DESCRIPTION =
  'ドラゴンクエストモンスターズ２ イルとルカの不思議な鍵SPの攻略データベース。モンスター図鑑、耐性・特性検索、スキル、ビルドシミュレーターを収録。';

function setMeta(selector: string, content: string): void {
  document.querySelector<HTMLMetaElement>(selector)?.setAttribute('content', content);
}

/** ページ内容に合わせてtitle・description・SNS向けメタ情報を更新する。 */
export function usePageSeo(
  pageTitle: MaybeRefOrGetter<string | null | undefined>,
  description: MaybeRefOrGetter<string | null | undefined> = DEFAULT_DESCRIPTION,
): void {
  watchEffect(() => {
    const title = toValue(pageTitle)?.trim();
    const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME}（再現版）`;
    const pageDescription = toValue(description)?.trim() || DEFAULT_DESCRIPTION;

    document.title = fullTitle;
    setMeta('meta[name="description"]', pageDescription);
    setMeta('meta[property="og:title"]', fullTitle);
    setMeta('meta[property="og:description"]', pageDescription);
    setMeta('meta[name="twitter:title"]', fullTitle);
    setMeta('meta[name="twitter:description"]', pageDescription);
  });
}
