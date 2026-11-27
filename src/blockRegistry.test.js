import { blockToFormValues, formValuesToBlock } from './blockRegistry';
import { createBlock } from './schema';

describe('steps stepsStyle', () => {
  test('未配置时表单默认 default，保存时不写入 schema', () => {
    const block = createBlock('steps');
    expect(blockToFormValues(block).stepsStyle).toBe('default');
    expect(formValuesToBlock({ ...blockToFormValues(block), kind: 'steps' }, block).stepsStyle).toBeUndefined();
  });

  test('focus 写入 schema 并能回填，非法值回落 default', () => {
    const block = createBlock('steps');
    const saved = formValuesToBlock({ ...blockToFormValues(block), kind: 'steps', stepsStyle: 'focus' }, block);
    expect(saved.stepsStyle).toBe('focus');
    expect(blockToFormValues(saved).stepsStyle).toBe('focus');
    expect(blockToFormValues({ ...saved, stepsStyle: 'unknown' }).stepsStyle).toBe('default');
  });

  test('非 steps 模块不写 stepsStyle', () => {
    const block = createBlock('formInfo');
    expect(formValuesToBlock({ ...blockToFormValues(block), stepsStyle: 'focus' }, block).stepsStyle).toBeUndefined();
  });
});
