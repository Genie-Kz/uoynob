import { mount } from '@vue/test-utils';
import { defineComponent } from 'vue';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useResettableTimeout } from './useResettableTimeout';

afterEach(() => {
  vi.useRealTimers();
});

function mountHarness(callback: () => void) {
  return mount(
    defineComponent({
      setup() {
        const timeout = useResettableTimeout();
        return { timeout };
      },
      template: '<button type="button" @click="timeout.start(callback, 100)">start</button>',
      methods: { callback },
    }),
  );
}

describe('useResettableTimeout', () => {
  it('連続開始時は直近のタイマーだけを実行する', async () => {
    vi.useFakeTimers();
    const callback = vi.fn();
    const wrapper = mountHarness(callback);

    await wrapper.get('button').trigger('click');
    vi.advanceTimersByTime(50);
    await wrapper.get('button').trigger('click');
    vi.advanceTimersByTime(99);

    expect(callback).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('unmount時に未実行のタイマーを解除する', async () => {
    vi.useFakeTimers();
    const callback = vi.fn();
    const wrapper = mountHarness(callback);

    await wrapper.get('button').trigger('click');
    wrapper.unmount();
    vi.runAllTimers();

    expect(callback).not.toHaveBeenCalled();
  });
});
