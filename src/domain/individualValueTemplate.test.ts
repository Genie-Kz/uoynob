import { describe, expect, it } from 'vitest';
import { individualValuesFromTemplate } from './individualValueTemplate';

describe('individualValuesFromTemplate', () => {
  it('3文字の全大文字表記は指定を最大、未指定を最小にする', () => {
    expect(individualValuesFromTemplate('HMS')).toEqual({
      HP: 100,
      MP: 200,
      攻撃力: -100,
      守備力: -200,
      素早さ: 100,
      賢さ: -200,
    });
  });

  it('大小文字の混在表記は小文字を最小、未指定を0にする', () => {
    expect(individualValuesFromTemplate('HMas')).toEqual({
      HP: 100,
      MP: 200,
      攻撃力: -100,
      守備力: 0,
      素早さ: -100,
      賢さ: 0,
    });
  });
});
