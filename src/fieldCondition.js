export const CONDITION_OPERATORS = ['eq', 'neq', 'in', 'includesAny', 'empty', 'notEmpty', 'gt', 'gte', 'lt', 'lte', 'regex'];

export const NO_VALUE_OPERATORS = ['empty', 'notEmpty'];

export const ALLOWED_REGEX_FLAGS = ['i', 'm', 's', 'u'];

// 列表类模块内的字段会重复出现，单个 name 定位不到具体条目，不参与条件
const LIST_BLOCK_KINDS = ['list', 'tableList', 'editableList', 'multiField'];

export const getByPath = (data, path) => {
  if (data == null || path == null || path === '') {
    return undefined;
  }
  return String(path)
    .split('.')
    .reduce((current, key) => (current == null ? undefined : current[key]), data);
};

export const isEmptyValue = value => value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0);

// SuperSelect 等字段的值是 { label, value } 对象，比较时统一取 value
const toComparable = item => {
  if (item && typeof item === 'object' && !Array.isArray(item)) {
    return item.value ?? item.id ?? item.key ?? item;
  }
  return item;
};

const toArray = value => (Array.isArray(value) ? value : isEmptyValue(value) ? [] : [value]);

const sameValue = (a, b) => String(toComparable(a)) === String(toComparable(b));

export const sanitizeRegexFlags = flags =>
  Array.from(new Set(String(flags || '').split('')))
    .filter(flag => ALLOWED_REGEX_FLAGS.includes(flag))
    .join('');

const regexCache = new Map();

/** 编译失败返回 null；以「源码 + flags」缓存 */
export const compileConditionRegex = (source, flags) => {
  if (source == null || String(source) === '') {
    return null;
  }
  const safeFlags = sanitizeRegexFlags(flags);
  const key = `${safeFlags}/${source}`;
  if (regexCache.has(key)) {
    return regexCache.get(key);
  }
  let regex = null;
  try {
    regex = new RegExp(String(source), safeFlags);
  } catch (error) {
    regex = null;
  }
  regexCache.set(key, regex);
  return regex;
};

const toNumber = value => {
  if (isEmptyValue(value) || typeof value === 'boolean') {
    return NaN;
  }
  return Number(value);
};

/**
 * 返回 true / false；条件本身无效（未知运算符、正则无法编译）时返回 null，由调用方忽略
 */
export const evaluateCondition = (condition, formData) => {
  if (!condition?.field || !CONDITION_OPERATORS.includes(condition.operator)) {
    return null;
  }
  const actual = getByPath(formData, condition.field);
  const expected = condition.value;
  switch (condition.operator) {
    case 'empty':
      return isEmptyValue(actual);
    case 'notEmpty':
      return !isEmptyValue(actual);
    case 'eq':
      return !isEmptyValue(actual) && !Array.isArray(actual) && sameValue(actual, expected);
    case 'neq':
      return isEmptyValue(actual) || Array.isArray(actual) || !sameValue(actual, expected);
    case 'in':
      return !isEmptyValue(actual) && toArray(expected).some(item => sameValue(actual, item));
    case 'includesAny': {
      const expectedList = toArray(expected);
      return toArray(actual).some(item => expectedList.some(target => sameValue(item, target)));
    }
    case 'gt':
    case 'gte':
    case 'lt':
    case 'lte': {
      const a = toNumber(actual);
      const b = toNumber(expected);
      if (!Number.isFinite(a) || !Number.isFinite(b)) {
        return false;
      }
      return { gt: a > b, gte: a >= b, lt: a < b, lte: a <= b }[condition.operator];
    }
    case 'regex': {
      const regex = compileConditionRegex(expected, condition.flags);
      if (!regex) {
        return null;
      }
      if (isEmptyValue(actual)) {
        return false;
      }
      return toArray(actual).some(item => regex.test(String(toComparable(item))));
    }
    default:
      return null;
  }
};

export const hasVisibleWhen = field => Array.isArray(field?.visibleWhen?.conditions) && field.visibleWhen.conditions.length > 0;

/**
 * knownNames：可作为触发字段的完整路径集合；传入时引用未知字段的条件视为失效
 * 全部条件失效时返回 true（照常显示）
 */
export const evaluateVisibleWhen = (visibleWhen, formData, knownNames) => {
  const conditions = visibleWhen?.conditions;
  if (!Array.isArray(conditions) || !conditions.length) {
    return true;
  }
  const results = conditions
    .map(condition => {
      if (knownNames && !knownNames.has(condition?.field)) {
        return null;
      }
      return evaluateCondition(condition, formData || {});
    })
    .filter(result => result !== null);
  if (!results.length) {
    return true;
  }
  return visibleWhen.logic === 'or' ? results.some(Boolean) : results.every(Boolean);
};

const joinPath = (prefix, name) => (prefix ? `${prefix}.${name}` : name);

/**
 * 收集 schema 中所有字段：{ id, path, field, inList }
 * path 为提交数据中的完整路径（object 模块带前缀）；inList 表示位于列表类模块内
 */
export const collectConditionFields = schema => {
  const result = [];
  const pushFields = (list, prefix, inList) => {
    (list || []).forEach(field => {
      if (field?.name) {
        result.push({ id: field.id, path: joinPath(prefix, field.name), field, inList });
      }
    });
  };
  // 与 renderSchema 一致：仅 object 模块自身字段带 block.name 前缀，子模块不累加
  const walk = (blocks, inList) => {
    (blocks || []).forEach(block => {
      if (!block) {
        return;
      }
      const blockInList = inList || LIST_BLOCK_KINDS.includes(block.kind);
      pushFields(block.list, block.kind === 'object' ? block.name || '' : '', blockInList);
      (block.items || []).forEach(step => {
        pushFields(step.list, '', blockInList);
        walk(step.blocks, blockInList);
      });
      (block.options || []).forEach(option => {
        pushFields(option.list, '', blockInList);
        walk(option.blocks, blockInList);
      });
      walk(block.blocks, blockInList);
      walk(block.itemBlocks, true);
    });
  };
  walk(schema?.blocks, false);
  return result;
};

/** 字段所在模块的路径前缀与是否位于列表类模块内；找不到返回 null */
export const getBlockConditionScope = (schema, blockId) => {
  let found = null;
  const walk = (blocks, inList) => {
    (blocks || []).forEach(block => {
      if (!block || found) {
        return;
      }
      const blockInList = inList || LIST_BLOCK_KINDS.includes(block.kind);
      if (block.id === blockId) {
        found = { prefix: block.kind === 'object' ? block.name || '' : '', inList: blockInList };
        return;
      }
      (block.items || []).forEach(step => walk(step.blocks, blockInList));
      (block.options || []).forEach(option => walk(option.blocks, blockInList));
      walk(block.blocks, blockInList);
      walk(block.itemBlocks, true);
    });
  };
  walk(schema?.blocks, false);
  return found;
};

export const getFieldConditionPath = (scope, name) => (name ? joinPath(scope?.prefix || '', name) : '');

/** 可作为触发字段的路径集合（排除列表类模块内字段） */
export const collectTriggerNames = schema =>
  new Set(
    collectConditionFields(schema)
      .filter(item => !item.inList)
      .map(item => item.path)
  );

/** 某字段的条件里引用了不存在 / 不可用的触发字段 */
export const hasInvalidCondition = (field, triggerNames) =>
  hasVisibleWhen(field) && field.visibleWhen.conditions.some(condition => !triggerNames.has(condition?.field) || (condition.operator === 'regex' && !compileConditionRegex(condition.value, condition.flags)));

const buildDependencyGraph = schema => {
  const graph = new Map();
  collectConditionFields(schema).forEach(({ path, field }) => {
    if (hasVisibleWhen(field)) {
      graph.set(path, field.visibleWhen.conditions.map(condition => condition?.field).filter(Boolean));
    }
  });
  return graph;
};

/** 返回循环链路（路径数组，首尾相同）；无循环返回 null */
export const findConditionCycle = schema => {
  const graph = buildDependencyGraph(schema);
  const state = new Map();
  const stack = [];
  const visit = node => {
    if (state.get(node) === 'done') {
      return null;
    }
    if (state.get(node) === 'visiting') {
      return [...stack.slice(stack.indexOf(node)), node];
    }
    state.set(node, 'visiting');
    stack.push(node);
    for (const next of graph.get(node) || []) {
      const cycle = visit(next);
      if (cycle) {
        return cycle;
      }
    }
    stack.pop();
    state.set(node, 'done');
    return null;
  };
  for (const node of graph.keys()) {
    const cycle = visit(node);
    if (cycle) {
      return cycle;
    }
  }
  return null;
};

/** 选中 candidate 作为 fieldPath 的触发字段是否会形成循环 */
export const wouldCreateCycle = (schema, fieldPath, candidatePath) => {
  if (fieldPath === candidatePath) {
    return true;
  }
  const graph = buildDependencyGraph(schema);
  const seen = new Set();
  const queue = [candidatePath];
  while (queue.length) {
    const node = queue.shift();
    if (node === fieldPath) {
      return true;
    }
    if (seen.has(node)) {
      continue;
    }
    seen.add(node);
    (graph.get(node) || []).forEach(next => queue.push(next));
  }
  return false;
};

const mapFieldList = (list, mapper) => (Array.isArray(list) ? list.map(mapper) : list);

const mapBlockFields = (block, mapper) => {
  if (!block) {
    return block;
  }
  const next = { ...block, list: mapFieldList(block.list, mapper) };
  if (Array.isArray(block.items)) {
    next.items = block.items.map(step => ({ ...step, list: mapFieldList(step.list, mapper), blocks: mapBlocksFields(step.blocks, mapper) }));
  }
  if (Array.isArray(block.options)) {
    next.options = block.options.map(option => ({ ...option, list: mapFieldList(option.list, mapper), blocks: mapBlocksFields(option.blocks, mapper) }));
  }
  if (Array.isArray(block.blocks)) {
    next.blocks = mapBlocksFields(block.blocks, mapper);
  }
  if (Array.isArray(block.itemBlocks)) {
    next.itemBlocks = mapBlocksFields(block.itemBlocks, mapper);
  }
  return next;
};

const mapBlocksFields = (blocks, mapper) => (Array.isArray(blocks) ? blocks.map(block => mapBlockFields(block, mapper)) : blocks);

/** 触发字段改名后，同步所有条件中的引用 */
export const renameConditionReferences = (schema, oldPath, newPath) => {
  if (!oldPath || !newPath || oldPath === newPath) {
    return schema;
  }
  return {
    ...schema,
    blocks: mapBlocksFields(schema?.blocks, field => {
      if (!hasVisibleWhen(field) || !field.visibleWhen.conditions.some(condition => condition?.field === oldPath)) {
        return field;
      }
      return {
        ...field,
        visibleWhen: {
          ...field.visibleWhen,
          conditions: field.visibleWhen.conditions.map(condition => (condition?.field === oldPath ? { ...condition, field: newPath } : condition))
        }
      };
    })
  };
};

/**
 * 触发字段的值类型，决定可用运算符与值输入方式：
 * options（单值选项）/ multiOptions（多值选项）/ number / boolean / text
 * definition 为字段注册定义（getFieldDefinition(field.type)），由调用方传入
 */
export const getConditionValueKind = (field, definition) => {
  const props = field?.props || {};
  if (field?.type === 'CheckboxGroup' || definition?.isSuperSelect || (field?.type === 'Select' && (props.mode === 'multiple' || props.mode === 'tags'))) {
    return 'multiOptions';
  }
  if (definition?.hasOptions) {
    return 'options';
  }
  if (field?.type === 'Switch' || field?.type === 'Checkbox') {
    return 'boolean';
  }
  const valueSchema = typeof definition?.valueSchema === 'function' ? definition.valueSchema(field) : definition?.valueSchema;
  if (valueSchema?.type === 'number' || valueSchema?.type === 'integer') {
    return 'number';
  }
  return 'text';
};

export const OPERATORS_BY_KIND = {
  options: ['eq', 'neq', 'in', 'empty', 'notEmpty'],
  multiOptions: ['includesAny', 'empty', 'notEmpty', 'regex'],
  number: ['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'empty', 'notEmpty', 'regex'],
  boolean: ['eq', 'neq'],
  text: ['eq', 'neq', 'empty', 'notEmpty', 'regex']
};

export const getConditionOperators = (field, definition) => OPERATORS_BY_KIND[getConditionValueKind(field, definition)] || OPERATORS_BY_KIND.text;

/** 去掉空条件，规范 logic / flags；无有效条件返回 undefined（不写入 schema） */
export const normalizeVisibleWhen = visibleWhen => {
  const conditions = (visibleWhen?.conditions || [])
    .filter(condition => condition?.field && CONDITION_OPERATORS.includes(condition.operator))
    .map(condition => {
      const next = { field: condition.field, operator: condition.operator };
      if (!NO_VALUE_OPERATORS.includes(condition.operator)) {
        next.value = condition.value;
      }
      if (condition.operator === 'regex') {
        const flags = sanitizeRegexFlags(condition.flags);
        if (flags) {
          next.flags = flags;
        }
      }
      return next;
    });
  if (!conditions.length) {
    return undefined;
  }
  return { logic: visibleWhen.logic === 'or' ? 'or' : 'and', conditions };
};

const formatConditionValue = (condition, optionLabelOf) => {
  if (condition.operator === 'regex') {
    return `/${condition.value ?? ''}/${sanitizeRegexFlags(condition.flags)}`;
  }
  return toArray(condition.value)
    .map(item => optionLabelOf(item))
    .join(', ');
};

/**
 * 条件的可读摘要，如「是否通过 等于 不通过」
 * formatMessage 需含 conditionOperator_* / conditionLogic_* 文案；fieldLookup 为 path → field
 */
export const formatVisibleWhen = (visibleWhen, { formatMessage, fieldLookup = new Map(), resolveText = text => text } = {}) => {
  const conditions = visibleWhen?.conditions || [];
  const parts = conditions.map(condition => {
    const trigger = fieldLookup.get(condition.field);
    const fieldLabel = (trigger && resolveText(trigger.label)) || condition.field;
    const optionLabelOf = value => {
      const option = (trigger?.props?.options || []).find(item => sameValue(item?.value, value));
      if (option) {
        return resolveText(option.label);
      }
      if (typeof value === 'boolean') {
        return formatMessage({ id: value ? 'conditionValueTrue' : 'conditionValueFalse' });
      }
      return String(toComparable(value));
    };
    const operatorText = formatMessage({ id: `conditionOperator_${condition.operator}` });
    if (NO_VALUE_OPERATORS.includes(condition.operator)) {
      return `${fieldLabel} ${operatorText}`;
    }
    return `${fieldLabel} ${operatorText} ${formatConditionValue(condition, optionLabelOf)}`;
  });
  return parts.join(formatMessage({ id: visibleWhen?.logic === 'or' ? 'conditionJoinOr' : 'conditionJoinAnd' }));
};
