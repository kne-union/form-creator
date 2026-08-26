import { createElement, Fragment } from 'react';
import { Tooltip } from 'antd';
import { QuestionCircleOutlined } from '@ant-design/icons';
import FormInfo, { Form, List, TableList, MultiField, Steps } from '@kne/form-info';
import { getFieldComponent, getFieldDefinition } from './fieldRegistry';
import { createApiFromOptions } from './fields/optionsApi';
import { normalizeSchema } from './schema';
import style from './style.module.scss';

const buildLabelTips = tips => {
  if (tips == null || !String(tips).trim()) {
    return undefined;
  }
  return createElement(Tooltip, { title: tips }, createElement(QuestionCircleOutlined, { className: style['field-label-tips-icon'] }));
};

const renderFieldElements = (fields = [], preview = false) =>
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

      // 空字符串会盖掉 react-form-antd / SuperSelect 的默认「请输入/请选择」占位
      if (!Array.isArray(props.placeholder) && props.placeholder != null && !String(props.placeholder).trim()) {
        delete props.placeholder;
      }

      // schema 内部标记，不传给 antd
      delete props.range;

      const description = field.description != null && String(field.description).trim() ? field.description : undefined;

      return createElement(Component, {
        key: field.id,
        name: field.name,
        label: field.label,
        rule: field.rule || undefined,
        block: field.block || undefined,
        ...props,
        labelTips: buildLabelTips(field.tips),
        description
      });
    })
    .filter(Boolean);

export const renderBlockElement = (block, preview = false, { isMobile = false, formatMessage } = {}) => {
  const fields = renderFieldElements(block.list, preview);
  const bordered = isMobile ? false : block.bordered || undefined;

  switch (block.kind) {
    case 'formInfo':
      return createElement(FormInfo, {
        key: block.id,
        title: block.title || undefined,
        subtitle: block.subtitle || undefined,
        column: block.column,
        gap: block.gap,
        bordered,
        list: fields
      });
    case 'list':
      return createElement(List, {
        key: block.id,
        name: block.name,
        title: block.title || undefined,
        important: block.important || undefined,
        bordered,
        maxLength: block.maxLength,
        minLength: block.minLength,
        // 不要传 addText: undefined，会盖掉 form-info 内部默认文案，变成畸形 icon-only 按钮
        ...(block.addText ? { addText: block.addText } : {}),
        ...(typeof block.itemTitle === 'function' || block.itemTitle ? { itemTitle: block.itemTitle } : {}),
        list: fields
      });
    case 'tableList':
      return createElement(TableList, {
        key: block.id,
        name: block.name,
        title: block.title || undefined,
        bordered,
        maxLength: block.maxLength,
        minLength: block.minLength,
        ...(block.addText ? { addText: block.addText } : {}),
        list: fields
      });
    case 'multiField': {
      const FieldComponent = getFieldComponent(block.fieldType);
      if (!FieldComponent) {
        return null;
      }
      return createElement(MultiField, {
        key: block.id,
        name: block.name,
        label: block.label,
        field: FieldComponent,
        block: block.block || undefined,
        ...(block.addText ? { addText: block.addText } : {})
      });
    }
    case 'steps': {
      const bordered = isMobile ? false : block.bordered || undefined;
      return createElement(Steps, {
        key: block.id,
        title: block.title || undefined,
        subtitle: block.subtitle || undefined,
        bordered,
        items: (block.items || []).map(step => ({
          key: step.id,
          title: step.title,
          column: step.column,
          gap: block.gap,
          list: renderFieldElements(step.list, preview),
          fieldNames: (step.list || []).filter(field => field && !field.hidden && field.name).map(field => field.name)
        }))
      });
    }
    default:
      return null;
  }
};

export const renderSchemaInner = (schema, { preview = false, className, isMobile = false, formatMessage, children, actionNode } = {}) => {
  const normalized = normalizeSchema(schema);
  const blocks = normalized.blocks || [];
  const contentChildren = blocks.map(block => renderBlockElement(block, preview, { isMobile, formatMessage })).filter(Boolean);

  if (!contentChildren.length && !children && !actionNode) {
    return null;
  }

  const body = createElement(Fragment, null, ...contentChildren, children, actionNode || null);

  return className ? createElement('div', { className }, body) : body;
};

export const renderSchemaContent = (schema, { preview = false, formProps = {}, className, isMobile = false, formatMessage, children, actionNode } = {}) => {
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
    createElement('div', { className: style['schema-body'] }, ...contentChildren, children),
    actionNode || null
  );
};

export default renderSchemaContent;
