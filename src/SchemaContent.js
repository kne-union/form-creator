import { Fragment } from 'react';
import { Empty } from 'antd';
import { useIntl } from '@kne/react-intl';
import { useIsMobile } from '@kne/responsive-utils';
import InfoPage from '@kne/info-page';
import withLocale from './withLocale';
import { formatFieldDisplayValue } from './formatDisplayValue';
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

const resolveChoiceSelectorName = block => {
  if (block.selectorName != null && String(block.selectorName).trim()) {
    return String(block.selectorName).trim();
  }
  if (block.discriminator?.propertyName) {
    return String(block.discriminator.propertyName).trim();
  }
  return `__choice_${block.id}`;
};

const formatFieldValue = (field, value, formatMessage) => formatFieldDisplayValue(field, value, { formatMessage });

/**
 * 问卷题干往往很长：不用 InfoPage Content 的横向 label 列宽对齐（minWidth），
 * 改为 label 在上、值在下，避免窄栏（如弹窗双栏预览）被撑乱。
 */
const renderFieldsContent = (fields, data, formatMessage, column, { showIndex = false } = {}) => {
  const list = (fields || [])
    .filter(field => field && !field.hidden && field.name)
    .map((field, index) => {
      const baseLabel = field.label || field.name;
      const label = showIndex ? `${index + 1}. ${baseLabel}` : baseLabel;
      return {
        label,
        content: formatFieldValue(field, getByPath(data, field.name), formatMessage),
        block: field.block === true
      };
    });

  if (!list.length) {
    return null;
  }

  const cols = Math.max(1, Number(column) || 2);

  return (
    <div className={style['schema-content-fields']} style={{ '--schema-content-cols': cols }}>
      {list.map((item, index) => (
        <div key={index} className={[style['schema-content-field'], item.block ? style['schema-content-field-block'] : null].filter(Boolean).join(' ')}>
          {item.label ? <div className={style['schema-content-field-label']}>{item.label}：</div> : null}
          <div className={style['schema-content-field-value']}>{item.content}</div>
        </div>
      ))}
    </div>
  );
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
    bordered,
    className: depth === 0 ? InfoPage.partRootClassName : undefined
  };

  switch (block.kind) {
    case 'formInfo': {
      return (
        <InfoPage.Part {...partProps}>
          {renderFieldsContent(block.list, data, formatMessage, block.column, { showIndex: !!block.showIndex })}
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
          <div className={style['schema-content-fields']} style={{ '--schema-content-cols': 1 }}>
            <div className={[style['schema-content-field'], style['schema-content-field-block']].join(' ')}>
              {block.label || block.name ? <div className={style['schema-content-field-label']}>{(block.label || block.name) + '：'}</div> : null}
              <div className={style['schema-content-field-value']}>{content}</div>
            </div>
          </div>
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
