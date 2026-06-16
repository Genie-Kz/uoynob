import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import PickerModal from './PickerModal.vue';

// 読みがな辞書はネットワーク取得なのでモックする
vi.mock('@/shared/data/datasets', () => ({
  loadSearchReadings: () => Promise.resolve({ labels: {} }),
}));

const items = [
  { value: 'a', label: 'アロー' },
  { value: 'b', label: 'ベータ' },
  { value: 'c', label: 'ガンマ' },
];

function mountModal(props: Record<string, unknown> = {}) {
  return mount(PickerModal, {
    props: { open: true, title: 'テスト選択', items, ...props },
  });
}

function findButton(wrapper: ReturnType<typeof mountModal>, text: string) {
  return wrapper.findAll('button').find((b) => b.text() === text)!;
}

describe('PickerModal', () => {
  it('open=false では何も描画しない', () => {
    const wrapper = mountModal({ open: false });
    expect(wrapper.find('.modal-panel').exists()).toBe(false);
  });

  it('タイトルと候補ボタンを表示する', () => {
    const wrapper = mountModal();
    expect(wrapper.text()).toContain('テスト選択');
    const labels = wrapper.findAll('.flex-wrap button').map((b) => b.text());
    expect(labels).toEqual(['アロー', 'ベータ', 'ガンマ']);
  });

  it('未選択では選択ボタンが無効、候補選択で有効化され select を emit する', async () => {
    const wrapper = mountModal();
    const confirm = findButton(wrapper, '選択');
    expect(confirm.attributes('disabled')).toBeDefined();

    await findButton(wrapper, 'ベータ').trigger('click');
    expect(confirm.attributes('disabled')).toBeUndefined();

    await confirm.trigger('click');
    expect(wrapper.emitted('select')?.[0]).toEqual(['b']);
  });

  it('閉じるで close を emit する', async () => {
    const wrapper = mountModal();
    await findButton(wrapper, '閉じる').trigger('click');
    expect(wrapper.emitted('close')).toBeTruthy();
  });

  it('検索で候補を絞り込む', async () => {
    const wrapper = mountModal();
    await wrapper.find('input[type="text"]').setValue('ベータ');
    const labels = wrapper.findAll('.flex-wrap button').map((b) => b.text());
    expect(labels).toEqual(['ベータ']);
  });
});
