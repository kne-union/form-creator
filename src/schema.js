export const createFieldId = () => `field_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

/** 生成可编辑的默认数据标识，如 field_xxxx / col_xxxx */
export const createDataKey = (prefix = 'field') => `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;

export const isAutoDataKey = (value, prefix = 'field') => new RegExp(`^${prefix}_[a-z0-9]+_[a-z0-9]+$`, 'i').test(String(value || '').trim());

export const MAX_BLOCK_DEPTH = 5;

export const createEmptyColumn = () => ({
  title: '',
  name: createDataKey('col'),
  width: undefined
});

export const defaultSchema = () => ({
  title: '',
  subtitle: '',
  column: 2,
  gap: 24,
  blocks: [],
  actions: defaultFormActions()
});

/** 表单底部提交 / 重置 / 取消按钮（写入 Schema，SchemaRenderer 识别） */
export const defaultFormActions = () => ({
  showSubmit: true,
  showReset: true,
  showCancel: false,
  submitText: '',
  resetText: '',
  cancelText: '',
  align: 'center',
  gap: 16
});

const FORM_ACTIONS_ALIGN = ['center', 'start', 'end'];

export const normalizeFormActions = (actions = {}) => {
  const base = defaultFormActions();
  if (!actions || typeof actions !== 'object') {
    return base;
  }
  const align = FORM_ACTIONS_ALIGN.includes(actions.align) ? actions.align : base.align;
  const gapValue = actions.gap != null && actions.gap !== '' ? Number(actions.gap) : base.gap;
  const gap = Number.isFinite(gapValue) && gapValue >= 0 ? gapValue : base.gap;
  return {
    showSubmit: actions.showSubmit !== false,
    showReset: actions.showReset !== false,
    showCancel: !!actions.showCancel,
    submitText: actions.submitText != null ? String(actions.submitText) : '',
    resetText: actions.resetText != null ? String(actions.resetText) : '',
    cancelText: actions.cancelText != null ? String(actions.cancelText) : '',
    align,
    gap,
    ...(actions.submitButtonProps && typeof actions.submitButtonProps === 'object' ? { submitButtonProps: { ...actions.submitButtonProps } } : {}),
    ...(actions.resetButtonProps && typeof actions.resetButtonProps === 'object' ? { resetButtonProps: { ...actions.resetButtonProps } } : {}),
    ...(actions.cancelButtonProps && typeof actions.cancelButtonProps === 'object' ? { cancelButtonProps: { ...actions.cancelButtonProps } } : {})
  };
};

export const createField = (overrides = {}) => ({
  id: createFieldId(),
  type: 'Input',
  name: createDataKey('field'),
  label: '',
  tips: '',
  description: '',
  rule: '',
  block: false,
  hidden: false,
  props: {},
  ...overrides
});

export const createChoiceOption = (overrides = {}) => ({
  id: createFieldId(),
  title: '',
  list: [],
  blocks: [],
  ...overrides
});

export const createBlock = (kind, overrides = {}) => {
  const needsName = ['list', 'tableList', 'multiField', 'object'].includes(kind);
  const base = {
    id: createFieldId(),
    kind,
    title: '',
    subtitle: '',
    column: 2,
    gap: 24,
    bordered: false,
    important: false,
    name: needsName ? createDataKey(kind === 'object' ? 'obj' : 'block') : '',
    label: '',
    addText: '',
    maxLength: undefined,
    minLength: undefined,
    fieldType: 'Input',
    autoStep: true,
    mode: 'single',
    selectorName: '',
    selectorInData: true,
    discriminator: undefined,
    list: [],
    items: [],
    itemBlocks: [],
    blocks: [],
    options: []
  };

  if (kind === 'steps') {
    return {
      ...base,
      list: undefined,
      itemBlocks: undefined,
      blocks: undefined,
      options: undefined,
      items: [createStep()],
      ...overrides
    };
  }

  if (kind === 'multiField') {
    return {
      ...base,
      list: undefined,
      itemBlocks: undefined,
      blocks: undefined,
      options: undefined,
      items: undefined,
      ...overrides
    };
  }

  if (kind === 'choice') {
    const next = {
      ...base,
      list: undefined,
      itemBlocks: undefined,
      blocks: undefined,
      items: undefined,
      name: '',
      options: [createChoiceOption({ title: '选项1' })],
      ...overrides,
      kind: 'choice'
    };
    next.mode = next.mode === 'multiple' ? 'multiple' : 'single';
    if (!Array.isArray(next.options)) {
      next.options = [createChoiceOption({ title: '选项1' })];
    }
    return next;
  }

  if (kind === 'object') {
    return {
      ...base,
      items: undefined,
      options: undefined,
      itemBlocks: undefined,
      ...overrides
    };
  }

  if (kind === 'list') {
    return {
      ...base,
      blocks: undefined,
      ...overrides
    };
  }

  if (kind === 'tableList') {
    return {
      ...base,
      blocks: undefined,
      itemBlocks: undefined,
      ...overrides
    };
  }

  // formInfo：支持 blocks 子模块
  return { ...base, itemBlocks: undefined, ...overrides };
};

export const createStep = (overrides = {}) => ({
  id: createFieldId(),
  title: '',
  column: 2,
  list: [],
  blocks: [],
  ...overrides
});

const normalizeSelectCount = (value, minAllowed = 0) => {
  if (value == null || value === '') {
    return undefined;
  }
  const num = Number(value);
  if (!Number.isFinite(num)) {
    return undefined;
  }
  const int = Math.floor(num);
  if (int < minAllowed) {
    return undefined;
  }
  return int;
};

const normalizeField = field => ({
  ...createField(),
  ...field,
  props: { ...(field.props || {}) }
});

const normalizeStep = (step, depth = 0) => ({
  ...createStep(),
  ...step,
  list: Array.isArray(step.list) ? step.list.map(normalizeField) : [],
  blocks: Array.isArray(step.blocks) ? step.blocks.map(child => normalizeBlock(child, depth + 1)) : []
});

const normalizeChoiceOption = (option, depth) => {
  let list = Array.isArray(option.list) ? option.list.map(normalizeField) : [];
  let blocks = Array.isArray(option.blocks) ? option.blocks.map(block => normalizeBlock(block, depth + 1)) : [];

  // 兼容仅写 blocks: [formInfo] 的写法：把首个 formInfo 的字段提升到 option.list，便于编辑器管理
  if (!list.length && blocks[0]?.kind === 'formInfo' && (blocks[0].list || []).length) {
    list = (blocks[0].list || []).map(normalizeField);
    blocks = blocks.slice(1);
  }

  return {
    ...createChoiceOption(),
    ...option,
    list,
    blocks
  };
};

export const normalizeBlock = (block, depth = 0) => {
  const kind = block.kind || 'formInfo';
  if (depth > MAX_BLOCK_DEPTH) {
    return {
      ...createBlock(kind),
      ...block,
      list: Array.isArray(block.list) ? block.list.map(normalizeField) : [],
      itemBlocks: [],
      options: [],
      items: kind === 'steps' ? [createStep()] : undefined
    };
  }

  const normalized = {
    ...createBlock(kind),
    ...block
  };

  if (kind === 'steps') {
    normalized.items = Array.isArray(block.items) ? block.items.map(step => normalizeStep(step, depth)) : [createStep()];
    delete normalized.list;
    delete normalized.itemBlocks;
    delete normalized.blocks;
    delete normalized.options;
    return normalized;
  }

  if (kind === 'multiField') {
    normalized.list = undefined;
    normalized.items = undefined;
    normalized.itemBlocks = undefined;
    normalized.blocks = undefined;
    normalized.options = undefined;
    return normalized;
  }

  if (kind === 'choice') {
    normalized.mode = block.mode === 'multiple' ? 'multiple' : 'single';
    normalized.selectorName = block.selectorName != null ? String(block.selectorName) : '';
    normalized.selectorInData = block.selectorInData !== false;
    normalized.discriminator = block.discriminator && typeof block.discriminator === 'object' ? { ...block.discriminator } : undefined;
    normalized.options = Array.isArray(block.options) ? block.options.map(option => normalizeChoiceOption(option, depth)) : [];
    normalized.list = undefined;
    normalized.items = undefined;
    normalized.itemBlocks = undefined;
    normalized.blocks = undefined;
    if (normalized.mode === 'multiple') {
      const minSelect = normalizeSelectCount(block.minLength, 0);
      const maxSelect = normalizeSelectCount(block.maxLength, 1);
      normalized.minLength = minSelect;
      normalized.maxLength = maxSelect != null && minSelect != null && maxSelect < minSelect ? minSelect : maxSelect;
    } else {
      normalized.minLength = undefined;
      normalized.maxLength = undefined;
    }
    return normalized;
  }

  if (kind === 'object') {
    normalized.list = Array.isArray(block.list) ? block.list.map(normalizeField) : [];
    normalized.items = undefined;
    normalized.itemBlocks = undefined;
    normalized.options = undefined;
    normalized.blocks = Array.isArray(block.blocks) ? block.blocks.map(child => normalizeBlock(child, depth + 1)) : [];
    return normalized;
  }

  normalized.list = Array.isArray(block.list) ? block.list.map(normalizeField) : [];
  normalized.items = undefined;
  normalized.options = undefined;
  if (kind === 'list') {
    normalized.itemBlocks = Array.isArray(block.itemBlocks) ? block.itemBlocks.map(child => normalizeBlock(child, depth + 1)) : [];
    normalized.blocks = undefined;
  } else if (kind === 'tableList') {
    normalized.itemBlocks = undefined;
    normalized.blocks = undefined;
  } else {
    // formInfo
    normalized.itemBlocks = undefined;
    normalized.blocks = Array.isArray(block.blocks) ? block.blocks.map(child => normalizeBlock(child, depth + 1)) : [];
  }
  return normalized;
};

export const normalizeSchema = (schema = {}) => {
  const base = defaultSchema();

  if (Array.isArray(schema.blocks)) {
    return {
      ...base,
      ...schema,
      actions: normalizeFormActions(schema.actions),
      blocks: schema.blocks.map(block => normalizeBlock(block))
    };
  }

  if (Array.isArray(schema.list) && schema.list.length) {
    return {
      ...base,
      ...schema,
      actions: normalizeFormActions(schema.actions),
      blocks: [
        normalizeBlock({
          kind: 'formInfo',
          title: schema.title,
          subtitle: schema.subtitle,
          column: schema.column,
          gap: schema.gap,
          list: schema.list
        })
      ]
    };
  }

  return {
    ...base,
    ...schema,
    actions: normalizeFormActions(schema.actions),
    blocks: []
  };
};

export const moveItem = (list, id, direction) => {
  const index = list.findIndex(item => item.id === id);
  if (index < 0) {
    return list;
  }
  const targetIndex = direction === 'up' ? index - 1 : index + 1;
  if (targetIndex < 0 || targetIndex >= list.length) {
    return list;
  }
  const next = [...list];
  const [item] = next.splice(index, 1);
  next.splice(targetIndex, 0, item);
  return next;
};

export const isFieldNameUnique = (fields, name, excludeId) => {
  if (!name) {
    return false;
  }
  return !fields.some(item => item.name === name && item.id !== excludeId);
};

const collectFieldsFromBlocks = (blocks = [], acc = []) => {
  blocks.forEach(block => {
    if (!block) {
      return;
    }
    if (block.kind === 'steps') {
      (block.items || []).forEach(step => {
        acc.push(...(step.list || []));
        collectFieldsFromBlocks(step.blocks || [], acc);
      });
      return;
    }
    if (block.kind === 'choice') {
      (block.options || []).forEach(option => {
        acc.push(...(option.list || []));
        collectFieldsFromBlocks(option.blocks || [], acc);
      });
      return;
    }
    if (block.kind !== 'multiField' && Array.isArray(block.list)) {
      acc.push(...block.list);
    }
    if (Array.isArray(block.itemBlocks)) {
      collectFieldsFromBlocks(block.itemBlocks, acc);
    }
    if (Array.isArray(block.blocks)) {
      collectFieldsFromBlocks(block.blocks, acc);
    }
  });
  return acc;
};

export const collectSchemaFields = (schema, { blockId, stepId, optionId } = {}) => {
  const blocks = schema.blocks || [];

  if (!blockId) {
    return collectFieldsFromBlocks(blocks);
  }

  const block = findBlockInTree(blocks, blockId);
  if (!block) {
    return [];
  }

  const fields = [];
  if (block.kind === 'steps') {
    (block.items || []).forEach(step => {
      if (stepId !== undefined && step.id !== stepId) {
        return;
      }
      fields.push(...(step.list || []));
    });
    return fields;
  }
  if (block.kind === 'choice') {
    (block.options || []).forEach(option => {
      if (optionId !== undefined && option.id !== optionId) {
        return;
      }
      fields.push(...(option.list || []));
      collectFieldsFromBlocks(option.blocks || [], fields);
    });
    return fields;
  }
  if (block.kind !== 'multiField') {
    fields.push(...(block.list || []));
  }
  return fields;
};

/** 收集 blocks 树中所有字段 name（含 object 前缀后的完整名需在渲染层处理） */
export const collectBlockFieldNames = (blocks = [], { objectNamePrefix = '' } = {}) => {
  const names = [];
  const walk = (list, prefix) => {
    (list || []).forEach(block => {
      if (!block) {
        return;
      }
      if (block.kind === 'object') {
        const nextPrefix = [prefix, block.name].filter(Boolean).join('.');
        (block.list || []).forEach(field => {
          if (field?.name) {
            names.push(nextPrefix ? `${nextPrefix}.${field.name}` : field.name);
          }
        });
        walk(block.blocks || [], nextPrefix);
        return;
      }
      if (block.kind === 'choice') {
        (block.options || []).forEach(option => {
          (option.list || []).forEach(field => {
            if (field?.name) {
              names.push(prefix ? `${prefix}.${field.name}` : field.name);
            }
          });
          walk(option.blocks || [], prefix);
        });
        return;
      }
      if (block.kind === 'steps') {
        (block.items || []).forEach(step => {
          (step.list || []).forEach(field => {
            if (field?.name) {
              names.push(prefix ? `${prefix}.${field.name}` : field.name);
            }
          });
          walk(step.blocks || [], prefix);
        });
        return;
      }
      if (block.kind !== 'multiField') {
        (block.list || []).forEach(field => {
          if (field?.name) {
            names.push(prefix ? `${prefix}.${field.name}` : field.name);
          }
        });
      }
      if (block.kind === 'list') {
        // 列表项内字段相对 GroupList，此处只收集定义名供 choice 清理参考
        walk(block.itemBlocks || [], prefix);
      }
      if (Array.isArray(block.blocks)) {
        walk(block.blocks, prefix);
      }
    });
  };
  walk(blocks, objectNamePrefix);
  return names;
};

export const updateBlocks = (schema, updater) => ({
  ...schema,
  blocks: updater(schema.blocks || [])
});

/** 在 blocks / itemBlocks / choice.options.blocks / steps.items.blocks 树中查找模块 */
export const findBlockInTree = (blocks = [], blockId) => {
  for (const block of blocks) {
    if (!block) {
      continue;
    }
    if (block.id === blockId) {
      return block;
    }
    if (Array.isArray(block.itemBlocks)) {
      const found = findBlockInTree(block.itemBlocks, blockId);
      if (found) {
        return found;
      }
    }
    if (Array.isArray(block.blocks)) {
      const found = findBlockInTree(block.blocks, blockId);
      if (found) {
        return found;
      }
    }
    if (block.kind === 'choice') {
      for (const option of block.options || []) {
        const found = findBlockInTree(option.blocks || [], blockId);
        if (found) {
          return found;
        }
      }
    }
    if (block.kind === 'steps') {
      for (const step of block.items || []) {
        const found = findBlockInTree(step.blocks || [], blockId);
        if (found) {
          return found;
        }
      }
    }
  }
  return null;
};

export const findBlock = (schema, blockId) => findBlockInTree(schema.blocks || [], blockId);

/** 对模块上挂载的子模块列表（itemBlocks / blocks / option.blocks / step.blocks）应用同一变换 */
const mapChildBlockLists = (block, mapList) => {
  let nextBlock = block;
  let changed = false;

  if (Array.isArray(block.itemBlocks)) {
    const itemBlocks = mapList(block.itemBlocks);
    if (itemBlocks !== block.itemBlocks) {
      nextBlock = { ...nextBlock, itemBlocks };
      changed = true;
    }
  }

  if (Array.isArray(block.blocks)) {
    const childBlocks = mapList(block.blocks);
    if (childBlocks !== block.blocks) {
      nextBlock = { ...nextBlock, blocks: childBlocks };
      changed = true;
    }
  }

  if (block.kind === 'choice' && Array.isArray(block.options)) {
    let optionsChanged = false;
    const options = block.options.map(option => {
      if (!Array.isArray(option.blocks)) {
        return option;
      }
      const optionBlocks = mapList(option.blocks);
      if (optionBlocks !== option.blocks) {
        optionsChanged = true;
        return { ...option, blocks: optionBlocks };
      }
      return option;
    });
    if (optionsChanged) {
      nextBlock = { ...nextBlock, options };
      changed = true;
    }
  }

  if (block.kind === 'steps' && Array.isArray(block.items)) {
    let itemsChanged = false;
    const items = block.items.map(step => {
      if (!Array.isArray(step.blocks)) {
        return step;
      }
      const stepBlocks = mapList(step.blocks);
      if (stepBlocks !== step.blocks) {
        itemsChanged = true;
        return { ...step, blocks: stepBlocks };
      }
      return step;
    });
    if (itemsChanged) {
      nextBlock = { ...nextBlock, items };
      changed = true;
    }
  }

  return { nextBlock, changed };
};

const mapBlocksInTree = (blocks, blockId, updater) => {
  let changed = false;
  const next = (blocks || []).map(block => {
    if (!block) {
      return block;
    }
    if (block.id === blockId) {
      changed = true;
      return updater(block);
    }
    const { nextBlock, changed: childChanged } = mapChildBlockLists(block, list => mapBlocksInTree(list, blockId, updater));
    if (childChanged) {
      changed = true;
    }
    return nextBlock;
  });
  return changed ? next : blocks;
};

export const mapBlocks = (schema, blockId, updater) => updateBlocks(schema, blocks => mapBlocksInTree(blocks, blockId, updater));

export const removeBlockInTree = (blocks, blockId) => {
  let changed = false;
  const filtered = (blocks || []).filter(block => {
    if (block?.id === blockId) {
      changed = true;
      return false;
    }
    return true;
  });
  const next = filtered.map(block => {
    const { nextBlock, changed: childChanged } = mapChildBlockLists(block, list => removeBlockInTree(list, blockId));
    if (childChanged) {
      changed = true;
    }
    return nextBlock;
  });
  return changed ? next : blocks;
};

export const moveBlockInTree = (blocks, blockId, direction) => {
  if ((blocks || []).some(block => block?.id === blockId)) {
    return moveItem(blocks, blockId, direction);
  }
  let changed = false;
  const next = (blocks || []).map(block => {
    const { nextBlock, changed: childChanged } = mapChildBlockLists(block, list => moveBlockInTree(list, blockId, direction));
    if (childChanged) {
      changed = true;
    }
    return nextBlock;
  });
  return changed ? next : blocks;
};

const blockHasContent = block => {
  if (!block) {
    return false;
  }
  if (block.kind === 'steps') {
    return (block.items || []).some(step => (step.list || []).length > 0 || (step.blocks || []).some(blockHasContent) || step.title);
  }
  if (block.kind === 'multiField') {
    return !!block.name;
  }
  if (block.kind === 'choice') {
    return (block.options || []).some(option => (option.list || []).length > 0 || (option.blocks || []).some(blockHasContent) || option.title);
  }
  if (block.kind === 'object') {
    return !!(block.name && ((block.list || []).length > 0 || (block.blocks || []).some(blockHasContent) || block.title));
  }
  if ((block.list || []).length > 0 || block.title || (block.blocks || []).some(blockHasContent)) {
    return true;
  }
  return (block.itemBlocks || []).some(blockHasContent);
};

export const hasRenderableContent = schema => {
  const blocks = schema.blocks || [];
  return blocks.some(blockHasContent);
};
