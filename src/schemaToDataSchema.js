import { normalizeSchema, supportsItemBlocks } from './schema';
import { resolveFieldValueSchema } from './fieldRegistry';
import { parseRuleString } from './rulePresets';
import { localizeSchema } from './localeText';
import { collectConditionFields, formatVisibleWhen, hasVisibleWhen } from './fieldCondition';
import zhCN from './locale/zh-CN';
import enUS from './locale/en-US';

const createObjectLayer = () => ({
  properties: {},
  required: [],
  composites: []
});

const isReq = rule => parseRuleString(rule).presets.includes('REQ');

const resolveChoiceSelectorName = block => {
  if (block.selectorName != null && String(block.selectorName).trim()) {
    return String(block.selectorName).trim();
  }
  if (block.discriminator?.propertyName) {
    return String(block.discriminator.propertyName).trim();
  }
  return `__choice_${block.id}`;
};

/** 条件说明文案：按 options.locale 取包内语言包，英文以外回退中文 */
const createConditionContext = (normalized, locale) => {
  const messages = String(locale || '').startsWith('en') ? enUS : zhCN;
  const formatMessage = ({ id }, values = {}) => String(messages[id] ?? id).replace(/\{(\w+)\}/g, (match, key) => (values[key] != null ? values[key] : match));
  const conditionFields = collectConditionFields(normalized).filter(item => !item.inList);
  return {
    formatMessage,
    knownNames: new Set(conditionFields.map(item => item.path)),
    fieldLookup: new Map(conditionFields.map(item => [item.path, item.field]))
  };
};

const describeVisibleWhen = (field, ctx) => {
  const visibleWhen = {
    ...field.visibleWhen,
    conditions: field.visibleWhen.conditions.filter(condition => ctx.knownNames.has(condition?.field))
  };
  if (!visibleWhen.conditions.length) {
    return '';
  }
  const condition = formatVisibleWhen(visibleWhen, { formatMessage: ctx.formatMessage, fieldLookup: ctx.fieldLookup });
  return ctx.formatMessage({ id: 'conditionDescription' }, { condition });
};

const mergeFieldIntoLayer = (layer, field, { allowRequired = true, ctx } = {}) => {
  if (!field?.name) {
    return;
  }
  const name = String(field.name).trim();
  if (!name) {
    return;
  }
  const valueSchema = resolveFieldValueSchema(field);
  const conditionText = ctx?.formatMessage && hasVisibleWhen(field) ? describeVisibleWhen(field, ctx) : '';
  if (conditionText) {
    valueSchema.description = valueSchema.description ? `${valueSchema.description}\n${conditionText}` : conditionText;
  }
  layer.properties[name] = valueSchema;
  // 条件显示字段可能不出现在提交数据中，不进 required
  if (allowRequired && !conditionText && isReq(field.rule) && !layer.required.includes(name)) {
    layer.required.push(name);
  }
};

const mergeFieldsIntoLayer = (layer, fields, options) => {
  (fields || []).forEach(field => mergeFieldIntoLayer(layer, field, options));
};

const toFiniteInt = (value, minAllowed) => {
  if (value == null || value === '') {
    return undefined;
  }
  const num = Number(value);
  if (!Number.isFinite(num)) {
    return undefined;
  }
  const int = Math.floor(num);
  return int < minAllowed ? minAllowed : int;
};

const finalizeObjectSchema = (layer, { title, description } = {}) => {
  const schema = {
    type: 'object',
    properties: { ...layer.properties }
  };
  if (layer.required.length) {
    schema.required = layer.required.slice();
  }
  if (title) {
    schema.title = title;
  }
  if (description) {
    schema.description = description;
  }
  if (layer.composites.length === 1) {
    Object.assign(schema, layer.composites[0]);
  } else if (layer.composites.length > 1) {
    schema.allOf = layer.composites.slice();
  }
  return schema;
};

const walkBlocks = (blocks, layer, depth = 0, ctx = {}) => {
  (blocks || []).forEach(block => {
    if (!block) {
      return;
    }
    walkBlock(block, layer, depth, ctx);
  });
};

const walkBlock = (block, layer, depth = 0, ctx = {}) => {
  switch (block.kind) {
    case 'formInfo': {
      mergeFieldsIntoLayer(layer, block.list, { ctx });
      walkBlocks(block.blocks, layer, depth + 1, ctx);
      return;
    }
    case 'object': {
      const name = block.name != null && String(block.name).trim() ? String(block.name).trim() : '';
      if (!name) {
        mergeFieldsIntoLayer(layer, block.list, { ctx });
        walkBlocks(block.blocks, layer, depth + 1, ctx);
        return;
      }
      const nested = createObjectLayer();
      mergeFieldsIntoLayer(nested, block.list, { ctx });
      walkBlocks(block.blocks, nested, depth + 1, ctx);
      layer.properties[name] = finalizeObjectSchema(nested, {
        title: block.title || undefined,
        description: block.subtitle || undefined
      });
      return;
    }
    case 'list':
    case 'tableList':
    case 'editableList': {
      const name = block.name != null && String(block.name).trim() ? String(block.name).trim() : '';
      if (!name) {
        return;
      }
      const itemLayer = createObjectLayer();
      mergeFieldsIntoLayer(itemLayer, block.list);
      if (supportsItemBlocks(block.kind)) {
        walkBlocks(block.itemBlocks, itemLayer, depth + 1);
      }
      const items = finalizeObjectSchema(itemLayer);
      const arraySchema = {
        type: 'array',
        items
      };
      if (block.title) {
        arraySchema.title = block.title;
      }
      const minItems = toFiniteInt(block.minLength, 0);
      const maxItems = toFiniteInt(block.maxLength, 1);
      if (minItems != null) {
        arraySchema.minItems = minItems;
      }
      if (maxItems != null) {
        arraySchema.maxItems = maxItems;
      }
      layer.properties[name] = arraySchema;
      return;
    }
    case 'multiField': {
      const name = block.name != null && String(block.name).trim() ? String(block.name).trim() : '';
      if (!name) {
        return;
      }
      const itemField = {
        type: block.fieldType || 'Input',
        label: block.label,
        props: {}
      };
      const arraySchema = {
        type: 'array',
        items: resolveFieldValueSchema(itemField)
      };
      if (block.label) {
        arraySchema.title = block.label;
      }
      layer.properties[name] = arraySchema;
      return;
    }
    case 'steps': {
      (block.items || []).forEach(step => {
        mergeFieldsIntoLayer(layer, step?.list, { ctx });
        walkBlocks(step?.blocks, layer, depth + 1, ctx);
      });
      return;
    }
    case 'choice': {
      mergeChoiceIntoLayer(layer, block, depth, ctx);
      return;
    }
    default:
      return;
  }
};

/**
 * choice：single → oneOf；multiple → anyOf。
 * 每支为 object：单选支含 selector const；多选支为该 option 字段，selector 数组放在当前层。
 * 支内 REQ 可进 required；hidden 字段仍进入 schema。
 */
const mergeChoiceIntoLayer = (layer, block, depth, ctx) => {
  const mode = block.mode === 'multiple' ? 'multiple' : 'single';
  const selectorInData = block.selectorInData !== false;
  const selectorName = resolveChoiceSelectorName(block);
  const options = block.options || [];
  const optionIds = options.map(option => String(option.id));

  const branches = options.map(option => {
    const branch = createObjectLayer();
    const optionTitle = option.title || undefined;

    if (selectorInData && mode === 'single') {
      branch.properties[selectorName] = {
        const: String(option.id),
        ...(optionTitle ? { title: optionTitle } : {})
      };
      branch.required.push(selectorName);
    }

    mergeFieldsIntoLayer(branch, option.list, { allowRequired: true, ctx });
    walkBlocks(option.blocks, branch, depth + 1, ctx);

    return finalizeObjectSchema(branch, { title: optionTitle });
  });

  if (!branches.length) {
    if (selectorInData) {
      if (mode === 'multiple') {
        const selectorSchema = {
          type: 'array',
          items: { type: 'string' },
          uniqueItems: true
        };
        if (block.title) {
          selectorSchema.title = block.title;
        }
        const minItems = toFiniteInt(block.minLength, 0);
        const maxItems = toFiniteInt(block.maxLength, 1);
        if (minItems != null) {
          selectorSchema.minItems = minItems;
        }
        if (maxItems != null) {
          selectorSchema.maxItems = maxItems;
        }
        layer.properties[selectorName] = selectorSchema;
      } else {
        layer.properties[selectorName] = { type: 'string', title: block.title || undefined };
      }
    }
    return;
  }

  if (mode === 'multiple') {
    if (selectorInData) {
      const selectorSchema = {
        type: 'array',
        items: { type: 'string', ...(optionIds.length ? { enum: optionIds } : {}) },
        uniqueItems: true
      };
      if (block.title) {
        selectorSchema.title = block.title;
      }
      const minItems = toFiniteInt(block.minLength, 0);
      const maxItems = toFiniteInt(block.maxLength, 1);
      if (minItems != null) {
        selectorSchema.minItems = minItems;
      }
      if (maxItems != null) {
        selectorSchema.maxItems = maxItems;
      }
      layer.properties[selectorName] = selectorSchema;
    }
    layer.composites.push({ anyOf: branches });
    return;
  }

  layer.composites.push({ oneOf: branches });
};

/**
 * 将搭建 Schema 转为描述表单提交数据形状的 JSON Schema。
 * - 内置字段：fieldRegistry.valueSchema
 * - 扩展字段：registerField / preset 的 valueSchema；缺省 { type: 'string' }
 * - hidden 字段仍进入 data schema（可提交）
 * - choice：single → oneOf，multiple → anyOf
 * - options.locale / options.languages：多语言文案取该语言，取不到按 languages 顺序回退（未传为 zh-CN → en-US）
 */
export const schemaToDataSchema = (schema, options = {}) => {
  const normalized = normalizeSchema(localizeSchema(schema || {}, options.locale, options.languages));
  const layer = createObjectLayer();
  walkBlocks(normalized.blocks, layer, 0, createConditionContext(normalized, options.locale));

  const root = finalizeObjectSchema(layer, {
    title: normalized.title || undefined,
    description: options.description
  });

  if (options.$schema) {
    root.$schema = options.$schema;
  }

  return root;
};

export default schemaToDataSchema;
