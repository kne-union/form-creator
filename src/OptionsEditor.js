import FormInfo from '@kne/form-info';
import { Button, Card, Flex, Input, InputNumber, Space, Typography } from 'antd';
import { DeleteOutlined, PlusOutlined, ApartmentOutlined } from '@ant-design/icons';
import { useEffect } from 'react';
import { useIntl } from '@kne/react-intl';
import { createDataKey, createEmptyColumn, isAutoDataKey } from './schema';
import style from './style.module.scss';

const { Text } = Typography;

const createOptionKey = () => createDataKey('opt');

const EMPTY_OPTION = () => ({
  _key: createOptionKey(),
  label: '',
  value: ''
});

export { createEmptyColumn };

const createEmptyTableRow = columns => {
  const row = { label: '', value: '' };
  (columns || []).forEach(column => {
    if (column?.name) {
      row[column.name] = '';
    }
  });
  return row;
};

const ensureOptionKeys = (list = []) =>
  list.map(item => ({
    ...item,
    _key: item._key || createOptionKey(),
    children: Array.isArray(item.children) ? ensureOptionKeys(item.children) : undefined
  }));

const hasMissingOptionKey = (list = []) => list.some(item => !item?._key || (Array.isArray(item.children) && hasMissingOptionKey(item.children)));

/** 扁平选项（非树） */
const FlatOptionRows = ({ list, onChange, allowDescription }) => {
  const { formatMessage } = useIntl();
  const rows = list.length ? ensureOptionKeys(list) : [EMPTY_OPTION()];

  const commit = next => onChange(next);

  const updateItem = (index, patch) => {
    commit(rows.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)));
  };

  return (
    <div className={style['options-list']}>
      {rows.map((item, index) => (
        <Flex key={item._key} gap={8} align="start" className={style['options-row']}>
          <Input value={item.label} placeholder={formatMessage({ id: 'optionLabelPlaceholder' })} onChange={event => updateItem(index, { label: event.target.value })} />
          <Input value={item.value} placeholder={formatMessage({ id: 'optionValuePlaceholder' })} onChange={event => updateItem(index, { value: event.target.value })} />
          {allowDescription ? <Input value={item.description || ''} placeholder={formatMessage({ id: 'optionDescPlaceholder' })} onChange={event => updateItem(index, { description: event.target.value })} /> : null}
          <Button
            type="text"
            danger
            className={style['icon-square-btn-sm']}
            icon={<DeleteOutlined />}
            disabled={rows.length === 1}
            onClick={() => {
              const next = rows.filter((_, itemIndex) => itemIndex !== index);
              commit(next.length ? next : [EMPTY_OPTION()]);
            }}
          />
        </Flex>
      ))}
      <Button type="dashed" block icon={<PlusOutlined />} onClick={() => commit([...rows, EMPTY_OPTION()])}>
        {formatMessage({ id: 'addOption' })}
      </Button>
    </div>
  );
};

/** 树形 / 级联选项 */
const TreeOptionNode = ({ item, index, siblings, onChangeSiblings, allowDescription, depth, maxDepth = 4 }) => {
  const { formatMessage } = useIntl();
  const children = Array.isArray(item.children) ? item.children : [];
  const canAddChild = depth < maxDepth;

  const updateSelf = patch => {
    onChangeSiblings(siblings.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  };

  const removeSelf = () => {
    onChangeSiblings(siblings.filter((_, i) => i !== index));
  };

  const addChild = () => {
    updateSelf({ children: [...children, EMPTY_OPTION()] });
  };

  const changeChildren = nextChildren => {
    if (!nextChildren.length) {
      updateSelf({ children: undefined });
      return;
    }
    updateSelf({ children: nextChildren });
  };

  return (
    <div className={style['tree-option-node']} data-depth={depth}>
      <div className={style['tree-option-row']}>
        <div className={style['tree-option-fields']}>
          <Input value={item.label} placeholder={formatMessage({ id: 'optionLabelPlaceholder' })} onChange={e => updateSelf({ label: e.target.value })} />
          <Input value={item.value} placeholder={formatMessage({ id: 'optionValuePlaceholder' })} onChange={e => updateSelf({ value: e.target.value })} />
          {allowDescription ? <Input value={item.description || ''} placeholder={formatMessage({ id: 'optionDescPlaceholder' })} onChange={e => updateSelf({ description: e.target.value })} /> : null}
        </div>
        <div className={style['tree-option-actions']}>
          {canAddChild ? (
            <Button type="link" size="small" icon={<ApartmentOutlined />} onClick={addChild}>
              {formatMessage({ id: 'addChildOption' })}
            </Button>
          ) : null}
          <Button type="text" danger size="small" className={style['icon-square-btn-sm']} icon={<DeleteOutlined />} disabled={siblings.length === 1 && depth === 0} onClick={removeSelf} />
        </div>
      </div>
      {children.length ? (
        <div className={style['tree-option-children']}>
          {children.map((child, childIndex) => (
            <TreeOptionNode key={child._key} item={child} index={childIndex} siblings={children} onChangeSiblings={changeChildren} allowDescription={allowDescription} depth={depth + 1} maxDepth={maxDepth} />
          ))}
        </div>
      ) : null}
    </div>
  );
};

const TreeOptionsEditor = ({ value = [], onChange, allowDescription }) => {
  const { formatMessage } = useIntl();

  useEffect(() => {
    if (!value.length) {
      return;
    }
    if (hasMissingOptionKey(value)) {
      onChange(ensureOptionKeys(value));
    }
  }, [value, onChange]);

  const rows = value.length ? (hasMissingOptionKey(value) ? ensureOptionKeys(value) : value) : [EMPTY_OPTION()];

  const commit = next => {
    onChange(next.length ? ensureOptionKeys(next) : [EMPTY_OPTION()]);
  };

  return (
    <div className={style['tree-options-editor']}>
      <div className={style['tree-options-list']}>
        {rows.map((item, index) => (
          <TreeOptionNode key={item._key} item={item} index={index} siblings={rows} onChangeSiblings={commit} allowDescription={allowDescription} depth={0} />
        ))}
      </div>
      <Button type="dashed" block icon={<PlusOutlined />} onClick={() => commit([...rows, EMPTY_OPTION()])}>
        {formatMessage({ id: 'addOption' })}
      </Button>
    </div>
  );
};

const ColumnsEditor = ({ value = [], onChange }) => {
  const { formatMessage } = useIntl();
  const list = value.length ? value : [createEmptyColumn()];

  const updateItem = (index, patch) => {
    onChange(list.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)));
  };

  return (
    <FormInfo
      title={formatMessage({ id: 'fieldColumns' })}
      column={1}
      list={[
        <div key="columns-editor" block className={style['columns-editor']}>
          <div className={style['options-list']}>
            {list.map((item, index) => (
              <Flex key={item.name || index} gap={8} align="start" className={style['options-row']}>
                <Input
                  value={item.title || ''}
                  placeholder={formatMessage({ id: 'columnTitlePlaceholder' })}
                  onChange={e => {
                    const title = e.target.value;
                    const patch = { title };
                    if ((!item.name || isAutoDataKey(item.name, 'col')) && !item.name) {
                      patch.name = createDataKey('col');
                      patch.key = patch.name;
                    }
                    updateItem(index, patch);
                  }}
                />
                <Input
                  value={item.name || ''}
                  placeholder={formatMessage({ id: 'columnNamePlaceholder' })}
                  onChange={e => {
                    const name = e.target.value;
                    updateItem(index, { name, key: name.trim() || item.key });
                  }}
                />
                <InputNumber min={40} style={{ width: 120 }} value={item.width ?? null} placeholder={formatMessage({ id: 'columnWidthPlaceholder' })} onChange={width => updateItem(index, { width: width ?? undefined })} />
                <Button
                  type="text"
                  danger
                  className={style['icon-square-btn-sm']}
                  icon={<DeleteOutlined />}
                  disabled={list.length === 1}
                  onClick={() => {
                    const next = list.filter((_, i) => i !== index);
                    onChange(next.length ? next : [createEmptyColumn()]);
                  }}
                />
              </Flex>
            ))}
          </div>
          <Button type="dashed" block icon={<PlusOutlined />} onClick={() => onChange([...list, createEmptyColumn()])}>
            {formatMessage({ id: 'addColumn' })}
          </Button>
          <Space size={4} className={style['options-tip']}>
            {formatMessage({ id: 'columnsEditorHint' })}
          </Space>
        </div>
      ]}
    />
  );
};

const TableRowsEditor = ({ columns = [], value = [], onChange }) => {
  const { formatMessage } = useIntl();
  const usableColumns = columns.filter(column => column?.name && String(column.name).trim());
  const list = value.length ? value : [createEmptyTableRow(usableColumns)];

  const updateItem = (index, patch) => {
    onChange(list.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)));
  };

  if (!usableColumns.length) {
    return (
      <FormInfo
        title={formatMessage({ id: 'fieldTableRows' })}
        column={1}
        list={[
          <div key="table-rows-empty" block>
            <Text type="secondary">{formatMessage({ id: 'tableRowsNeedColumnsHint' })}</Text>
          </div>
        ]}
      />
    );
  }

  return (
    <FormInfo
      title={formatMessage({ id: 'fieldTableRows' })}
      column={1}
      list={[
        <div key="table-rows-editor" block className={style['table-rows-editor']}>
          <Space direction="vertical" size={12} style={{ width: '100%' }}>
            {list.map((item, index) => (
              <Card
                key={index}
                size="small"
                className={style['table-row-card']}
                title={formatMessage({ id: 'tableRowTitle' }, { index: index + 1 })}
                extra={
                  <Button
                    type="text"
                    danger
                    className={style['icon-square-btn-sm']}
                    icon={<DeleteOutlined />}
                    disabled={list.length === 1}
                    onClick={() => {
                      const next = list.filter((_, i) => i !== index);
                      onChange(next.length ? next : [createEmptyTableRow(usableColumns)]);
                    }}
                  />
                }
              >
                <Space direction="vertical" size={8} style={{ width: '100%' }}>
                  <Flex gap={8}>
                    <Input value={item.value || ''} placeholder={formatMessage({ id: 'optionValuePlaceholder' })} onChange={e => updateItem(index, { value: e.target.value })} />
                    <Input value={item.label || ''} placeholder={formatMessage({ id: 'tableRowLabelPlaceholder' })} onChange={e => updateItem(index, { label: e.target.value })} />
                  </Flex>
                  <Flex gap={8} wrap="wrap">
                    {usableColumns.map(column => (
                      <Input key={column.name} style={{ minWidth: 140, flex: 1 }} value={item[column.name] || ''} placeholder={column.title || column.name} onChange={e => updateItem(index, { [column.name]: e.target.value })} />
                    ))}
                  </Flex>
                </Space>
              </Card>
            ))}
          </Space>
          <Button type="dashed" block icon={<PlusOutlined />} style={{ marginTop: 12 }} onClick={() => onChange([...list, createEmptyTableRow(usableColumns)])}>
            {formatMessage({ id: 'addTableRow' })}
          </Button>
          <Space size={4} className={style['options-tip']}>
            {formatMessage({ id: 'tableRowsEditorHint' })}
          </Space>
        </div>
      ]}
    />
  );
};

const OptionsEditor = ({ value = [], onChange, allowDescription = false, allowChildren = false, hasColumns = false, columns = [], onColumnsChange }) => {
  const { formatMessage } = useIntl();

  if (hasColumns) {
    const handleColumnsChange = nextColumns => {
      const prevColumns = columns || [];
      const migrated = (value || []).map(row => {
        const nextRow = { ...row };
        prevColumns.forEach((prevCol, index) => {
          const nextCol = nextColumns[index];
          const prevName = prevCol?.name;
          const nextName = nextCol?.name;
          if (prevName && nextName && prevName !== nextName && Object.prototype.hasOwnProperty.call(row, prevName)) {
            nextRow[nextName] = row[prevName];
            delete nextRow[prevName];
          }
        });
        return nextRow;
      });
      onColumnsChange(nextColumns);
      if (migrated.length) {
        onChange(migrated);
      }
    };

    return (
      <div className={style['options-editor']}>
        <ColumnsEditor value={columns} onChange={handleColumnsChange} />
        <TableRowsEditor columns={columns} value={value} onChange={onChange} />
      </div>
    );
  }

  return (
    <FormInfo
      title={formatMessage({ id: 'fieldOptions' })}
      column={1}
      list={[
        <div key="options-editor" block className={style['options-editor']}>
          {allowChildren ? (
            <TreeOptionsEditor value={value} onChange={onChange} allowDescription={allowDescription} />
          ) : (
            <FlatOptionRows list={value.length ? value : [EMPTY_OPTION()]} onChange={onChange} allowDescription={allowDescription} />
          )}
          <Space size={4} className={style['options-tip']}>
            {formatMessage({ id: allowChildren ? 'optionsTreeEditorHint' : 'optionsEditorHint' })}
          </Space>
        </div>
      ]}
    />
  );
};

export default OptionsEditor;
