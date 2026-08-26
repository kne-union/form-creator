export const BLOCK_KINDS = {
  formInfo: {
    label: '基础表单',
    color: 'blue',
    hasFieldList: true,
    description: '最常用的表单模块，可设置标题、列数和间距'
  },
  list: {
    label: '可增减列表',
    color: 'cyan',
    hasFieldList: true,
    requiresName: true,
    description: '用户可以动态添加或删除多条记录，例如工作经历'
  },
  tableList: {
    label: '表格列表',
    color: 'geekblue',
    hasFieldList: true,
    requiresName: true,
    description: '以表格形式展示的可增减列表'
  },
  multiField: {
    label: '同类多值',
    color: 'purple',
    requiresName: true,
    description: '同一种填写项可以输入多个值，例如多个手机号'
  },
  object: {
    label: '分组信息',
    color: 'orange',
    hasFieldList: true,
    requiresName: true,
    description: '把相关的填写项放在一起，例如「在校时间」下的开始与结束'
  },
  choice: {
    label: '选项切换',
    color: 'magenta',
    hasChoiceOptions: true,
    description: '先选一类情况，再填写对应内容；可设为单选或多选'
  },
  steps: {
    label: '分步表单',
    color: 'gold',
    hasSteps: true,
    description: '将表单拆分成多个步骤，引导用户逐步填写'
  }
};

export const getBlockKindOptions = () =>
  Object.entries(BLOCK_KINDS).map(([value, config]) => ({
    label: config.label,
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
  name: block.name || '',
  label: block.label || '',
  addText: block.addText || '',
  maxLength: block.maxLength ?? null,
  minLength: block.minLength ?? null,
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
    name: values.name,
    label: values.label,
    addText: values.addText || undefined,
    maxLength: values.maxLength ?? undefined,
    minLength: values.minLength ?? undefined,
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
