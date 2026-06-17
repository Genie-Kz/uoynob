import { addons } from 'storybook/manager-api';
import { themes } from 'storybook/theming';

// Storybook の UI（サイドバー・ツールバー・アドオンパネル）をダークテーマで統一する。
addons.setConfig({
  theme: themes.dark,
});
