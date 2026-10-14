export const BLOCK_KINDS = {
  formInfo: {
    labelId: 'blockKind_formInfo',
    color: 'blue',
    hasFieldList: true,
    descriptionId: 'blockKindDesc_formInfo'
  },
  list: {
    labelId: 'blockKind_list',
    color: 'cyan',
    hasFieldList: true,
    requiresName: true,
    descriptionId: 'blockKindDesc_list'
  },
  tableList: {
    labelId: 'blockKind_tableList',
    color: 'geekblue',
    hasFieldList: true,
    requiresName: true,
    descriptionId: 'blockKindDesc_tableList'
  },
  editableList: {
    labelId: 'blockKind_editableList',
    color: 'green',
    hasFieldList: true,
    requiresName: true,
    descriptionId: 'blockKindDesc_editableList'
  },
  multiField: {
    labelId: 'blockKind_multiField',
    color: 'purple',
    requiresName: true,
    descriptionId: 'blockKindDesc_multiField'
  },
  object: {
    labelId: 'blockKind_object',
    color: 'orange',
    hasFieldList: true,
    requiresName: true,
    descriptionId: 'blockKindDesc_object'
  },
  choice: {
    labelId: 'blockKind_choice',
    color: 'magenta',
    hasChoiceOptions: true,
    descriptionId: 'blockKindDesc_choice'
  },
  steps: {
    labelId: 'blockKind_steps',
    color: 'gold',
    hasSteps: true,
    descriptionId: 'blockKindDesc_steps'
  }
};

/** editableList 添加按钮位置，与 @kne/form-info EditableList addPosition 一致 */
export const ADD_POSITIONS = ['bottom', 'top', 'both'];

export const getBlockKindOptions = formatMessage =>
  Object.entries(BLOCK_KINDS).map(([value, config]) => ({
    label: typeof formatMessage === 'function' ? formatMessage({ id: config.labelId }) : config.labelId,
    value
  }));

export const getBlockDefinition = kind => BLOCK_KINDS[kind];

export const blockToFormValues = block => ({
  kind: block.kind,
  title: block.title || '',
  subtitle: block.subtitle || '',
  column: block.column ?? 2,
  gap: block.gap ?? 24,
  bordered: !!block.bordered,
  important: !!block.important,
  showIndex: !!block.showIndex,
  name: block.name || '',
  label: block.label || '',
  addText: block.addText || '',
  maxLength: block.maxLength ?? null,
  minLength: block.minLength ?? null,
  addPosition: ADD_POSITIONS.includes(block.addPosition) ? block.addPosition : 'bottom',
  fieldType: block.fieldType || 'Input',
  autoStep: block.autoStep !== false,
  mode: block.mode === 'multiple' ? 'multiple' : 'single',
  selectorName: block.selectorName || '',
  selectorInData: block.selectorInData !== false
});

export const formValuesToBlock = (values, existingBlock = {}) => {
  const kind = values.kind || existingBlock.kind;
  const mode = values.mode === 'multiple' ? 'multiple' : 'single';
  const next = {
    ...existingBlock,
    kind,
    title: values.title,
    subtitle: values.subtitle,
    column: values.column ?? 2,
    gap: values.gap ?? 24,
    bordered: !!values.bordered,
    important: !!values.important,
    showIndex: !!values.showIndex,
    name: values.name,
    label: values.label,
    addText: values.addText || undefined,
    maxLength: values.maxLength ?? undefined,
    minLength: values.minLength ?? undefined,
    addPosition: kind === 'editableList' && ADD_POSITIONS.includes(values.addPosition) && values.addPosition !== 'bottom' ? values.addPosition : undefined,
    fieldType: values.fieldType || 'Input',
    autoStep: values.autoStep !== false,
    mode,
    selectorName: values.selectorName || '',
    selectorInData: values.selectorInData !== false
  };

  if (kind === 'choice' && mode !== 'multiple') {
    next.minLength = undefined;
    next.maxLength = undefined;
  }

  return next;
};

export const stepToFormValues = step => ({
  title: step.title || '',
  column: step.column ?? 2
});

export const formValuesToStep = (values, existingStep = {}) => ({
  ...existingStep,
  title: values.title,
  column: values.column ?? 2
});

export const choiceOptionToFormValues = option => ({
  title: option.title || ''
});

export const formValuesToChoiceOption = (values, existingOption = {}) => ({
  ...existingOption,
  title: values.title
});
