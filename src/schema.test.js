import { blockHasLockedField, canMoveItemTo, isFieldLocked, moveBlockInTree, moveItem, normalizeSchema } from './schema';

describe('matrixScale normalize 保留编辑器 _key', () => {
  test('反复 normalize 不剥 rows/options/columns 的 _key，且 name 稳定', () => {
    const schema = {
      blocks: [
        {
          id: 'm1',
          kind: 'matrixScale',
          layout: 'options',
          rows: [{ _key: 'rk1', label: '行1', name: 'row1' }],
          options: [{ _key: 'ok1', label: '优', value: 'good' }]
        },
        {
          id: 'm2',
          kind: 'matrixScale',
          layout: 'columns',
          rows: [{ _key: 'rk2', label: '行A', name: 'rowa' }],
          columns: [{ _key: 'ck1', label: '列A', name: 'cola' }]
        }
      ]
    };
    const once = normalizeSchema(schema);
    const twice = normalizeSchema(once);
    expect(once.blocks[0].rows[0]._key).toBe('rk1');
    expect(once.blocks[0].options[0]._key).toBe('ok1');
    expect(once.blocks[1].columns[0]._key).toBe('ck1');
    expect(twice.blocks[0].rows[0]).toEqual(once.blocks[0].rows[0]);
    expect(twice.blocks[0].options[0]).toEqual(once.blocks[0].options[0]);
    expect(twice.blocks[1].columns[0]).toEqual(once.blocks[1].columns[0]);
  });
});

describe('locked 字段', () => {
  const list = [
    { id: 'a', name: 'recommendation', locked: true },
    { id: 'b', name: 'score', locked: true },
    { id: 'c', name: 'notes' },
    { id: 'd', name: 'extra' }
  ];

  test('isFieldLocked 只认 locked 为真', () => {
    expect(isFieldLocked(list[0])).toBe(true);
    expect(isFieldLocked(list[2])).toBe(false);
    expect(isFieldLocked(undefined)).toBe(false);
  });

  test('moveItem 锁定字段不能移动，其他字段也不能换到锁定字段的位置', () => {
    expect(moveItem(list, 'a', 'down')).toBe(list);
    expect(moveItem(list, 'b', 'up')).toBe(list);
    expect(moveItem(list, 'c', 'up')).toBe(list);
    expect(moveItem(list, 'c', 'down').map(item => item.id)).toEqual(['a', 'b', 'd', 'c']);
  });

  test('moveItem 数字目标下标（拖拽）：区间内有锁定项则不动', () => {
    const free = [{ id: 'x' }, { id: 'y' }, { id: 'z' }, { id: 'w' }];
    expect(moveItem(free, 'x', 2).map(item => item.id)).toEqual(['y', 'z', 'x', 'w']);
    expect(moveItem(free, 'w', 0).map(item => item.id)).toEqual(['w', 'x', 'y', 'z']);
    expect(moveItem(free, 'y', 1)).toBe(free);
    expect(moveItem(free, 'y', 9)).toBe(free);
    expect(moveItem(list, 'd', 0)).toBe(list);
    expect(moveItem(list, 'd', 2).map(item => item.id)).toEqual(['a', 'b', 'd', 'c']);
    const mixed = [{ id: 'p' }, { id: 'q', locked: true }, { id: 'r' }];
    expect(canMoveItemTo(mixed, 0, 2)).toBe(false);
    expect(moveItem(mixed, 'p', 2)).toBe(mixed);
  });

  test('blockHasLockedField 递归识别步骤、选项与子模块中的锁定字段', () => {
    expect(blockHasLockedField({ kind: 'formInfo', list })).toBe(true);
    expect(blockHasLockedField({ kind: 'formInfo', list: [list[2]] })).toBe(false);
    expect(blockHasLockedField({ kind: 'steps', items: [{ id: 's1', list: [list[0]] }] })).toBe(true);
    expect(blockHasLockedField({ kind: 'choice', options: [{ id: 'o1', blocks: [{ kind: 'formInfo', list: [list[1]] }] }] })).toBe(true);
    expect(blockHasLockedField({ kind: 'object', blocks: [{ kind: 'formInfo', list: [list[1]] }] })).toBe(true);
    expect(blockHasLockedField({ kind: 'list', itemBlocks: [{ kind: 'formInfo', list: [list[3]] }] })).toBe(false);
  });

  test('moveBlockInTree 含锁定字段的模块位置固定', () => {
    const blocks = [
      { id: 'fixed', kind: 'formInfo', list: [list[0]] },
      { id: 'free1', kind: 'formInfo', list: [list[2]] },
      { id: 'free2', kind: 'formInfo', list: [list[3]] }
    ];
    expect(moveBlockInTree(blocks, 'fixed', 'down')).toBe(blocks);
    expect(moveBlockInTree(blocks, 'free1', 'up')).toBe(blocks);
    expect(moveBlockInTree(blocks, 'free1', 'down').map(block => block.id)).toEqual(['fixed', 'free2', 'free1']);
  });
});
