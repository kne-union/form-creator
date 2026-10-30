import { Button, Space, Tag, Tooltip, Typography } from 'antd';
import {
  AlignLeftOutlined,
  ApartmentOutlined,
  AppstoreOutlined,
  ArrowDownOutlined,
  ArrowUpOutlined,
  BranchesOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  CheckSquareOutlined,
  ColumnWidthOutlined,
  DeleteOutlined,
  DownSquareOutlined,
  EditOutlined,
  EnvironmentOutlined,
  EyeInvisibleOutlined,
  FontSizeOutlined,
  FormOutlined,
  LockOutlined,
  NumberOutlined,
  ShopOutlined,
  SwapOutlined,
  WarningOutlined
} from '@ant-design/icons';
import { useIntl } from '@kne/react-intl';
import { getFieldDefinition, resolveFieldTypeLabel } from './fieldRegistry';
import style from './style.module.scss';
import { resolveLocaleText } from './localeText';
import { useLocaleTextLanguages } from './LocaleTextInput';
import { formatVisibleWhen, hasInvalidCondition, hasVisibleWhen } from './fieldCondition';

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

const TYPE_TAG_ICONS = {
  Input: FontSizeOutlined,
  TextArea: AlignLeftOutlined,
  InputNumber: NumberOutlined,
  Select: DownSquareOutlined,
  RadioGroup: CheckCircleOutlined,
  CheckboxGroup: CheckSquareOutlined,
  SuperSelectList: AppstoreOutlined,
  SuperSelectTableList: AppstoreOutlined,
  SuperSelectTree: AppstoreOutlined,
  SuperSelectCascader: AppstoreOutlined,
  SelectFunction: ApartmentOutlined,
  SelectIndustry: ShopOutlined,
  SelectAddress: EnvironmentOutlined,
  Switch: SwapOutlined,
  Checkbox: CheckSquareOutlined,
  DatePicker: CalendarOutlined
};

export const getFieldTypeIcon = type => TYPE_TAG_ICONS[type] || FormOutlined;

const FieldRow = ({ field, index, total, onEdit, onDelete, onMove, prevLocked, nextLocked, conditionContext }) => {
  const { formatMessage, locale } = useIntl();
  const languages = useLocaleTextLanguages();
  const definition = getFieldDefinition(field.type);
  const conditional = hasVisibleWhen(field);
  const conditionInvalid = conditional && conditionContext && hasInvalidCondition(field, conditionContext.triggerNames);
  const TypeIcon = getFieldTypeIcon(field.type);

  return (
    <div className={style['field-row']}>
      <span className={style['field-row-index']}>{index + 1}</span>
      <div className={style['field-row-main']}>
        <Text strong className={style['field-row-label']}>
          {resolveLocaleText(field.label, locale, languages) || formatMessage({ id: 'untitledField' })}
        </Text>
        <Space size={6} wrap>
          <Tag bordered={false} color={TYPE_TAG_COLORS[field.type] || 'default'} icon={<TypeIcon />}>
            {resolveFieldTypeLabel(definition || field.type, formatMessage)}
          </Tag>
          {field.locked ? (
            <Tag bordered={false} icon={<LockOutlined />} title={formatMessage({ id: 'fieldLockedTips' })}>
              {formatMessage({ id: 'fieldLockedTag' })}
            </Tag>
          ) : null}
          {field.hidden ? (
            <Tag bordered={false} icon={<EyeInvisibleOutlined />}>
              {formatMessage({ id: 'fieldHiddenTag' })}
            </Tag>
          ) : null}
          {conditional ? (
            <Tooltip
              title={formatVisibleWhen(field.visibleWhen, {
                formatMessage,
                fieldLookup: conditionContext?.fieldLookup,
                resolveText: value => resolveLocaleText(value, locale, languages)
              })}
            >
              <Tag bordered={false} color="magenta" icon={<BranchesOutlined />}>
                {formatMessage({ id: 'fieldConditionTag' })}
              </Tag>
            </Tooltip>
          ) : null}
          {conditionInvalid ? (
            <Tooltip title={formatMessage({ id: 'fieldConditionInvalidTips' })}>
              <Tag bordered={false} color="error" icon={<WarningOutlined />}>
                {formatMessage({ id: 'fieldConditionInvalidTag' })}
              </Tag>
            </Tooltip>
          ) : null}
          {field.block ? (
            <Tag bordered={false} color="processing" icon={<ColumnWidthOutlined />}>
              {formatMessage({ id: 'fieldBlockTag' })}
            </Tag>
          ) : null}
        </Space>
      </div>
      {field.locked ? null : (
        <div className={style['action-group']}>
          <Button type="text" size="small" className={style['action-btn']} title={formatMessage({ id: 'moveUp' })} icon={<ArrowUpOutlined />} disabled={index === 0 || prevLocked} onClick={() => onMove(field.id, 'up')} />
          <Button type="text" size="small" className={style['action-btn']} title={formatMessage({ id: 'moveDown' })} icon={<ArrowDownOutlined />} disabled={index === total - 1 || nextLocked} onClick={() => onMove(field.id, 'down')} />
          <Button type="text" size="small" className={style['action-btn']} title={formatMessage({ id: 'editField' })} icon={<EditOutlined />} onClick={() => onEdit(field)} />
          <Button type="text" size="small" danger className={style['action-btn']} title={formatMessage({ id: 'deleteField' })} icon={<DeleteOutlined />} onClick={() => onDelete(field.id)} />
        </div>
      )}
    </div>
  );
};

export default FieldRow;
