import { blockHasLockedField, isFieldLocked, moveBlockInTree, moveItem } from './schema';

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
