import { useCallback, useEffect, useRef } from 'react';
import { Button, Flex, Input, Space, Typography } from 'antd';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { useIntl } from '@kne/react-intl';
import { createDataKey } from './schema';
import style from './style.module.scss';

const { Text, Title } = Typography;

const createRowKey = () => createDataKey('mrow');
const createColKey = () => createDataKey('mcol');
const createOptKey = () => createDataKey('mopt');

export const createEmptyMatrixRow = () => ({
  _key: createRowKey(),
  label: '',
  name: createDataKey('row')
});

export const createEmptyMatrixColumn = () => ({
  _key: createColKey(),
  label: '',
  name: createDataKey('col')
});

export const createEmptyMatrixOption = () => ({
  _key: createOptKey(),
  label: '',
  value: ''
});

const ensureKeys = (list = [], createKey) =>
  list.map(item => ({
    ...item,
    _key: item._key || createKey()
  }));

const hasMissingKey = (list = []) => list.some(item => !item?._key);

/** 勿在此用 FormInfo：模块列不在 Form 内，FormInfo→FieldList 会读不到 openApiRef */
const EditorSection = ({ title, tip, children }) => (
  <div className={style['columns-editor']}>
    {title ? (
      <Title level={5} className={style['matrix-scale-editor-title']}>
        {title}
      </Title>
    ) : null}
    {children}
    {tip ? (
      <Space size={4} className={style['options-tip']}>
        {tip}
      </Space>
    ) : null}
  </div>
);

const LabelNameRows = ({ title, tip, list, onChange, createEmpty, createKey, labelPlaceholder, namePlaceholder, addText }) => {
  // 只展示已落盘数据；缺 key / 空列表由 effect 补齐，避免每次 render 新建临时项导致丢焦点
  useEffect(() => {
    if (!list.length) {
      onChange([createEmpty()]);
      return;
    }
    if (hasMissingKey(list)) {
      onChange(ensureKeys(list, createKey));
    }
  }, [list, onChange, createEmpty, createKey]);

  const rows = list.length ? list : [];

  const updateItem = (index, patch) => {
    onChange(rows.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)));
  };

  return (
    <EditorSection title={title} tip={tip}>
      <div className={style['options-list']}>
        {rows.map((item, index) => (
          <Flex key={item._key || `row-${index}`} gap={8} align="start" className={style['options-row']}>
            <Input value={item.label || ''} placeholder={labelPlaceholder} onChange={e => updateItem(index, { label: e.target.value })} />
            <Input value={item.name || ''} placeholder={namePlaceholder} onChange={e => updateItem(index, { name: e.target.value })} />
            <Button
              type="text"
              danger
              className={style['icon-square-btn-sm']}
              icon={<DeleteOutlined />}
              disabled={rows.length <= 1}
              onClick={() => {
                const next = rows.filter((_, i) => i !== index);
                onChange(next.length ? next : [createEmpty()]);
              }}
            />
          </Flex>
        ))}
      </div>
      <Button type="dashed" block icon={<PlusOutlined />} onClick={() => onChange([...rows, createEmpty()])}>
        {addText}
      </Button>
    </EditorSection>
  );
};

const MatrixOptionsEditor = ({ value = [], onChange }) => {
  const { formatMessage } = useIntl();

  useEffect(() => {
    if (!value.length) {
      onChange([createEmptyMatrixOption()]);
      return;
    }
    if (hasMissingKey(value)) {
      onChange(ensureKeys(value, createOptKey));
    }
  }, [value, onChange]);

  const rows = value.length ? value : [];

  const updateItem = (index, patch) => {
    onChange(rows.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)));
  };

  return (
    <EditorSection title={formatMessage({ id: 'matrixScaleOptionsTitle' })}>
      <div className={style['options-list']}>
        {rows.map((item, index) => (
          <Flex key={item._key || `opt-${index}`} gap={8} align="start" className={style['options-row']}>
            <Input
              value={item.label || ''}
              placeholder={formatMessage({ id: 'optionLabelPlaceholder' })}
              onChange={e => {
                const label = e.target.value;
                const patch = { label };
                if (!item.value || item.value === item.label) {
                  patch.value = label;
                }
                updateItem(index, patch);
              }}
            />
            <Input value={item.value || ''} placeholder={formatMessage({ id: 'optionValuePlaceholder' })} onChange={e => updateItem(index, { value: e.target.value })} />
            <Button
              type="text"
              danger
              className={style['icon-square-btn-sm']}
              icon={<DeleteOutlined />}
              disabled={rows.length <= 1}
              onClick={() => {
                const next = rows.filter((_, i) => i !== index);
                onChange(next.length ? next : [createEmptyMatrixOption()]);
              }}
            />
          </Flex>
        ))}
      </div>
      <Button type="dashed" block icon={<PlusOutlined />} onClick={() => onChange([...rows, createEmptyMatrixOption()])}>
        {formatMessage({ id: 'addOption' })}
      </Button>
    </EditorSection>
  );
};

const MatrixScaleEditor = ({ block, onChange }) => {
  const { formatMessage } = useIntl();
  const layout = block.layout === 'columns' || block.layout === 'field' ? block.layout : 'options';
  const blockRef = useRef(block);
  blockRef.current = block;
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  // 用 ref 保持回调稳定，避免输入时子组件 useEffect 反复触发
  const handleRowsChange = useCallback(rows => onChangeRef.current({ ...blockRef.current, rows }), []);
  const handleOptionsChange = useCallback(options => onChangeRef.current({ ...blockRef.current, options }), []);
  const handleColumnsChange = useCallback(columns => onChangeRef.current({ ...blockRef.current, columns }), []);

  return (
    <div className={style['block-body']}>
      <Text type="secondary" className={style['inline-empty']}>
        {formatMessage({ id: `matrixScaleEditorHint_${layout}` })}
      </Text>
      <LabelNameRows
        title={formatMessage({ id: 'matrixScaleRowsTitle' })}
        tip={formatMessage({ id: 'matrixScaleRowsHint' })}
        list={block.rows || []}
        onChange={handleRowsChange}
        createEmpty={createEmptyMatrixRow}
        createKey={createRowKey}
        labelPlaceholder={formatMessage({ id: 'matrixScaleRowLabelPlaceholder' })}
        namePlaceholder={formatMessage({ id: 'matrixScaleRowNamePlaceholder' })}
        addText={formatMessage({ id: 'matrixScaleAddRow' })}
      />
      {layout === 'options' ? <MatrixOptionsEditor value={block.options || []} onChange={handleOptionsChange} /> : null}
      {layout === 'columns' ? (
        <LabelNameRows
          title={formatMessage({ id: 'matrixScaleColumnsTitle' })}
          tip={formatMessage({ id: 'matrixScaleColumnsHint' })}
          list={block.columns || []}
          onChange={handleColumnsChange}
          createEmpty={createEmptyMatrixColumn}
          createKey={createColKey}
          labelPlaceholder={formatMessage({ id: 'matrixScaleColumnLabelPlaceholder' })}
          namePlaceholder={formatMessage({ id: 'matrixScaleColumnNamePlaceholder' })}
          addText={formatMessage({ id: 'matrixScaleAddRow' })}
        />
      ) : null}
    </div>
  );
};

export default MatrixScaleEditor;
