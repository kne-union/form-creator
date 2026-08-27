import { normalizeSchema } from './schema';
import { resolveFieldValueSchema } from './fieldRegistry';
import { parseRuleString } from './rulePresets';

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

const mergeFieldIntoLayer = (layer, field, { allowRequired = true } = {}) => {
  if (!field?.name) {
    return;
  }
  const name = String(field.name).trim();
  if (!name) {
    return;
  }
  layer.properties[name] = resolveFieldValueSchema(field);
  if (allowRequired && isReq(field.rule) && !layer.required.includes(name)) {
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

const walkBlocks = (blocks, layer, depth = 0) => {
  (blocks || []).forEach(block => {
    if (!block) {
      return;
    }
    walkBlock(block, layer, depth);
  });
};

const walkBlock = (block, layer, depth = 0) => {
  switch (block.kind) {
    case 'formInfo': {
      mergeFieldsIntoLayer(layer, block.list);
      walkBlocks(block.blocks, layer, depth + 1);
      return;
    }
    case 'object': {
      const name = block.name != null && String(block.name).trim() ? String(block.name).trim() : '';
      if (!name) {
        mergeFieldsIntoLayer(layer, block.list);
        walkBlocks(block.blocks, layer, depth + 1);
        return;
      }
      const nested = createObjectLayer();
      mergeFieldsIntoLayer(nested, block.list);
      walkBlocks(block.blocks, nested, depth + 1);
      layer.properties[name] = finalizeObjectSchema(nested, {
        title: block.title || undefined,
        description: block.subtitle || undefined
      });
      return;
    }
    case 'list':
    case 'tableList': {
      const name = block.name != null && String(block.name).trim() ? String(block.name).trim() : '';
      if (!name) {
        return;
      }
      const itemLayer = createObjectLayer();
      mergeFieldsIntoLayer(itemLayer, block.list);
      if (block.kind === 'list') {
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
        mergeFieldsIntoLayer(layer, step?.list);
        walkBlocks(step?.blocks, layer, depth + 1);
      });
      return;
    }
    case 'choice': {
      mergeChoiceIntoLayer(layer, block, depth);
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
const mergeChoiceIntoLayer = (layer, block, depth) => {
  const mode = block.mode === 'multiple' ? 'multiple' : 'single';
  const selectorInData = block.selectorInData !== false;
  const selectorName = resolveChoiceSelectorName(block);
  const options = block.options || [];
  const optionIds = options.map(option => String(option.id));

  const branches = options.map((option, index) => {
    const branch = createObjectLayer();
    const optionTitle = option.title || `选项${index + 1}`;

    if (selectorInData && mode === 'single') {
      branch.properties[selectorName] = {
        const: String(option.id),
        title: optionTitle
      };
      branch.required.push(selectorName);
    }

    mergeFieldsIntoLayer(branch, option.list, { allowRequired: true });
    walkBlocks(option.blocks, branch, depth + 1);

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
 */
export const schemaToDataSchema = (schema, options = {}) => {
  const normalized = normalizeSchema(schema || {});
  const layer = createObjectLayer();
  walkBlocks(normalized.blocks, layer, 0);

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
