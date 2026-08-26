import { useMemo } from 'react';
import FormInfo from '@kne/form-info';
import { Input, InputNumber, Select, Checkbox } from '@kne/react-form-antd';
import { useIntl } from '@kne/react-intl';
import { getFieldDefinition } from './fieldRegistry';

const BUILTIN_PROP_TYPES = ['Input', 'TextArea', 'InputNumber', 'Select', 'DatePicker', 'Switch'];

const buildPropsSchemaList = (schema, formatMessage) =>
  (schema || [])
    .filter(item => item?.name)
    .map(item => {
      if (item.type === 'boolean') {
        return (
          <Checkbox key={item.name} name={item.name}>
            {item.label || item.name}
          </Checkbox>
        );
      }
      if (item.type === 'number') {
        return <InputNumber key={item.name} name={item.name} label={item.label || item.name} min={item.min} max={item.max} placeholder={item.placeholder || formatMessage({ id: 'propOptionalNumber' })} />;
      }
      if (item.type === 'select') {
        return <Select key={item.name} name={item.name} label={item.label || item.name} options={item.options || []} placeholder={item.placeholder} allowClear={item.allowClear !== false} />;
      }
      return <Input key={item.name} name={item.name} label={item.label || item.name} placeholder={item.placeholder} />;
    });

const buildBuiltinList = (type, formatMessage) => {
  const placeholder = <Input key="placeholder" name="placeholder" label={formatMessage({ id: 'fieldPlaceholder' })} placeholder={formatMessage({ id: 'fieldPlaceholderHint' })} />;
  const allowClear = (
    <Checkbox key="allowClear" name="allowClear">
      {formatMessage({ id: 'propAllowClear' })}
    </Checkbox>
  );

  switch (type) {
    case 'Input':
      return [placeholder, allowClear, <InputNumber key="maxLength" name="maxLength" label={formatMessage({ id: 'propMaxLength' })} min={1} placeholder={formatMessage({ id: 'propOptionalNumber' })} />];
    case 'TextArea':
      return [
        placeholder,
        <InputNumber key="rows" name="rows" label={formatMessage({ id: 'propRows' })} min={2} max={20} />,
        <InputNumber key="maxLength" name="maxLength" label={formatMessage({ id: 'propMaxLength' })} min={1} placeholder={formatMessage({ id: 'propOptionalNumber' })} />,
        <Checkbox key="showCount" name="showCount">
          {formatMessage({ id: 'propShowCount' })}
        </Checkbox>
      ];
    case 'InputNumber':
      return [
        placeholder,
        <InputNumber key="min" name="min" label={formatMessage({ id: 'propMin' })} placeholder={formatMessage({ id: 'propOptionalNumber' })} />,
        <InputNumber key="max" name="max" label={formatMessage({ id: 'propMax' })} placeholder={formatMessage({ id: 'propOptionalNumber' })} />,
        <InputNumber key="step" name="step" label={formatMessage({ id: 'propStep' })} min={0} placeholder={formatMessage({ id: 'propOptionalNumber' })} />,
        <InputNumber key="precision" name="precision" label={formatMessage({ id: 'propPrecision' })} min={0} max={10} placeholder={formatMessage({ id: 'propOptionalNumber' })} />
      ];
    case 'Select':
      return [
        placeholder,
        allowClear,
        <Select
          key="mode"
          name="mode"
          label={formatMessage({ id: 'propSelectMode' })}
          options={[
            { label: formatMessage({ id: 'propSelectModeSingle' }), value: 'single' },
            { label: formatMessage({ id: 'propSelectModeMultiple' }), value: 'multiple' }
          ]}
        />
      ];
    case 'DatePicker':
      return [
        <Checkbox key="range" name="range">
          {formatMessage({ id: 'propDateRange' })}
        </Checkbox>,
        placeholder,
        allowClear,
        <Select
          key="picker"
          name="picker"
          label={formatMessage({ id: 'propDatePickerType' })}
          options={[
            { label: formatMessage({ id: 'propDatePickerDate' }), value: 'date' },
            { label: formatMessage({ id: 'propDatePickerWeek' }), value: 'week' },
            { label: formatMessage({ id: 'propDatePickerMonth' }), value: 'month' },
            { label: formatMessage({ id: 'propDatePickerQuarter' }), value: 'quarter' },
            { label: formatMessage({ id: 'propDatePickerYear' }), value: 'year' }
          ]}
        />,
        <Select
          key="format"
          name="format"
          label={formatMessage({ id: 'propDateFormat' })}
          options={[
            { label: 'YYYY-MM-DD', value: 'YYYY-MM-DD' },
            { label: 'YYYY/MM/DD', value: 'YYYY/MM/DD' },
            { label: 'YYYY年MM月DD日', value: 'YYYY年MM月DD日' },
            { label: 'YYYY-MM-DD HH:mm:ss', value: 'YYYY-MM-DD HH:mm:ss' },
            { label: 'YYYY-MM', value: 'YYYY-MM' },
            { label: 'YYYY', value: 'YYYY' }
          ]}
        />,
        <Checkbox key="showTime" name="showTime" display={({ openApi }) => (openApi?.data?.picker || 'date') === 'date'}>
          {formatMessage({ id: 'propShowTime' })}
        </Checkbox>
      ];
    case 'Switch':
      return [
        <Input key="checkedChildren" name="checkedChildren" label={formatMessage({ id: 'propSwitchOnText' })} placeholder={formatMessage({ id: 'propSwitchOnTextHint' })} />,
        <Input key="unCheckedChildren" name="unCheckedChildren" label={formatMessage({ id: 'propSwitchOffText' })} placeholder={formatMessage({ id: 'propSwitchOffTextHint' })} />
      ];
    default:
      return [];
  }
};

const FieldPropsEditor = ({ type, definition: definitionProp }) => {
  const { formatMessage } = useIntl();
  const definition = definitionProp || getFieldDefinition(type);

  const list = useMemo(() => {
    if (!type) {
      return [];
    }
    if (definition?.propsSchema?.length) {
      return buildPropsSchemaList(definition.propsSchema, formatMessage);
    }
    return buildBuiltinList(type, formatMessage);
  }, [type, definition, formatMessage]);

  if (!list.length) {
    return null;
  }

  return <FormInfo title={formatMessage({ id: 'fieldPropsSection' })} column={1} list={list} />;
};

export const hasFieldPropsEditor = (type, definition) => {
  const def = definition || getFieldDefinition(type);
  if (def?.propsSchema?.length) {
    return true;
  }
  return BUILTIN_PROP_TYPES.includes(type);
};

export default FieldPropsEditor;
