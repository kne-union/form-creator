import { useEffect, useMemo, useState } from 'react';
import FormInfo, { FormModal } from '@kne/form-info';
import { Input, TextArea, Select, Checkbox, useFormContext } from '@kne/react-form-antd';
import { message, Typography } from 'antd';
const { Text } = Typography;
import { useIntl } from '@kne/react-intl';
import { useIsMobile } from '@kne/responsive-utils';
import { createField, createEmptyColumn, isFieldNameUnique } from './schema';
import { fieldToFormValues, formValuesToField, getFieldDefinition, getFieldTypes, normalizeOptions, normalizeColumns, pickFieldProps } from './fieldRegistry';
import RulePresetEditor from './RulePresetEditor';
import OptionsEditor from './OptionsEditor';
import SuperSelectPropsEditor from './SuperSelectPropsEditor';
import FieldPropsEditor, { hasFieldPropsEditor } from './FieldPropsEditor';
import style from './style.module.scss';

const getDefaultSelectProps = () => ({
  single: false,
  isPopup: true,
  allowClear: true,
  allowSelectedAll: false,
  onlyAllowLastLevel: false,
  maxLength: undefined,
  placeholder: '',
  searchPlaceholder: '',
  columns: [createEmptyColumn()]
});

const omitColumns = ({ columns, ...rest } = {}) => rest;

const FieldConfigFields = ({ initialType, options, onOptionsChange, columns, onColumnsChange }) => {
  const { formatMessage } = useIntl();
  const { openApi } = useFormContext();
  const [fieldType, setFieldType] = useState(initialType);
  const fieldTypeOptions = useMemo(() => getFieldTypes(), []);
  const definition = getFieldDefinition(fieldType);

  useEffect(() => {
    setFieldType(initialType);
  }, [initialType]);

  const applyTypeDefaults = nextType => {
    const nextDefinition = getFieldDefinition(nextType);
    let nextValues = {};
    if (nextDefinition?.isSuperSelect) {
      nextValues = omitColumns(getDefaultSelectProps());
    } else if (nextDefinition?.hasFieldProps || nextDefinition?.propsSchema?.length) {
      nextValues = pickFieldProps({ type: nextType, props: nextDefinition.defaultProps || {} }, nextDefinition);
    }
    const entries = Object.entries(nextValues).map(([name, value]) => ({ name, value }));
    if (!entries.length || !openApi?.setFields) {
      return;
    }
    // 等新类型的 Form Field 挂载后再写入默认值
    requestAnimationFrame(() => {
      openApi.setFields(entries, { runValidate: false });
    });
  };

  const list = [
    <Select
      key="type"
      name="type"
      label={formatMessage({ id: 'fieldType' })}
      rule="REQ"
      options={fieldTypeOptions}
      onChange={nextType => {
        setFieldType(nextType);
        applyTypeDefaults(nextType);
      }}
    />,
    <Input key="name" name="name" label={formatMessage({ id: 'fieldName' })} rule="REQ" placeholder={formatMessage({ id: 'fieldNamePlaceholder' })} />,
    <Input key="label" name="label" label={formatMessage({ id: 'fieldLabel' })} rule="REQ" placeholder={formatMessage({ id: 'fieldLabelPlaceholder' })} />,
    <Input key="tips" name="tips" label={formatMessage({ id: 'fieldTips' })} placeholder={formatMessage({ id: 'fieldTipsPlaceholder' })} />,
    <TextArea key="description" name="description" label={formatMessage({ id: 'fieldDescription' })} placeholder={formatMessage({ id: 'fieldDescriptionPlaceholder' })} rows={2} />
  ];

  list.push(
    <Checkbox key="block" name="block">
      {formatMessage({ id: 'fieldBlock' })}
    </Checkbox>,
    <Checkbox key="hidden" name="hidden">
      {formatMessage({ id: 'fieldHidden' })}
    </Checkbox>
  );

  return (
    <div className={style['field-editor-form']}>
      <FormInfo title={formatMessage({ id: 'fieldBasicSection' })} column={1} list={list} />
      {definition?.isSuperSelect ? <SuperSelectPropsEditor definition={definition} /> : hasFieldPropsEditor(fieldType, definition) ? <FieldPropsEditor type={fieldType} definition={definition} /> : null}
      <RulePresetEditor />
      {definition?.hasBuiltinData ? (
        <Text type="secondary">{formatMessage({ id: 'builtinDataHint' })}</Text>
      ) : definition?.hasOptions ? (
        <OptionsEditor
          value={options}
          onChange={onOptionsChange}
          allowDescription={definition.optionsAllowDescription}
          allowChildren={definition.optionsAllowChildren}
          hasColumns={definition.hasColumns}
          columns={columns}
          onColumnsChange={onColumnsChange}
        />
      ) : null}
    </div>
  );
};

const FieldEditorModal = ({ open, field, fieldList, onCancel, onSave, renderModal }) => {
  const { formatMessage } = useIntl();
  const isMobile = useIsMobile();
  const isEdit = !!field?.id;
  const editorValues = useMemo(() => fieldToFormValues(field || createField()), [field, open]);
  const formData = useMemo(() => {
    const ruleConfig = editorValues.ruleConfig || { presets: [], lenMin: '', lenMax: '' };
    return {
      type: editorValues.type,
      name: editorValues.name,
      label: editorValues.label,
      tips: editorValues.tips,
      description: editorValues.description,
      block: editorValues.block,
      hidden: editorValues.hidden,
      ...(editorValues.fieldProps || {}),
      ...omitColumns(editorValues.selectProps || {}),
      rulePresets: ruleConfig.presets || [],
      lenMin: ruleConfig.lenMin === '' ? undefined : ruleConfig.lenMin,
      lenMax: ruleConfig.lenMax === '' ? undefined : ruleConfig.lenMax
    };
  }, [editorValues]);
  const [options, setOptions] = useState([{ label: '', value: '' }]);
  const [columns, setColumns] = useState(() => [createEmptyColumn()]);

  useEffect(() => {
    if (!open) {
      return;
    }
    setOptions(editorValues.options?.length ? editorValues.options : [{ label: '', value: '' }]);
    setColumns(editorValues.selectProps?.columns?.length ? editorValues.selectProps.columns : [createEmptyColumn()]);
  }, [open, editorValues]);

  const handleSubmit = async values => {
    if (!isFieldNameUnique(fieldList, values.name, field?.id)) {
      message.error(formatMessage({ id: 'fieldNameDuplicate' }));
      return false;
    }
    const definition = getFieldDefinition(values.type);
    const normalizedColumns = definition?.hasColumns ? normalizeColumns(columns) : [];
    const nextField = formValuesToField(
      {
        ...values,
        ruleConfig: {
          presets: values.rulePresets || [],
          lenMin: values.lenMin ?? '',
          lenMax: values.lenMax ?? ''
        },
        options: normalizeOptions(options, {
          allowChildren: !!definition?.optionsAllowChildren,
          columns: normalizedColumns
        }),
        selectProps: {
          ...values,
          columns: normalizedColumns
        },
        fieldProps: values
      },
      field || createField()
    );
    if (!nextField.id) {
      nextField.id = createField().id;
    }
    onSave(nextField);
  };

  const modalKey = open ? (field?.id ? `edit-${field.id}` : `add-${formData.name}`) : 'closed';

  return (
    <FormModal
      key={modalKey}
      destroyOnHidden
      destroyOnClose
      title={formatMessage({ id: isEdit ? 'editField' : 'addField' })}
      open={open}
      onCancel={onCancel}
      width={isMobile ? 'calc(100vw - 32px)' : 760}
      {...(renderModal ? { renderModal } : {})}
      formProps={{
        data: formData,
        onSubmit: handleSubmit
      }}
      okText={formatMessage({ id: 'confirm' })}
      cancelText={formatMessage({ id: 'cancel' })}
    >
      <FieldConfigFields initialType={formData.type} options={options} onOptionsChange={setOptions} columns={columns} onColumnsChange={setColumns} />
    </FormModal>
  );
};

export default FieldEditorModal;
