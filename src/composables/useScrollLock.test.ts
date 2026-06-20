import { mount } from '@vue/test-utils';
import { defineComponent, ref } from 'vue';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useScrollLock } from './useScrollLock';

afterEach(() => {
  document.body.removeAttribute('style');
  vi.restoreAllMocks();
});

function mountLockHarness(initialActive = true) {
  return mount(
    defineComponent({
      setup() {
        const active = ref(initialActive);
        useScrollLock(active);
        return { active };
      },
      template: '<div />',
    }),
  );
}

describe('useScrollLock', () => {
  it('解除時に元のbody inline styleを復元する', async () => {
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
    vi.spyOn(window, 'scrollY', 'get').mockReturnValue(120);
    document.body.style.position = 'relative';
    document.body.style.top = '4px';
    document.body.style.width = '80%';
    const wrapper = mountLockHarness();

    expect(document.body.style.position).toBe('fixed');
    expect(document.body.style.top).toBe('-120px');

    wrapper.unmount();

    expect(document.body.style.position).toBe('relative');
    expect(document.body.style.top).toBe('4px');
    expect(document.body.style.width).toBe('80%');
    expect(scrollTo).toHaveBeenCalledWith(0, 120);
  });

  it('複数ロック時は最後の解除までbodyを固定し続ける', () => {
    vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
    const first = mountLockHarness();
    const second = mountLockHarness();

    first.unmount();
    expect(document.body.style.position).toBe('fixed');

    second.unmount();
    expect(document.body.style.position).toBe('');
  });
});
