export const createFieldId = () => `field_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

/** 生成可编辑的默认数据标识，如 field_xxxx / col_xxxx */
export const createDataKey = (prefix = 'field') => `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;

export const isAutoDataKey = (value, prefix = 'field') => new RegExp(`^${prefix}_[a-z0-9]+_[a-z0-9]+$`, 'i').test(String(value || '').trim());

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

export const createBlock = (kind, overrides = {}) => {
  const base = {
    id: createFieldId(),
    kind,
    title: '',
    subtitle: '',
    column: 2,
    gap: 24,
    bordered: false,
    important: false,
    name: ['list', 'tableList', 'multiField'].includes(kind) ? createDataKey('block') : '',
    label: '',
    addText: '',
    maxLength: undefined,
    minLength: undefined,
    fieldType: 'Input',
    autoStep: true,
    list: [],
    items: []
  };

  if (kind === 'steps') {
    return {
      ...base,
      list: undefined,
      items: [createStep()],
      ...overrides
    };
  }

  if (kind === 'multiField') {
    return {
      ...base,
      list: undefined,
      ...overrides
    };
  }

  return { ...base, ...overrides };
};

export const createStep = (overrides = {}) => ({
  id: createFieldId(),
  title: '',
  column: 2,
  list: [],
  ...overrides
});

const normalizeField = field => ({
  ...createField(),
  ...field,
  props: { ...(field.props || {}) }
});

const normalizeStep = step => ({
  ...createStep(),
  ...step,
  list: Array.isArray(step.list) ? step.list.map(normalizeField) : []
});

export const normalizeBlock = block => {
  const kind = block.kind || 'formInfo';
  const normalized = {
    ...createBlock(kind),
    ...block
  };

  if (kind === 'steps') {
    normalized.items = Array.isArray(block.items) ? block.items.map(normalizeStep) : [createStep()];
    delete normalized.list;
    return normalized;
  }

  if (kind === 'multiField') {
    normalized.list = undefined;
    normalized.items = undefined;
    return normalized;
  }

  normalized.list = Array.isArray(block.list) ? block.list.map(normalizeField) : [];
  normalized.items = undefined;
  return normalized;
};

export const normalizeSchema = (schema = {}) => {
  const base = defaultSchema();

  if (Array.isArray(schema.blocks)) {
    return {
      ...base,
      ...schema,
      actions: normalizeFormActions(schema.actions),
      blocks: schema.blocks.map(normalizeBlock)
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

export const collectSchemaFields = (schema, { blockId, stepId } = {}) => {
  const blocks = schema.blocks || [];
  const fields = [];

  blocks.forEach(block => {
    if (blockId && block.id !== blockId) {
      return;
    }
    if (block.kind === 'steps') {
      (block.items || []).forEach(step => {
        if (stepId !== undefined && step.id !== stepId) {
          return;
        }
        fields.push(...(step.list || []));
      });
      return;
    }
    if (block.kind !== 'multiField') {
      fields.push(...(block.list || []));
    }
  });

  return fields;
};

export const updateBlocks = (schema, updater) => ({
  ...schema,
  blocks: updater(schema.blocks || [])
});

export const findBlock = (schema, blockId) => (schema.blocks || []).find(block => block.id === blockId);

export const mapBlocks = (schema, blockId, updater) =>
  updateBlocks(schema, blocks =>
    blocks.map(block => {
      if (block.id !== blockId) {
        return block;
      }
      return updater(block);
    })
  );

export const hasRenderableContent = schema => {
  const blocks = schema.blocks || [];
  return blocks.some(block => {
    if (block.kind === 'steps') {
      return (block.items || []).some(step => (step.list || []).length > 0);
    }
    if (block.kind === 'multiField') {
      return !!block.name;
    }
    return (block.list || []).length > 0 || block.title;
  });
};
