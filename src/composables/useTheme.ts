/** ダーク／ライトモードの管理（localStorage に保持） */
import { ref } from 'vue';

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'theme';

/** モジュールスコープの単一状態（どこから使っても同じ値を共有する） */
const theme = ref<Theme>('light');

function readStoredTheme(): Theme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
  } catch {
    /* localStorage が使えない環境では既定値にフォールバック */
  }
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(value: Theme): void {
  document.documentElement.classList.toggle('dark', value === 'dark');
}

/** アプリ起動時に一度呼ぶ。保存済みテーマ（なければOS設定）を適用する。 */
export function initTheme(): void {
  theme.value = readStoredTheme();
  applyTheme(theme.value);
}

export function useTheme() {
  function setTheme(value: Theme): void {
    theme.value = value;
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch {
      /* 保存できなくても見た目だけは切り替える */
    }
    applyTheme(value);
  }
  function toggleTheme(): void {
    setTheme(theme.value === 'dark' ? 'light' : 'dark');
  }
  return { theme, setTheme, toggleTheme };
}
