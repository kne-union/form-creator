import { Fragment } from 'react';
import { Empty } from 'antd';
import { useIntl } from '@kne/react-intl';
import { useIsMobile } from '@kne/responsive-utils';
import InfoPage, { Content } from '@kne/info-page';
import withLocale from './withLocale';
import { getFieldDefinition, resolveFieldValueSchema } from './fieldRegistry';
import { MAX_BLOCK_DEPTH, hasRenderableContent, normalizeSchema } from './schema';
import style from './style.module.scss';

const getByPath = (data, path) => {
  if (data == null || path == null || path === '') {
    return data;
  }
  return String(path)
    .split('.')
    .reduce((acc, key) => (acc == null ? acc : acc[key]), data);
};

const isEmptyValue = value => {
  if (value == null || value === '') {
    return true;
  }
  if (Array.isArray(value) && value.length === 0) {
    return true;
  }
  return false;
};

const resolveChoiceSelectorName = block => {
  if (block.selectorName != null && String(block.selectorName).trim()) {
    return String(block.selectorName).trim();
  }
  if (block.discriminator?.propertyName) {
    return String(block.discriminator.propertyName).trim();
  }
  return `__choice_${block.id}`;
};

const formatDateValue = (value, format) => {
  const pattern = format || 'YYYY-MM-DD';
  if (Array.isArray(value)) {
    return value
      .map(item => formatDateValue(item, format))
      .filter(item => item !== '')
      .join(' ~ ');
  }
  if (value && typeof value.format === 'function') {
    return value.format(pattern);
  }
  return value == null ? '' : String(value);
};

const mapOptionLabel = (value, options) => {
  if (!Array.isArray(options) || !options.length) {
    return value;
  }
  const match = options.find(item => item && item.value === value);
  return match?.label ?? value;
};

const formatFieldValue = (field, value, formatMessage) => {
  if (isEmptyValue(value)) {
    return formatMessage({ id: 'schemaContentEmptyValue' });
  }

  const definition = getFieldDefinition(field.type);
  const props = field.props || {};
  const valueSchema = resolveFieldValueSchema(field);
  const schemaType = valueSchema?.type;

  if (schemaType === 'boolean' || field.type === 'Switch' || field.type === 'Checkbox') {
    if (value) {
      return props.checkedChildren || formatMessage({ id: 'schemaContentYes' });
    }
    return props.unCheckedChildren || formatMessage({ id: 'schemaContentNo' });
  }

  if (field.type === 'DatePicker') {
    const formatted = formatDateValue(value, props.format);
    return formatted || formatMessage({ id: 'schemaContentEmptyValue' });
  }

  if (Array.isArray(props.options) && props.options.length) {
    if (Array.isArray(value)) {
      const labels = value.map(item => mapOptionLabel(item, props.options)).filter(item => item != null && item !== '');
      return labels.length ? labels.join('、') : formatMessage({ id: 'schemaContentEmptyValue' });
    }
    return mapOptionLabel(value, props.options);
  }

  if (definition?.isSuperSelect) {
    const labelKey = props.labelKey || 'label';
    const pickLabel = item => {
      if (item && typeof item === 'object') {
        return item[labelKey] ?? item.label ?? item.value;
      }
      return item;
    };
    if (Array.isArray(value)) {
      const labels = value.map(pickLabel).filter(item => item != null && item !== '');
      return labels.length ? labels.join('、') : formatMessage({ id: 'schemaContentEmptyValue' });
    }
    if (value && typeof value === 'object') {
      return pickLabel(value) ?? formatMessage({ id: 'schemaContentEmptyValue' });
    }
  }

  if (Array.isArray(value)) {
    return value.map(item => (item && typeof item === 'object' ? JSON.stringify(item) : String(item))).join('、');
  }

  if (typeof value === 'object') {
    return JSON.stringify(value);
  }

  return String(value);
};

const renderFieldsContent = (fields, data, formatMessage, column) => {
  const list = (fields || [])
    .filter(field => field && !field.hidden && field.name)
    .map(field => ({
      label: field.label || field.name,
      content: formatFieldValue(field, getByPath(data, field.name), formatMessage),
      block: field.block || undefined
    }));

  if (!list.length) {
    return null;
  }

  return <Content col={column || 2} list={list} />;
};

const renderBlockList = (blocks, data, ctx) => (blocks || []).map(block => renderBlock(block, data, ctx)).filter(Boolean);

const renderBlock = (block, data, ctx) => {
  const { formatMessage, isMobile, depth = 0 } = ctx;
  if (!block || depth > MAX_BLOCK_DEPTH) {
    return null;
  }

  const nextCtx = { ...ctx, depth: depth + 1 };
  const bordered = isMobile ? false : block.bordered || undefined;
  const partProps = {
    key: block.id,
    title: block.title || block.label || undefined,
    subtitle: block.subtitle || undefined,
    bordered
  };

  switch (block.kind) {
    case 'formInfo': {
      return (
        <InfoPage.Part {...partProps}>
          {renderFieldsContent(block.list, data, formatMessage, block.column)}
          {renderBlockList(block.blocks, data, nextCtx)}
        </InfoPage.Part>
      );
    }
    case 'object': {
      const name = block.name != null && String(block.name).trim() ? String(block.name).trim() : '';
      const nestedData = name ? getByPath(data, name) || {} : data;
      return (
        <InfoPage.Part {...partProps}>
          {renderFieldsContent(block.list, nestedData, formatMessage, block.column)}
          {renderBlockList(block.blocks, nestedData, nextCtx)}
        </InfoPage.Part>
      );
    }
    case 'list':
    case 'tableList': {
      const name = block.name != null && String(block.name).trim() ? String(block.name).trim() : '';
      const items = name ? getByPath(data, name) : null;
      const rows = Array.isArray(items) ? items : [];
      return (
        <InfoPage.Part {...partProps}>
          {rows.length
            ? rows.map((item, index) => (
                <InfoPage.Part key={`${block.id}-${index}`} title={formatMessage({ id: 'schemaContentItemIndex' }, { index: index + 1 })} bordered={false}>
                  {renderFieldsContent(block.list, item || {}, formatMessage, 2)}
                  {block.kind === 'list' ? renderBlockList(block.itemBlocks, item || {}, nextCtx) : null}
                </InfoPage.Part>
              ))
            : formatMessage({ id: 'schemaContentEmptyValue' })}
        </InfoPage.Part>
      );
    }
    case 'multiField': {
      const name = block.name != null && String(block.name).trim() ? String(block.name).trim() : '';
      const values = name ? getByPath(data, name) : null;
      const itemField = {
        type: block.fieldType || 'Input',
        label: block.label,
        props: {}
      };
      const content = Array.isArray(values) ? values.map(item => formatFieldValue(itemField, item, formatMessage)).join('、') : formatFieldValue(itemField, values, formatMessage);
      return (
        <InfoPage.Part {...partProps}>
          <Content col={1} list={[{ label: block.label || block.name, content, block: true }]} />
        </InfoPage.Part>
      );
    }
    case 'steps': {
      return (
        <Fragment key={block.id}>
          {(block.items || []).map(step => (
            <InfoPage.Part key={step.id} title={step.title || undefined} bordered={bordered}>
              {renderFieldsContent(step.list, data, formatMessage, step.column || 2)}
              {renderBlockList(step.blocks, data, nextCtx)}
            </InfoPage.Part>
          ))}
        </Fragment>
      );
    }
    case 'choice': {
      const selectorName = resolveChoiceSelectorName(block);
      const selectorValue = block.selectorInData === false ? undefined : getByPath(data, selectorName);
      const selectedIds = block.mode === 'multiple' ? (Array.isArray(selectorValue) ? selectorValue.map(String) : []) : selectorValue != null && selectorValue !== '' ? [String(selectorValue)] : [];
      const options = block.options || [];
      const visibleOptions = selectedIds.length ? options.filter(option => selectedIds.includes(String(option.id))) : [];

      return (
        <InfoPage.Part {...partProps}>
          {visibleOptions.map(option => (
            <InfoPage.Part key={option.id} title={option.title || undefined} bordered={false}>
              {renderFieldsContent(option.list, data, formatMessage, block.column)}
              {renderBlockList(option.blocks, data, nextCtx)}
            </InfoPage.Part>
          ))}
        </InfoPage.Part>
      );
    }
    default:
      return null;
  }
};

const SchemaContentInnerView = ({ schema, data, className }) => {
  const { formatMessage } = useIntl();
  const isMobile = useIsMobile();
  const normalized = normalizeSchema(schema);
  const children = renderBlockList(normalized.blocks, data || {}, { formatMessage, isMobile, depth: 0 });

  if (!children.length) {
    return null;
  }

  if (className) {
    return <div className={className}>{children}</div>;
  }

  return <Fragment>{children}</Fragment>;
};

export const SchemaContentInner = withLocale(SchemaContentInnerView);

const SchemaContent = withLocale(({ schema, data, className, empty }) => {
  const { formatMessage } = useIntl();
  const normalized = normalizeSchema(schema);
  const emptyNode = empty !== undefined ? empty : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={formatMessage({ id: 'schemaContentEmpty' })} />;

  if (data == null || !hasRenderableContent(normalized)) {
    return emptyNode;
  }

  return (
    <InfoPage className={[style['schema-content'], className].filter(Boolean).join(' ')}>
      <SchemaContentInnerView schema={normalized} data={data} />
    </InfoPage>
  );
});

export default SchemaContent;
