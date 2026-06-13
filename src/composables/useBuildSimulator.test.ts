import { nextTick, ref } from 'vue';
import { describe, expect, it } from 'vitest';
import { createMonster } from '@/test/fixtures';
import type { Attribute } from '@/types/attribute';
import { useBuildSimulator } from './useBuildSimulator';

function createAttribute(id: string, name: string): Attribute {
  return {
    id,
    name,
    category: '特性効果系',
    description: '',
    descriptionSp: '',
    monsters: [],
    skills: [],
  };
}

describe('useBuildSimulator', () => {
  it('特性をリセットするとSP化の状態もリセットする', async () => {
    const target = createMonster({ 新生前特性1: 'つねにアタックカンタ' });
    const monster = ref(target);
    const monsters = ref([target]);
    const skills = ref([]);
    const weapons = ref([]);
    const attributes = ref([createAttribute('079', 'つねにアタックカンタ')]);
    const simulator = useBuildSimulator(monster, monsters, skills, weapons, attributes, {});

    await nextTick();
    simulator.toggleSp('つねにアタックカンタ');
    expect(simulator.spTraitNames.value).toEqual(['つねにアタックカンタ']);

    simulator.resetTraits();

    expect(simulator.spTraitNames.value).toEqual([]);
  });

  it('SP化した特性を特性IDで共有URLに保存する', async () => {
    const target = createMonster({ 新生前特性1: 'つねにアタックカンタ' });
    const attributes = ref([
      createAttribute('079', 'つねにアタックカンタ'),
      createAttribute('109', 'ＨＰバブル'),
    ]);
    const simulator = useBuildSimulator(ref(target), ref([target]), ref([]), ref([]), attributes, {});

    await nextTick();
    simulator.toggleSp('ＨＰバブル');
    simulator.toggleSp('つねにアタックカンタ');

    expect(simulator.shareQuery.value.x).toBe('109-079');
  });

  it('特性ID形式の共有URLからSP化状態を復元する', async () => {
    const target = createMonster();
    const attributes = ref([
      createAttribute('079', 'つねにアタックカンタ'),
      createAttribute('109', 'ＨＰバブル'),
    ]);
    const simulator = useBuildSimulator(
      ref(target),
      ref([target]),
      ref([]),
      ref([]),
      attributes,
      { x: '109-079' },
    );

    await nextTick();

    expect(simulator.spTraitNames.value).toEqual(['ＨＰバブル', 'つねにアタックカンタ']);
  });

  it('旧形式の共有URLからもSP化状態を復元する', async () => {
    const target = createMonster();
    const attributes = ref([createAttribute('079', 'つねにアタックカンタ')]);
    const simulator = useBuildSimulator(
      ref(target),
      ref([target]),
      ref([]),
      ref([]),
      attributes,
      { x: 'ＨＰバブル,つねにアタックカンタ' },
    );

    await nextTick();

    expect(simulator.spTraitNames.value).toEqual(['ＨＰバブル', 'つねにアタックカンタ']);
  });
});
