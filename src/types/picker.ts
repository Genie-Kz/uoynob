/** 入れ替えモーダル（PickerModal）の選択肢 */
export interface PickerItem {
  label: string;
  value: string;
  /** label に加えて検索対象にする補助テキスト（例: スキル構成の特技・特性名） */
  searchText?: string;
}
