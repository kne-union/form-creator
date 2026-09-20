import { Input, TextArea, Select, InputNumber, Switch, Checkbox, DatePicker, RadioGroup, CheckboxGroup } from '@kne/react-form-antd';
import { SuperSelectList, SuperSelectTableList, SuperSelectTree, SuperSelectCascader, SelectFunctionField, SelectIndustryField, SelectAddressField } from './fields/extendedFields';
import { buildRuleString, parseRuleString } from './rulePresets';
import { createEmptyColumn } from './schema';

const registry = new Map();

const defineField = (type, definition) => {
  registry.set(type, {
    type,
    ...definition
  });
};

const FIELD_GROUPS = [
  {
    labelId: 'FieldGroupBasic',
    types: ['Input', 'TextArea', 'InputNumber', 'Switch', 'Checkbox', 'DatePicker']
  },
  {
    labelId: 'FieldGroupSelect',
    types: ['Select', 'RadioGroup', 'CheckboxGroup']
  },
  {
    labelId: 'FieldGroupAdvancedSelect',
    types: ['SuperSelectList', 'SuperSelectTableList', 'SuperSelectTree', 'SuperSelectCascader']
  },
  {
    labelId: 'FieldGroupBusinessSelect',
    types: ['SelectFunction', 'SelectIndustry', 'SelectAddress']
  }
];

const resolveRegistryLabel = (formatMessage, labelId, fallbackLabel) => {
  if (typeof formatMessage === 'function' && labelId) {
    return formatMessage({ id: labelId });
  }
  if (fallbackLabel != null && String(fallbackLabel).trim()) {
    return String(fallbackLabel).trim();
  }
  return labelId || '';
};

const optionEnumValues = field => {
  const options = field?.props?.options;
  if (!Array.isArray(options) || !options.length) {
    return undefined;
  }
  const values = options.map(item => item?.value).filter(value => value !== undefined && value !== null && value !== '');
  return values.length ? values : undefined;
};

const stringWithEnumSchema = field => {
  const schema = { type: 'string' };
  const enums = optionEnumValues(field);
  if (enums) {
    schema.enum = enums;
  }
  return schema;
};

const optionValueSchema = { type: 'object', display: 'option' };

const superSelectValueSchema = field => {
  if (field?.props?.single) {
    return { ...optionValueSchema };
  }
  return { type: 'array', items: { ...optionValueSchema } };
};

const PICKER_TO_FORMAT = {
  date: 'date',
  week: 'week',
  month: 'month',
  quarter: 'quarter',
  year: 'year'
};

const datePickerValueSchema = field => {
  const picker = field?.props?.picker || 'date';
  const format = field?.props?.showTime ? 'date-time' : PICKER_TO_FORMAT[picker] || 'date';
  const item = { type: 'string', format };
  if (field?.props?.range) {
    return { type: 'array', items: item, minItems: 2, maxItems: 2 };
  }
  return item;
};

defineField('Input', {
  labelId: 'FieldTypeInput',
  component: Input,
  defaultProps: { allowClear: true },
  hasFieldProps: true,
  valueSchema: { type: 'string' }
});

defineField('TextArea', {
  labelId: 'FieldTypeTextArea',
  component: TextArea,
  defaultProps: { rows: 3 },
  defaults: { block: true },
  hasFieldProps: true,
  valueSchema: { type: 'string' }
});

defineField('InputNumber', {
  labelId: 'FieldTypeInputNumber',
  component: InputNumber,
  defaultProps: {},
  hasFieldProps: true,
  valueSchema: { type: 'number' }
});

defineField('Select', {
  labelId: 'FieldTypeSelect',
  component: Select,
  defaultProps: { options: [], allowClear: true },
  hasOptions: true,
  hasFieldProps: true,
  valueSchema: stringWithEnumSchema
});

defineField('RadioGroup', {
  labelId: 'FieldTypeRadioGroup',
  component: RadioGroup,
  defaultProps: { options: [], inline: true },
  hasOptions: true,
  hasFieldProps: true,
  valueSchema: stringWithEnumSchema
});

defineField('CheckboxGroup', {
  labelId: 'FieldTypeCheckboxGroup',
  component: CheckboxGroup,
  defaultProps: { options: [], inline: true },
  hasOptions: true,
  hasFieldProps: true,
  valueSchema: field => {
    const items = { type: 'string' };
    const enums = optionEnumValues(field);
    if (enums) {
      items.enum = enums;
    }
    return { type: 'array', items };
  }
});

defineField('SuperSelectList', {
  labelId: 'FieldTypeSuperSelectList',
  component: SuperSelectList,
  defaultProps: { options: [], isPopup: true, allowClear: true, labelKey: 'label', valueKey: 'value' },
  isSuperSelect: true,
  hasOptions: true,
  optionsAllowDescription: true,
  valueSchema: superSelectValueSchema
});

defineField('SuperSelectTableList', {
  labelId: 'FieldTypeSuperSelectTableList',
  component: SuperSelectTableList,
  defaultProps: {
    options: [],
    columns: [],
    isPopup: true,
    allowClear: true,
    labelKey: 'label',
    valueKey: 'value'
  },
  isSuperSelect: true,
  hasOptions: true,
  hasColumns: true,
  optionsAllowDescription: true,
  valueSchema: superSelectValueSchema
});

defineField('SuperSelectTree', {
  labelId: 'FieldTypeSuperSelectTree',
  component: SuperSelectTree,
  defaultProps: { options: [], isPopup: true, allowClear: true, labelKey: 'label', valueKey: 'value' },
  isSuperSelect: true,
  hasOptions: true,
  optionsAllowChildren: true,
  optionsAllowDescription: true,
  valueSchema: superSelectValueSchema
});

defineField('SuperSelectCascader', {
  labelId: 'FieldTypeSuperSelectCascader',
  component: SuperSelectCascader,
  defaultProps: {
    options: [],
    isPopup: true,
    allowClear: true,
    labelKey: 'label',
    valueKey: 'value',
    onlyAllowLastLevel: false
  },
  isSuperSelect: true,
  hasOptions: true,
  hasOnlyLastLevel: true,
  optionsAllowChildren: true,
  optionsAllowDescription: true,
  valueSchema: superSelectValueSchema
});

defineField('SelectFunction', {
  labelId: 'FieldTypeSelectFunction',
  component: SelectFunctionField,
  defaultProps: { isPopup: true, allowClear: true },
  isSuperSelect: true,
  hasBuiltinData: true,
  valueSchema: superSelectValueSchema
});

defineField('SelectIndustry', {
  labelId: 'FieldTypeSelectIndustry',
  component: SelectIndustryField,
  defaultProps: { isPopup: true, allowClear: true },
  isSuperSelect: true,
  hasBuiltinData: true,
  valueSchema: superSelectValueSchema
});

defineField('SelectAddress', {
  labelId: 'FieldTypeSelectAddress',
  component: SelectAddressField,
  defaultProps: { isPopup: true, allowClear: true },
  isSuperSelect: true,
  hasBuiltinData: true,
  valueSchema: superSelectValueSchema
});

defineField('Switch', {
  labelId: 'FieldTypeSwitch',
  component: Switch,
  defaultProps: {},
  hasFieldProps: true,
  valueSchema: { type: 'boolean' }
});

defineField('Checkbox', {
  labelId: 'FieldTypeCheckbox',
  component: Checkbox,
  defaultProps: { children: '' },
  valueSchema: { type: 'boolean' }
});

defineField('DatePicker', {
  labelId: 'FieldTypeDatePicker',
  component: DatePicker,
  defaultProps: {
    format: 'YYYY-MM-DD',
    picker: 'date',
    allowClear: true,
    range: false,
    showTime: false
  },
  hasFieldProps: true,
  resolveComponent: props => (props?.range ? DatePicker.RangePicker || DatePicker : DatePicker),
  valueSchema: datePickerValueSchema
});

/**
 * 扩展字段额外参数声明（propsSchema 项）：
 * - name: props 键名
 * - label: 编辑器展示名
 * - type: 'string' | 'number' | 'boolean' | 'select'
 * - placeholder?: string
 * - defaultValue?: any
 * - min / max?: number（type=number）
 * - options?: { label, value }[]（type=select）
 *
 * preset / registerField 的 fields 项还可传：
 * - label / labelId?: 展示名；有 labelId 时随 formatMessage 切换语言
 * - groupName / groupNameId?: 自定义类型下拉分组；有 groupNameId 时随语言切换；都不传则归入「扩展字段」
 * - valueSchema?: object | (field) => object  提交值的 JSON Schema 片段；缺省回退 { type: 'string' }
 *   可含 format（date/month/week/time/date-time/password/color/json）与 display（option/phone/file/typed-date-range/date-to-today/html/money），供 SchemaContent 预览
 * - formatDisplayValue?: (value, field, ctx) => string  覆盖 valueSchema 默认预览
 */
export const registerField = (type, definition) => {
  const propsSchema = Array.isArray(definition?.propsSchema) ? definition.propsSchema : undefined;
  const groupName = definition?.groupName != null && String(definition.groupName).trim() ? String(definition.groupName).trim() : undefined;
  const groupNameId = definition?.groupNameId != null && String(definition.groupNameId).trim() ? String(definition.groupNameId).trim() : undefined;
  const labelId = definition?.labelId != null && String(definition.labelId).trim() ? String(definition.labelId).trim() : undefined;
  defineField(type, {
    ...definition,
    propsSchema,
    groupName,
    groupNameId,
    labelId,
    hasFieldProps: definition.hasFieldProps ?? !!(propsSchema && propsSchema.length)
  });
};

export const pickFromPropsSchema = (props = {}, propsSchema = [], defaultProps = {}) => {
  const next = {};
  propsSchema.forEach(item => {
    if (!item?.name) {
      return;
    }
    const key = item.name;
    const fallback = item.defaultValue !== undefined ? item.defaultValue : defaultProps[key];
    if (item.type === 'boolean') {
      next[key] = props[key] !== undefined ? !!props[key] : !!fallback;
      return;
    }
    if (item.type === 'number') {
      next[key] = props[key] != null && props[key] !== '' ? props[key] : (fallback ?? null);
      return;
    }
    if (item.type === 'select') {
      next[key] = props[key] !== undefined ? props[key] : fallback;
      return;
    }
    next[key] = props[key] != null ? props[key] : (fallback ?? '');
  });
  return next;
};

export const applyFromPropsSchema = (props, values = {}, propsSchema = []) => {
  propsSchema.forEach(item => {
    if (!item?.name) {
      return;
    }
    const key = item.name;
    const value = values[key];
    if (item.type === 'boolean') {
      props[key] = !!value;
      return;
    }
    if (item.type === 'number') {
      setOptionalNumber(props, key, value);
      return;
    }
    if (item.type === 'select') {
      if (value !== undefined && value !== null && value !== '') {
        props[key] = value;
      } else if (item.defaultValue !== undefined) {
        props[key] = item.defaultValue;
      } else {
        delete props[key];
      }
      return;
    }
    setOptionalString(props, key, value);
  });
};

export const getFieldDefinition = type => registry.get(type);

/** 解析字段类型展示名：内置走 labelId；扩展字段可用已翻译的 label */
export const resolveFieldTypeLabel = (typeOrDefinition, formatMessage) => {
  const definition = typeof typeOrDefinition === 'string' ? registry.get(typeOrDefinition) : typeOrDefinition;
  if (!definition) {
    return typeof typeOrDefinition === 'string' ? typeOrDefinition : '';
  }
  return resolveRegistryLabel(formatMessage, definition.labelId, definition.label) || definition.type || '';
};

/**
 * 解析字段提交值的 JSON Schema 片段。
 * 优先用 definition.valueSchema（对象或 (field)=>schema）；缺省 { type: 'string' }。
 */
export const resolveFieldValueSchema = field => {
  if (!field || !field.type) {
    return { type: 'string' };
  }
  const definition = registry.get(field.type);
  const raw = definition?.valueSchema;
  let schema;
  if (typeof raw === 'function') {
    schema = raw(field);
  } else if (raw && typeof raw === 'object') {
    schema = { ...raw };
  } else {
    schema = { type: 'string' };
  }
  if (!schema || typeof schema !== 'object') {
    schema = { type: 'string' };
  } else {
    schema = { ...schema };
  }
  const title = field.label != null && String(field.label).trim() ? String(field.label).trim() : undefined;
  const description = field.description != null && String(field.description).trim() ? String(field.description).trim() : undefined;
  if (title && schema.title == null) {
    schema.title = title;
  }
  if (description && schema.description == null) {
    schema.description = description;
  }
  return schema;
};

export const getFieldComponent = (type, field) => {
  const definition = registry.get(type);
  if (!definition) {
    return undefined;
  }
  if (typeof definition.resolveComponent === 'function') {
    return definition.resolveComponent(field?.props || {});
  }
  return definition.component;
};

export const getFieldTypes = formatMessage => {
  const grouped = FIELD_GROUPS.map(group => ({
    label: resolveRegistryLabel(formatMessage, group.labelId, group.label),
    options: group.types
      .map(type => registry.get(type))
      .filter(Boolean)
      .map(item => ({
        label: resolveFieldTypeLabel(item, formatMessage),
        value: item.type
      }))
  }));

  const builtinTypes = new Set(FIELD_GROUPS.flatMap(group => group.types));
  const registered = Array.from(registry.values()).filter(item => !builtinTypes.has(item.type));

  const customGroups = new Map();
  const fallback = [];

  registered.forEach(item => {
    const option = {
      label: resolveFieldTypeLabel(item, formatMessage),
      value: item.type
    };
    const groupNameId = item.groupNameId != null && String(item.groupNameId).trim() ? String(item.groupNameId).trim() : '';
    const groupName = item.groupName != null && String(item.groupName).trim() ? String(item.groupName).trim() : '';
    if (!groupNameId && !groupName) {
      fallback.push(option);
      return;
    }
    const groupKey = groupNameId || groupName;
    if (!customGroups.has(groupKey)) {
      customGroups.set(groupKey, {
        label: resolveRegistryLabel(formatMessage, groupNameId || null, groupName),
        options: []
      });
    }
    customGroups.get(groupKey).options.push(option);
  });

  customGroups.forEach(({ label, options }) => {
    grouped.push({ label, options });
  });
  if (fallback.length) {
    grouped.push({
      label: resolveRegistryLabel(formatMessage, 'FieldGroupExtended', '扩展字段'),
      options: fallback
    });
  }
  return grouped;
};

export const normalizeOptions = (options, { allowChildren = false, columns = [] } = {}) => {
  if (!Array.isArray(options)) {
    return [];
  }
  const columnNames = (columns || []).map(item => item?.name).filter(Boolean);

  return options
    .map(item => {
      const label = String(item?.label ?? '').trim();
      let value = String(item?.value ?? '').trim();
      if (!value && label) {
        value = label;
      }
      const next = {
        label,
        value,
        description: String(item?.description ?? '').trim()
      };
      columnNames.forEach(name => {
        next[name] = item?.[name] ?? '';
      });
      if (!String(next.label).trim() && columnNames[0] && String(next[columnNames[0]] || '').trim()) {
        next.label = String(next[columnNames[0]]).trim();
      }
      if (!String(next.value).trim() && String(next.label).trim()) {
        next.value = next.label;
      }
      if (allowChildren && Array.isArray(item?.children) && item.children.length) {
        next.children = normalizeOptions(item.children, { allowChildren: true, columns });
      }
      return next;
    })
    .filter(item => {
      if (item.label || item.value || (item.children && item.children.length)) {
        return true;
      }
      return columnNames.some(name => String(item[name] || '').trim());
    });
};

export const normalizeColumns = columns => {
  if (!Array.isArray(columns)) {
    return [];
  }
  return columns
    .map((item, index) => {
      const title = item?.title ?? '';
      const name = String(item?.name || item?.dataIndex || item?.key || '').trim() || `col_${index + 1}`;
      const next = {
        title,
        name,
        key: name
      };
      if (item?.width != null && item.width !== '') {
        next.width = Number(item.width);
      }
      return next;
    })
    .filter(item => String(item.title || '').trim() || String(item.name || '').trim());
};

const pickSuperSelectFormValues = (field, definition) => {
  const props = field.props || {};
  const columns = normalizeColumns(props.columns);
  return {
    single: !!props.single,
    isPopup: props.isPopup !== false,
    allowClear: props.allowClear !== false,
    allowSelectedAll: !!props.allowSelectedAll,
    onlyAllowLastLevel: !!props.onlyAllowLastLevel,
    maxLength: props.maxLength,
    placeholder: props.placeholder || '',
    searchPlaceholder: props.searchPlaceholder || '',
    columns: columns.length ? columns : [createEmptyColumn()]
  };
};

const applySuperSelectProps = (props, values, definition) => {
  props.single = !!values.single;
  props.isPopup = values.isPopup !== false;
  props.allowClear = values.allowClear !== false;
  props.allowSelectedAll = !values.single && !!values.allowSelectedAll;

  if (!values.single && values.maxLength != null && values.maxLength !== '') {
    props.maxLength = Number(values.maxLength);
  } else {
    delete props.maxLength;
  }

  if (values.placeholder) {
    props.placeholder = values.placeholder;
  } else {
    delete props.placeholder;
  }

  if (values.searchPlaceholder) {
    props.searchPlaceholder = values.searchPlaceholder;
  } else {
    delete props.searchPlaceholder;
  }

  // labelKey / valueKey 固定用类型默认值，不开放给用户编辑
  if (!definition.hasBuiltinData) {
    props.labelKey = definition.defaultProps?.labelKey || 'label';
    props.valueKey = definition.defaultProps?.valueKey || 'value';
  }

  if (definition.hasOnlyLastLevel) {
    props.onlyAllowLastLevel = !!values.onlyAllowLastLevel;
  } else {
    delete props.onlyAllowLastLevel;
  }

  if (definition.hasColumns) {
    props.columns = normalizeColumns(values.columns);
  } else {
    delete props.columns;
  }
};

const setOptionalNumber = (props, key, value) => {
  if (value != null && value !== '') {
    props[key] = Number(value);
  } else {
    delete props[key];
  }
};

const setOptionalString = (props, key, value) => {
  if (value != null && String(value).trim()) {
    props[key] = value;
  } else {
    delete props[key];
  }
};

export const pickFieldProps = (field, definition) => {
  const props = field.props || {};
  const type = definition?.type || field.type;
  switch (type) {
    case 'Input':
      return {
        placeholder: props.placeholder || '',
        allowClear: props.allowClear !== false,
        maxLength: props.maxLength
      };
    case 'TextArea':
      return {
        placeholder: props.placeholder || '',
        rows: props.rows ?? 3,
        maxLength: props.maxLength,
        showCount: !!props.showCount
      };
    case 'InputNumber':
      return {
        placeholder: props.placeholder || '',
        min: props.min,
        max: props.max,
        step: props.step,
        precision: props.precision
      };
    case 'Select':
      return {
        placeholder: props.placeholder || '',
        allowClear: props.allowClear !== false,
        mode: props.mode === 'multiple' || props.mode === 'tags' ? 'multiple' : 'single'
      };
    case 'DatePicker': {
      const raw = props.placeholder;
      const placeholder = Array.isArray(raw) ? raw[0] || '' : raw || '';
      return {
        placeholder,
        allowClear: props.allowClear !== false,
        format: props.format || 'YYYY-MM-DD',
        picker: props.picker || 'date',
        showTime: !!props.showTime,
        range: !!props.range
      };
    }
    case 'Switch':
      return {
        checkedChildren: props.checkedChildren || '',
        unCheckedChildren: props.unCheckedChildren || ''
      };
    case 'RadioGroup':
    case 'CheckboxGroup':
      return {
        inline: props.inline !== false
      };
    default:
      if (definition?.propsSchema?.length) {
        return pickFromPropsSchema(props, definition.propsSchema, definition.defaultProps || {});
      }
      return {};
  }
};

const applyFieldProps = (props, values, definition) => {
  const type = definition.type;
  switch (type) {
    case 'Input':
      setOptionalString(props, 'placeholder', values.placeholder);
      props.allowClear = values.allowClear !== false;
      setOptionalNumber(props, 'maxLength', values.maxLength);
      break;
    case 'TextArea':
      setOptionalString(props, 'placeholder', values.placeholder);
      props.rows = values.rows ?? 3;
      setOptionalNumber(props, 'maxLength', values.maxLength);
      if (values.showCount) {
        props.showCount = true;
      } else {
        delete props.showCount;
      }
      break;
    case 'InputNumber':
      setOptionalString(props, 'placeholder', values.placeholder);
      setOptionalNumber(props, 'min', values.min);
      setOptionalNumber(props, 'max', values.max);
      setOptionalNumber(props, 'step', values.step);
      setOptionalNumber(props, 'precision', values.precision);
      break;
    case 'Select':
      setOptionalString(props, 'placeholder', values.placeholder);
      props.allowClear = values.allowClear !== false;
      if (values.mode === 'multiple') {
        props.mode = 'multiple';
      } else {
        delete props.mode;
      }
      break;
    case 'DatePicker': {
      props.allowClear = values.allowClear !== false;
      props.picker = values.picker || 'date';
      props.format = values.format || 'YYYY-MM-DD';
      props.range = !!values.range;
      if (values.showTime && props.picker === 'date') {
        props.showTime = true;
      } else {
        delete props.showTime;
      }
      if (values.range) {
        // RangePicker 用数组 placeholder；单框用字符串
        const raw = values.placeholder;
        const text = (Array.isArray(raw) ? raw[0] : raw) || '请选择日期';
        props.placeholder = [text, text];
      } else {
        setOptionalString(props, 'placeholder', values.placeholder);
      }
      break;
    }
    case 'Switch':
      setOptionalString(props, 'checkedChildren', values.checkedChildren);
      setOptionalString(props, 'unCheckedChildren', values.unCheckedChildren);
      break;
    case 'RadioGroup':
    case 'CheckboxGroup':
      // 始终落盘布尔值，避免 Checkbox 未勾选时字段缺失被当成默认单行
      props.inline = values.inline !== false;
      break;
    default:
      if (definition?.propsSchema?.length) {
        applyFromPropsSchema(props, values, definition.propsSchema);
      }
      break;
  }
};

export const fieldToFormValues = field => {
  const definition = getFieldDefinition(field.type);
  const ruleConfig = parseRuleString(field.rule);
  const allowChildren = !!definition?.optionsAllowChildren;
  const columns = definition?.hasColumns ? normalizeColumns(field.props?.columns) : [];
  const options = normalizeOptions(field.props?.options, { allowChildren, columns });
  const rawPlaceholder = field.props?.placeholder;
  const placeholder = Array.isArray(rawPlaceholder) ? rawPlaceholder[0] || '' : rawPlaceholder || '';

  return {
    type: field.type,
    name: field.name,
    label: field.label,
    tips: field.tips || '',
    description: field.description || '',
    block: !!field.block,
    hidden: !!field.hidden,
    placeholder,
    options: options.length ? options : [{ label: '', value: '' }],
    ruleConfig,
    hasOptions: !!definition?.hasOptions,
    selectProps: definition?.isSuperSelect ? pickSuperSelectFormValues(field, definition) : undefined,
    fieldProps: definition?.hasFieldProps ? pickFieldProps(field, definition) : undefined
  };
};

export const formValuesToField = (values, existingField = {}) => {
  const definition = getFieldDefinition(values.type) || getFieldDefinition('Input');
  // 不沿用旧类型残留 props，避免切换填写项类型后参数串味
  const props = { ...(definition.defaultProps || {}) };

  if (definition.isSuperSelect) {
    applySuperSelectProps(props, values.selectProps || values, definition);
  } else if (definition.hasFieldProps) {
    applyFieldProps(props, values.fieldProps || values, definition);
  } else if (values.placeholder) {
    props.placeholder = values.placeholder;
  } else {
    delete props.placeholder;
  }

  if (definition.hasOptions) {
    props.options = normalizeOptions(values.options, {
      allowChildren: !!definition.optionsAllowChildren,
      columns: definition.hasColumns ? props.columns || [] : []
    });
  } else {
    delete props.options;
  }

  if (values.type === 'Checkbox' && values.label) {
    props.children = values.label;
  }

  const rule = buildRuleString(values.ruleConfig);

  return {
    id: existingField.id,
    type: values.type,
    name: values.name,
    label: values.label,
    tips: values.tips != null && String(values.tips).trim() ? values.tips : '',
    description: values.description != null && String(values.description).trim() ? values.description : '',
    rule,
    block: values.block ?? definition.defaults?.block ?? false,
    hidden: !!values.hidden,
    props
  };
};
