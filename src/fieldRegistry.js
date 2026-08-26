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
    label: '基础字段',
    types: ['Input', 'TextArea', 'InputNumber', 'Switch', 'Checkbox', 'DatePicker']
  },
  {
    label: '选择字段',
    types: ['Select', 'RadioGroup', 'CheckboxGroup']
  },
  {
    label: '高级选择',
    types: ['SuperSelectList', 'SuperSelectTableList', 'SuperSelectTree', 'SuperSelectCascader']
  },
  {
    label: '业务选择',
    types: ['SelectFunction', 'SelectIndustry', 'SelectAddress']
  }
];

defineField('Input', {
  label: '单行文本',
  group: '基础字段',
  component: Input,
  defaultProps: { allowClear: true },
  hasFieldProps: true
});

defineField('TextArea', {
  label: '多行文本',
  group: '基础字段',
  component: TextArea,
  defaultProps: { rows: 3 },
  defaults: { block: true },
  hasFieldProps: true
});

defineField('InputNumber', {
  label: '数字',
  group: '基础字段',
  component: InputNumber,
  defaultProps: {},
  hasFieldProps: true
});

defineField('Select', {
  label: '下拉选择',
  group: '选择字段',
  component: Select,
  defaultProps: { options: [], allowClear: true },
  hasOptions: true,
  hasFieldProps: true
});

defineField('RadioGroup', {
  label: '单选组',
  group: '选择字段',
  component: RadioGroup,
  defaultProps: { options: [] },
  hasOptions: true
});

defineField('CheckboxGroup', {
  label: '复选组',
  group: '选择字段',
  component: CheckboxGroup,
  defaultProps: { options: [] },
  hasOptions: true
});

defineField('SuperSelectList', {
  label: '普通下拉',
  group: 'SuperSelect',
  component: SuperSelectList,
  defaultProps: { options: [], isPopup: true, allowClear: true, labelKey: 'label', valueKey: 'value' },
  isSuperSelect: true,
  hasOptions: true,
  optionsAllowDescription: true
});

defineField('SuperSelectTableList', {
  label: '表格选择',
  group: 'SuperSelect',
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
  optionsAllowDescription: true
});

defineField('SuperSelectTree', {
  label: '树形选择',
  group: 'SuperSelect',
  component: SuperSelectTree,
  defaultProps: { options: [], isPopup: true, allowClear: true, labelKey: 'label', valueKey: 'value' },
  isSuperSelect: true,
  hasOptions: true,
  optionsAllowChildren: true,
  optionsAllowDescription: true
});

defineField('SuperSelectCascader', {
  label: '级联选择',
  group: 'SuperSelect',
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
  optionsAllowDescription: true
});

defineField('SelectFunction', {
  label: '职能选择',
  group: 'SuperSelectPlus',
  component: SelectFunctionField,
  defaultProps: { isPopup: true, allowClear: true },
  isSuperSelect: true,
  hasBuiltinData: true
});

defineField('SelectIndustry', {
  label: '行业选择',
  group: 'SuperSelectPlus',
  component: SelectIndustryField,
  defaultProps: { isPopup: true, allowClear: true },
  isSuperSelect: true,
  hasBuiltinData: true
});

defineField('SelectAddress', {
  label: '地址选择',
  group: 'SuperSelectPlus',
  component: SelectAddressField,
  defaultProps: { isPopup: true, allowClear: true },
  isSuperSelect: true,
  hasBuiltinData: true
});

defineField('Switch', {
  label: '开关',
  group: '基础字段',
  component: Switch,
  defaultProps: {},
  hasFieldProps: true
});

defineField('Checkbox', {
  label: '复选框',
  group: '基础字段',
  component: Checkbox,
  defaultProps: { children: '' }
});

defineField('DatePicker', {
  label: '日期',
  group: '基础字段',
  component: DatePicker,
  defaultProps: {
    format: 'YYYY-MM-DD',
    picker: 'date',
    allowClear: true,
    range: false,
    showTime: false
  },
  hasFieldProps: true,
  resolveComponent: props => (props?.range ? DatePicker.RangePicker || DatePicker : DatePicker)
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
 * preset({ type, definition }) 的 fields 项还可传：
 * - groupName?: string 自定义类型下拉分组名；不传则归入「扩展字段」
 */
export const registerField = (type, definition) => {
  const propsSchema = Array.isArray(definition?.propsSchema) ? definition.propsSchema : undefined;
  const groupName = definition?.groupName != null && String(definition.groupName).trim() ? String(definition.groupName).trim() : undefined;
  defineField(type, {
    ...definition,
    propsSchema,
    groupName,
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

export const getFieldTypes = () => {
  const grouped = FIELD_GROUPS.map(group => ({
    label: group.label,
    options: group.types
      .map(type => registry.get(type))
      .filter(Boolean)
      .map(({ type, label }) => ({ label, value: type }))
  }));

  const builtinTypes = new Set(FIELD_GROUPS.flatMap(group => group.types));
  const registered = Array.from(registry.values()).filter(item => !builtinTypes.has(item.type));

  const customGroups = new Map();
  const fallback = [];

  registered.forEach(item => {
    const option = { label: item.label, value: item.type };
    const groupName = item.groupName != null && String(item.groupName).trim() ? String(item.groupName).trim() : '';
    if (!groupName) {
      fallback.push(option);
      return;
    }
    if (!customGroups.has(groupName)) {
      customGroups.set(groupName, []);
    }
    customGroups.get(groupName).push(option);
  });

  customGroups.forEach((options, label) => {
    grouped.push({ label, options });
  });
  if (fallback.length) {
    grouped.push({
      label: '扩展字段',
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
      const next = {
        label: item?.label ?? '',
        value: item?.value ?? '',
        description: item?.description ?? ''
      };
      columnNames.forEach(name => {
        next[name] = item?.[name] ?? '';
      });
      if (!String(next.label).trim() && columnNames[0] && String(next[columnNames[0]] || '').trim()) {
        next.label = String(next[columnNames[0]]);
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
