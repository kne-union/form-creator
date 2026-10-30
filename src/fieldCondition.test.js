import {
  collectConditionFields,
  collectTriggerNames,
  compileConditionRegex,
  evaluateCondition,
  evaluateVisibleWhen,
  findConditionCycle,
  getConditionOperators,
  hasInvalidCondition,
  normalizeVisibleWhen,
  renameConditionReferences,
  sanitizeRegexFlags,
  wouldCreateCycle
} from './fieldCondition';

const data = {
  recommendation: 'reject',
  score: 2,
  skills: ['java', 'react'],
  remark: '',
  email: 'Zhang@Leapin.AI',
  owners: [{ label: '张三', value: 'u1' }],
  contact: { phone: '13800000000' }
};

const check = (operator, field, value, extra = {}) => evaluateCondition({ field, operator, value, ...extra }, data);

describe('evaluateCondition', () => {
  test('等于 / 不等于', () => {
    expect(check('eq', 'recommendation', 'reject')).toBe(true);
    expect(check('eq', 'score', '2')).toBe(true);
    expect(check('eq', 'remark', '')).toBe(false);
    expect(check('neq', 'recommendation', 'pass')).toBe(true);
    expect(check('neq', 'recommendation', 'reject')).toBe(false);
    expect(check('eq', 'contact.phone', '13800000000')).toBe(true);
  });

  test('属于其一 / 多选包含任一', () => {
    expect(check('in', 'recommendation', ['hold', 'reject'])).toBe(true);
    expect(check('in', 'recommendation', ['pass'])).toBe(false);
    expect(check('includesAny', 'skills', ['go', 'java'])).toBe(true);
    expect(check('includesAny', 'skills', ['go'])).toBe(false);
    expect(check('includesAny', 'owners', ['u1'])).toBe(true);
  });

  test('为空 / 不为空', () => {
    expect(check('empty', 'remark')).toBe(true);
    expect(check('empty', 'missing')).toBe(true);
    expect(check('empty', 'skills')).toBe(false);
    expect(check('notEmpty', 'score')).toBe(true);
  });

  test('数值比较，非数字不满足', () => {
    expect(check('lte', 'score', 2)).toBe(true);
    expect(check('lt', 'score', 2)).toBe(false);
    expect(check('gt', 'score', 1)).toBe(true);
    expect(check('gte', 'score', 3)).toBe(false);
    expect(check('gt', 'recommendation', 1)).toBe(false);
    expect(check('gt', 'missing', 1)).toBe(false);
  });

  test('正则：flags、数组任一项、空值、无效正则', () => {
    expect(check('regex', 'email', '@leapin\\.ai$')).toBe(false);
    expect(check('regex', 'email', '@leapin\\.ai$', { flags: 'i' })).toBe(true);
    expect(check('regex', 'skills', '^rea')).toBe(true);
    expect(check('regex', 'owners', '^u\\d$')).toBe(true);
    expect(check('regex', 'remark', '.*')).toBe(false);
    expect(check('regex', 'email', '(')).toBe(null);
  });

  test('正则 g / y 被过滤，多次判断结果一致', () => {
    expect(sanitizeRegexFlags('gimy')).toBe('im');
    expect(compileConditionRegex('a', 'gy').flags).toBe('');
    const condition = { field: 'email', operator: 'regex', value: 'leapin', flags: 'gi' };
    expect(evaluateCondition(condition, data)).toBe(true);
    expect(evaluateCondition(condition, data)).toBe(true);
  });

  test('未知运算符视为无效', () => {
    expect(check('unknown', 'score', 1)).toBe(null);
  });
});

describe('evaluateVisibleWhen', () => {
  test('and / or 组合', () => {
    const conditions = [
      { field: 'recommendation', operator: 'eq', value: 'reject' },
      { field: 'score', operator: 'gt', value: 3 }
    ];
    expect(evaluateVisibleWhen({ logic: 'and', conditions }, data)).toBe(false);
    expect(evaluateVisibleWhen({ logic: 'or', conditions }, data)).toBe(true);
    expect(evaluateVisibleWhen({ conditions }, data)).toBe(false);
  });

  test('失效条件被忽略，全部失效时照常显示', () => {
    const known = new Set(['recommendation', 'score']);
    const visibleWhen = {
      logic: 'and',
      conditions: [
        { field: 'recommendation', operator: 'eq', value: 'reject' },
        { field: 'deleted', operator: 'eq', value: 'x' },
        { field: 'score', operator: 'regex', value: '(' }
      ]
    };
    expect(evaluateVisibleWhen(visibleWhen, data, known)).toBe(true);
    expect(evaluateVisibleWhen({ conditions: [{ field: 'deleted', operator: 'eq', value: 'x' }] }, data, known)).toBe(true);
    expect(evaluateVisibleWhen(undefined, data)).toBe(true);
  });
});

const schema = {
  blocks: [
    {
      kind: 'formInfo',
      list: [
        { id: 'f1', name: 'recommendation', type: 'RadioGroup', props: { options: [{ label: '不通过', value: 'reject' }] } },
        { id: 'f2', name: 'reason', type: 'TextArea', visibleWhen: { conditions: [{ field: 'recommendation', operator: 'eq', value: 'reject' }] } },
        { id: 'f3', name: 'detail', type: 'Input', visibleWhen: { conditions: [{ field: 'reason', operator: 'notEmpty' }] } }
      ]
    },
    { kind: 'object', name: 'contact', list: [{ id: 'f4', name: 'phone', type: 'Input' }] },
    { kind: 'list', name: 'works', list: [{ id: 'f5', name: 'company', type: 'Input' }] }
  ]
};

describe('schema 工具', () => {
  test('collectConditionFields 带 object 前缀并标记列表内字段', () => {
    const fields = collectConditionFields(schema);
    expect(fields.map(item => item.path)).toEqual(['recommendation', 'reason', 'detail', 'contact.phone', 'company']);
    expect(fields.find(item => item.path === 'company').inList).toBe(true);
    expect(collectTriggerNames(schema).has('company')).toBe(false);
  });

  test('hasInvalidCondition 识别失效引用', () => {
    const names = collectTriggerNames(schema);
    expect(hasInvalidCondition(schema.blocks[0].list[1], names)).toBe(false);
    expect(hasInvalidCondition({ visibleWhen: { conditions: [{ field: 'company', operator: 'notEmpty' }] } }, names)).toBe(true);
  });

  test('循环检测', () => {
    expect(findConditionCycle(schema)).toBe(null);
    expect(wouldCreateCycle(schema, 'recommendation', 'detail')).toBe(true);
    expect(wouldCreateCycle(schema, 'detail', 'recommendation')).toBe(false);
    const cyclic = renameConditionReferences(schema, 'recommendation', 'detail');
    expect(findConditionCycle(cyclic)).toEqual(['reason', 'detail', 'reason']);
  });

  test('改名同步引用', () => {
    const next = renameConditionReferences(schema, 'recommendation', 'result');
    expect(next.blocks[0].list[1].visibleWhen.conditions[0].field).toBe('result');
    expect(next.blocks[0].list[2]).toBe(schema.blocks[0].list[2]);
  });

  test('normalizeVisibleWhen 去掉空条件并清理 flags', () => {
    expect(normalizeVisibleWhen({ conditions: [{ field: '', operator: 'eq' }] })).toBe(undefined);
    expect(
      normalizeVisibleWhen({
        logic: 'or',
        conditions: [
          { field: 'remark', operator: 'empty', value: 'x' },
          { field: 'email', operator: 'regex', value: 'a', flags: 'gi' }
        ]
      })
    ).toEqual({
      logic: 'or',
      conditions: [
        { field: 'remark', operator: 'empty' },
        { field: 'email', operator: 'regex', value: 'a', flags: 'i' }
      ]
    });
  });

  test('按触发字段类型给出运算符', () => {
    const optionsDefinition = { hasOptions: true };
    expect(getConditionOperators({ type: 'RadioGroup' }, optionsDefinition)).toContain('in');
    expect(getConditionOperators({ type: 'Select', props: { mode: 'multiple' } }, optionsDefinition)).toContain('includesAny');
    expect(getConditionOperators({ type: 'CheckboxGroup' }, optionsDefinition)).toContain('includesAny');
    expect(getConditionOperators({ type: 'InputNumber' }, { valueSchema: { type: 'number' } })).toContain('lte');
    expect(getConditionOperators({ type: 'Input' }, { valueSchema: { type: 'string' } })).toContain('regex');
    expect(getConditionOperators({ type: 'Switch' })).toEqual(['eq', 'neq']);
  });
});
