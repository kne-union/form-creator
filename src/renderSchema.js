import { createElement, Fragment } from 'react';
import { Tooltip } from 'antd';
import { ArrowLeftOutlined, ArrowRightOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import FormInfo, { Form, List, TableList, MultiField, Steps } from '@kne/form-info';
import { getFieldComponent, getFieldDefinition } from './fieldRegistry';
import { createApiFromOptions } from './fields/optionsApi';
import { MAX_BLOCK_DEPTH, normalizeSchema, collectBlockFieldNames } from './schema';
import ChoiceBlock from './ChoiceBlock';
import style from './style.module.scss';

const buildLabelTips = tips => {
  if (tips == null || !String(tips).trim()) {
    return undefined;
  }
  return createElement(Tooltip, { title: tips }, createElement(QuestionCircleOutlined, { className: style['field-label-tips-icon'] }));
};

const renderFieldElements = (fields = [], preview = false, { namePrefix } = {}) =>
  fields
    .filter(field => !field.hidden)
    .map(field => {
      const Component = getFieldComponent(field.type, field);
      if (!Component) {
        return null;
      }
      const definition = getFieldDefinition(field.type);
      const props = { ...(field.props || {}) };

      if (definition?.optionsAllowDescription && props.options?.length && !props.api && !definition.optionsAllowChildren) {
        props.api = createApiFromOptions(props.options);
      }

      if (!Array.isArray(props.placeholder) && props.placeholder != null && !String(props.placeholder).trim()) {
        delete props.placeholder;
      }

      delete props.range;

      const description = field.description != null && String(field.description).trim() ? field.description : undefined;
      const fieldName = namePrefix && field.name ? `${namePrefix}.${field.name}` : field.name;

      return createElement(Component, {
        key: field.id,
        name: fieldName,
        label: field.label,
        rule: field.rule || undefined,
        block: field.block || undefined,
        ...props,
        labelTips: buildLabelTips(field.tips),
        description
      });
    })
    .filter(Boolean);

const withBlockLayout = (element, forceBlock) => {
  if (!element || !forceBlock) {
    return element;
  }
  return createElement(element.type, {
    ...element.props,
    key: element.key,
    block: true
  });
};

/** 列表子项内嵌的 FormInfo/object：表头圆角、去掉底边，压过 antd Card CSS-in-JS。
 * 不要套到嵌套 List 上，否则会干扰 form-info 的 nestDepth / nest-beyond 满宽样式。 */
const nestedListItemPartProps = {
  styles: {
    header: {
      borderBottom: 'none',
      borderRadius: 'var(--radius-default, 8px) var(--radius-default, 8px) 0 0'
    }
  },
  style: {
    borderRadius: 'var(--radius-default, 8px)',
    overflow: 'hidden'
  }
};

const isFormInfoLikeBlock = kind => kind === 'formInfo' || kind === 'object';

export const renderBlockElement = (block, preview = false, ctx = {}) => {
  const { isMobile = false, formatMessage, depth = 0, asListItem = false } = ctx;
  if (!block || depth > MAX_BLOCK_DEPTH) {
    return null;
  }

  const nextCtx = { ...ctx, depth: depth + 1, asListItem: false };
  const bordered = isMobile ? false : block.bordered || undefined;
  // 仅 FormInfo/object 吃列表项 Part 样式；List 等交给 form-info nestDepth
  const listItemPartProps = asListItem && isFormInfoLikeBlock(block.kind) ? nestedListItemPartProps : null;

  const renderChildBlocks = (blocks = [], childCtx = nextCtx) => (blocks || []).map(child => renderBlockElement(child, preview, childCtx)).filter(Boolean);

  /** list.itemBlocks：object/formInfo 走 asListItem；嵌套 list 等保持 nestDepth 链路 */
  const renderItemBlocks = (blocks = []) =>
    (blocks || [])
      .map(child => {
        const childCtx = { ...nextCtx, asListItem: isFormInfoLikeBlock(child.kind) };
        return withBlockLayout(renderBlockElement(child, preview, childCtx), true);
      })
      .filter(Boolean);

  switch (block.kind) {
    case 'formInfo': {
      const fields = renderFieldElements(block.list, preview);
      const nested = renderChildBlocks(block.blocks || [], nextCtx).map(node => withBlockLayout(node, true));
      return withBlockLayout(
        createElement(FormInfo, {
          key: block.id,
          title: block.title || undefined,
          subtitle: block.subtitle || undefined,
          column: block.column,
          gap: block.gap,
          bordered,
          list: [...fields, ...nested],
          ...(listItemPartProps || {})
        }),
        asListItem
      );
    }
    case 'object': {
      const fields = renderFieldElements(block.list, preview, { namePrefix: block.name || '' });
      const nested = renderChildBlocks(block.blocks || [], nextCtx).map(node => withBlockLayout(node, true));
      return withBlockLayout(
        createElement(FormInfo, {
          key: block.id,
          title: block.title || undefined,
          subtitle: block.subtitle || undefined,
          column: block.column,
          gap: block.gap,
          bordered,
          list: [...fields, ...nested],
          ...(listItemPartProps || {})
        }),
        asListItem
      );
    }
    case 'list': {
      const fields = renderFieldElements(block.list, preview);
      const nested = renderItemBlocks(block.itemBlocks || []);
      return withBlockLayout(
        createElement(List, {
          key: block.id,
          name: block.name,
          title: block.title || undefined,
          important: block.important || undefined,
          bordered,
          maxLength: block.maxLength,
          minLength: block.minLength,
          ...(block.addText ? { addText: block.addText } : {}),
          ...(typeof block.itemTitle === 'function' || block.itemTitle ? { itemTitle: block.itemTitle } : {}),
          list: [...fields, ...nested]
        }),
        asListItem
      );
    }
    case 'tableList': {
      const fields = renderFieldElements(block.list, preview);
      return withBlockLayout(
        createElement(TableList, {
          key: block.id,
          name: block.name,
          title: block.title || undefined,
          bordered,
          maxLength: block.maxLength,
          minLength: block.minLength,
          ...(block.addText ? { addText: block.addText } : {}),
          list: fields,
          ...(listItemPartProps || {})
        }),
        asListItem
      );
    }
    case 'multiField': {
      const FieldComponent = getFieldComponent(block.fieldType);
      if (!FieldComponent) {
        return null;
      }
      return withBlockLayout(
        createElement(MultiField, {
          key: block.id,
          name: block.name,
          label: block.label,
          field: FieldComponent,
          block: block.block || undefined,
          ...(block.addText ? { addText: block.addText } : {})
        }),
        asListItem
      );
    }
    case 'steps': {
      return withBlockLayout(
        createElement(Steps, {
          key: block.id,
          title: block.title || undefined,
          subtitle: block.subtitle || undefined,
          bordered,
          prevIcon: createElement(ArrowLeftOutlined),
          nextIcon: createElement(ArrowRightOutlined),
          items: (block.items || []).map(step => {
            const fields = renderFieldElements(step.list, preview);
            const nested = renderChildBlocks(step.blocks || [], nextCtx);
            const fieldNames = [...(step.list || []).filter(field => field && !field.hidden && field.name).map(field => field.name), ...collectBlockFieldNames(step.blocks || [])];
            if (nested.length) {
              return {
                key: step.id,
                title: step.title,
                column: step.column,
                gap: block.gap,
                fieldNames,
                children: createElement(
                  Fragment,
                  { key: `${step.id}-body` },
                  fields.length
                    ? createElement(FormInfo, {
                        key: `${step.id}-fields`,
                        column: step.column,
                        gap: block.gap,
                        list: fields
                      })
                    : null,
                  ...nested
                )
              };
            }
            return {
              key: step.id,
              title: step.title,
              column: step.column,
              gap: block.gap,
              list: fields,
              fieldNames
            };
          })
        }),
        asListItem
      );
    }
    case 'choice':
      return withBlockLayout(
        createElement(ChoiceBlock, {
          key: block.id,
          block,
          preview,
          isMobile,
          formatMessage,
          renderOptionContent: option => {
            const nodes = [];
            if ((option.list || []).length) {
              nodes.push(
                createElement(FormInfo, {
                  key: `${option.id}-fields`,
                  column: block.column || 2,
                  gap: block.gap,
                  list: renderFieldElements(option.list, preview)
                })
              );
            }
            nodes.push(...renderChildBlocks(option.blocks || [], nextCtx));
            return nodes.filter(Boolean);
          }
        }),
        asListItem
      );
    default:
      return null;
  }
};

export const renderSchemaInner = (schema, { preview = false, className, bodyClassName, isMobile = false, formatMessage, children, actionNode } = {}) => {
  const normalized = normalizeSchema(schema);
  const blocks = normalized.blocks || [];
  const contentChildren = blocks.map(block => renderBlockElement(block, preview, { isMobile, formatMessage })).filter(Boolean);

  if (!contentChildren.length && !children && !actionNode) {
    return null;
  }

  const body = createElement('div', { className: [style['schema-body'], bodyClassName].filter(Boolean).join(' ') }, ...contentChildren, children);
  const content = createElement(Fragment, null, body, actionNode || null);

  return className ? createElement('div', { className }, content) : content;
};

export const renderSchemaContent = (schema, { preview = false, formProps = {}, className, bodyClassName, isMobile = false, formatMessage, children, actionNode } = {}) => {
  const normalized = normalizeSchema(schema);
  const blocks = normalized.blocks || [];
  const contentChildren = blocks.map(block => renderBlockElement(block, preview, { isMobile, formatMessage })).filter(Boolean);

  if (!contentChildren.length && !children) {
    return null;
  }

  const formClassName = [style['schema-form'], formProps.className, className].filter(Boolean).join(' ');

  return createElement(
    Form,
    {
      ...formProps,
      className: formClassName
    },
    createElement('div', { className: [style['schema-body'], bodyClassName].filter(Boolean).join(' ') }, ...contentChildren, children),
    actionNode || null
  );
};

export default renderSchemaContent;
