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
  autoStep: block.autoStep !== false
});

export const formValuesToBlock = (values, existingBlock = {}) => ({
  ...existingBlock,
  kind: values.kind || existingBlock.kind,
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
  autoStep: values.autoStep !== false
});

export const stepToFormValues = step => ({
  title: step.title || '',
  column: step.column ?? 2
});

export const formValuesToStep = (values, existingStep = {}) => ({
  ...existingStep,
  title: values.title,
  column: values.column ?? 2
});
