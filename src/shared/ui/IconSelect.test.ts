import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import IconSelect from './IconSelect.vue';

const options = [
  { value: '', label: '全系統' },
  { value: 'slime', label: 'スライム系' },
  { value: 'dragon', label: 'ドラゴン系' },
];

function mountSelect(modelValue = '') {
  return mount(IconSelect, {
    props: {
      options,
      modelValue,
      ariaLabel: '系統で絞り込み',
      'onUpdate:modelValue': () => {},
    },
  });
}

describe('IconSelect', () => {
  it('選択中のラベルを表示し、初期状態は閉じている', () => {
    const wrapper = mountSelect('slime');
    expect(wrapper.get('button').text()).toContain('スライム系');
    expect(wrapper.find('[role="listbox"]').exists()).toBe(false);
    expect(wrapper.get('button').attributes('aria-expanded')).toBe('false');
  });

  it('クリックで開くと role=option が並び、選択中に aria-selected が付く', async () => {
    const wrapper = mountSelect('slime');
    await wrapper.get('button').trigger('click');

    const optionEls = wrapper.findAll('[role="option"]');
    expect(optionEls).toHaveLength(3);
    expect(wrapper.get('button').attributes('aria-expanded')).toBe('true');
    const selected = optionEls.find((el) => el.attributes('aria-selected') === 'true');
    expect(selected?.text()).toContain('スライム系');
  });

  it('選択肢クリックで update:modelValue を発火して閉じる', async () => {
    const wrapper = mountSelect('');
    await wrapper.get('button').trigger('click');
    await wrapper.findAll('[role="option"]')[2]!.trigger('click');

    const emits = wrapper.emitted('update:modelValue') ?? [];
    expect(emits[emits.length - 1]).toEqual(['dragon']);
    expect(wrapper.find('[role="listbox"]').exists()).toBe(false);
  });

  it('キーボード操作: ArrowDown で開き、移動して Enter で選択する', async () => {
    const wrapper = mountSelect('');
    const button = wrapper.get('button');

    await button.trigger('keydown', { key: 'ArrowDown' }); // open（active=先頭）
    await button.trigger('keydown', { key: 'ArrowDown' }); // active=1
    await button.trigger('keydown', { key: 'Enter' });

    const emits = wrapper.emitted('update:modelValue') ?? [];
    expect(emits[emits.length - 1]).toEqual(['slime']);
  });

  it('Escape で閉じる', async () => {
    const wrapper = mountSelect('');
    const button = wrapper.get('button');
    await button.trigger('click');
    expect(wrapper.find('[role="listbox"]').exists()).toBe(true);

    await button.trigger('keydown', { key: 'Escape' });
    expect(wrapper.find('[role="listbox"]').exists()).toBe(false);
  });
});
