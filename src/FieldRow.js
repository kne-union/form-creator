import { Button, Space, Tag, Typography } from 'antd';
import { ArrowDownOutlined, ArrowUpOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { useIntl } from '@kne/react-intl';
import { getFieldDefinition } from './fieldRegistry';
import style from './style.module.scss';

const { Text } = Typography;

const TYPE_TAG_COLORS = {
  Input: 'blue',
  TextArea: 'blue',
  InputNumber: 'cyan',
  Select: 'geekblue',
  RadioGroup: 'purple',
  CheckboxGroup: 'purple',
  SuperSelectList: 'gold',
  SuperSelectTableList: 'gold',
  SuperSelectTree: 'gold',
  SuperSelectCascader: 'gold',
  SelectFunction: 'orange',
  SelectIndustry: 'orange',
  SelectAddress: 'orange',
  Switch: 'green',
  Checkbox: 'green',
  DatePicker: 'lime'
};

const FieldRow = ({ field, index, total, onEdit, onDelete, onMove }) => {
  const { formatMessage } = useIntl();
  const definition = getFieldDefinition(field.type);

  return (
    <div className={style['field-row']}>
      <span className={style['field-row-index']}>{index + 1}</span>
      <div className={style['field-row-main']}>
        <Space size={6} wrap>
          <Text strong ellipsis>
            {field.label || formatMessage({ id: 'untitledField' })}
          </Text>
          <Tag bordered={false} color={TYPE_TAG_COLORS[field.type] || 'default'}>
            {definition?.label || field.type}
          </Tag>
          {field.hidden ? <Tag bordered={false}>{formatMessage({ id: 'fieldHiddenTag' })}</Tag> : null}
          {field.block ? (
            <Tag bordered={false} color="processing">
              {formatMessage({ id: 'fieldBlockTag' })}
            </Tag>
          ) : null}
        </Space>
      </div>
      <div className={style['action-group']}>
        <Button type="text" size="small" className={style['action-btn']} title={formatMessage({ id: 'moveUp' })} icon={<ArrowUpOutlined />} disabled={index === 0} onClick={() => onMove(field.id, 'up')} />
        <Button type="text" size="small" className={style['action-btn']} title={formatMessage({ id: 'moveDown' })} icon={<ArrowDownOutlined />} disabled={index === total - 1} onClick={() => onMove(field.id, 'down')} />
        <Button type="text" size="small" className={style['action-btn']} title={formatMessage({ id: 'editField' })} icon={<EditOutlined />} onClick={() => onEdit(field)} />
        <Button type="text" size="small" danger className={style['action-btn']} title={formatMessage({ id: 'deleteField' })} icon={<DeleteOutlined />} onClick={() => onDelete(field.id)} />
      </div>
    </div>
  );
};

export default FieldRow;
