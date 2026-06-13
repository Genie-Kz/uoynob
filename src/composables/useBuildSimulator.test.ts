import { nextTick, ref } from 'vue';
import { describe, expect, it } from 'vitest';
import { createMonster } from '@/test/fixtures';
import { useBuildSimulator } from './useBuildSimulator';

describe('useBuildSimulator', () => {
  it('特性をリセットするとSP化の状態もリセットする', async () => {
    const target = createMonster({ 新生前特性1: 'つねにアタックカンタ' });
    const monster = ref(target);
    const monsters = ref([target]);
    const skills = ref([]);
    const weapons = ref([]);
    const simulator = useBuildSimulator(monster, monsters, skills, weapons, {});

    await nextTick();
    simulator.toggleSp('つねにアタックカンタ');
    expect(simulator.spTraitNames.value).toEqual(['つねにアタックカンタ']);

    simulator.resetTraits();

    expect(simulator.spTraitNames.value).toEqual([]);
  });
});
