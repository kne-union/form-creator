import { useEffect, useMemo, useState } from 'react';
import FormInfo, { FormModal } from '@kne/form-info';
import { Input, Select, InputNumber, Checkbox } from '@kne/react-form-antd';
import { message, Tag } from 'antd';
import { useIntl } from '@kne/react-intl';
import { useIsMobile } from '@kne/responsive-utils';
import { ADD_POSITIONS, MATRIX_LAYOUTS, STEPS_STYLES, blockToFormValues, formValuesToBlock, getBlockDefinition, getBlockKindOptions } from './blockRegistry';
import { getFieldTypes } from './fieldRegistry';
import { createBlock } from './schema';
import style from './style.module.scss';
import { LocaleInput } from './LocaleTextInput';
import { arrangeEditorItems, getEditorColumn, getPropertyModalProps } from './editorLayout';

const SECTION_ORDER = ['basic', 'listRule', 'choiceRule', 'choiceData', 'rule', 'layout'];

const SECTION_TEXT = {
  basic: ['blockBasicSection', 'blockBasicSectionDesc'],
  listRule: ['blockListRuleSection', 'blockListRuleSectionDesc'],
  choiceRule: ['choiceRuleSection', 'choiceRuleSectionDesc'],
  choiceData: ['choiceDataSection', 'choiceDataSectionDesc'],
  rule: ['fieldRule', 'matrixScaleRuleDesc'],
  layout: ['blockLayoutSection', 'blockLayoutSectionDesc']
};

const BlockConfigFields = ({ kind }) => {
  const { formatMessage } = useIntl();
  const column = getEditorColumn(useIsMobile());
  const definition = getBlockDefinition(kind);
  const fieldTypeOptions = useMemo(() => getFieldTypes(formatMessage), [formatMessage]);

  const sections = { basic: [], listRule: [], choiceRule: [], choiceData: [], rule: [], layout: [] };
  const add = (section, ...items) => sections[section].push(...items.filter(Boolean));

  const isListKind = kind === 'list' || kind === 'tableList' || kind === 'editableList';
  const titleInput = placeholderId => <LocaleInput key="title" name="title" label={formatMessage({ id: 'blockTitle' })} placeholder={formatMessage({ id: placeholderId || 'blockTitlePlaceholder' })} />;
  const subtitleInput = <LocaleInput key="subtitle" name="subtitle" label={formatMessage({ id: 'blockSubtitle' })} placeholder={formatMessage({ id: 'blockSubtitlePlaceholder' })} />;
  const nameInput = <Input key="name" name="name" label={formatMessage({ id: 'blockName' })} rule="REQ" placeholder={formatMessage({ id: 'fieldNamePlaceholder' })} />;
  const columnInput = <InputNumber key="column" name="column" label={formatMessage({ id: 'formColumnPlaceholder' })} min={1} max={4} />;
  const borderedCheckbox = (
    <Checkbox key="bordered" name="bordered">
      {formatMessage({ id: 'blockBordered' })}
    </Checkbox>
  );
  const fieldTypeSelect = <Select key="fieldType" name="fieldType" label={formatMessage({ id: 'multiFieldType' })} rule="REQ" options={fieldTypeOptions} />;
  const addTextInput = <LocaleInput key="addText" name="addText" label={formatMessage({ id: 'blockAddText' })} placeholder={formatMessage({ id: 'blockAddTextPlaceholder' })} />;

  if (kind === 'formInfo') {
    add('basic', titleInput(), subtitleInput);
    add(
      'layout',
      columnInput,
      <InputNumber key="gap" name="gap" label={formatMessage({ id: 'blockGap' })} min={0} max={48} />,
      borderedCheckbox,
      <Checkbox key="showIndex" name="showIndex">
        {formatMessage({ id: 'blockShowIndex' })}
      </Checkbox>
    );
  }

  if (kind === 'object') {
    add('basic', titleInput(), nameInput);
    add('layout', columnInput, <InputNumber key="gap" name="gap" label={formatMessage({ id: 'blockGap' })} min={0} max={48} />, borderedCheckbox);
  }

  if (isListKind) {
    add('basic', titleInput(), nameInput);
    add(
      'listRule',
      addTextInput,
      kind === 'editableList' ? (
        <Select key="addPosition" name="addPosition" label={formatMessage({ id: 'blockAddPosition' })} options={ADD_POSITIONS.map(value => ({ label: formatMessage({ id: `blockAddPosition_${value}` }), value }))} />
      ) : null,
      <InputNumber key="minLength" name="minLength" label={formatMessage({ id: 'blockMinLength' })} min={0} />,
      <InputNumber key="maxLength" name="maxLength" label={formatMessage({ id: 'blockMaxLength' })} min={1} />
    );
    add(
      'layout',
      columnInput,
      borderedCheckbox,
      kind === 'list' ? (
        <Checkbox key="important" name="important">
          {formatMessage({ id: 'blockImportant' })}
        </Checkbox>
      ) : null
    );
  }

  if (kind === 'choice') {
    add('basic', titleInput('choiceTitlePlaceholder'));
    add(
      'choiceRule',
      <Select
        key="mode"
        name="mode"
        label={formatMessage({ id: 'choiceMode' })}
        rule="REQ"
        options={[
          { label: formatMessage({ id: 'choiceModeSingle' }), value: 'single' },
          { label: formatMessage({ id: 'choiceModeMultiple' }), value: 'multiple' }
        ]}
      />,
      <InputNumber key="minLength" name="minLength" label={formatMessage({ id: 'choiceMinSelect' })} min={0} placeholder={formatMessage({ id: 'propOptionalNumber' })} display={({ openApi }) => openApi?.data?.mode === 'multiple'} />,
      <InputNumber key="maxLength" name="maxLength" label={formatMessage({ id: 'choiceMaxSelect' })} min={1} placeholder={formatMessage({ id: 'propOptionalNumber' })} display={({ openApi }) => openApi?.data?.mode === 'multiple'} />
    );
    add(
      'choiceData',
      <Input
        key="selectorName"
        name="selectorName"
        label={formatMessage({ id: 'choiceSelectorName' })}
        placeholder={formatMessage({ id: 'choiceSelectorNamePlaceholder' })}
        display={({ openApi }) => openApi?.data?.selectorInData !== false}
      />,
      <Checkbox key="selectorInData" name="selectorInData">
        {formatMessage({ id: 'choiceSelectorInData' })}
      </Checkbox>
    );
  }

  if (kind === 'multiField') {
    add('basic', nameInput, <LocaleInput key="label" name="label" label={formatMessage({ id: 'fieldLabel' })} rule="REQ" placeholder={formatMessage({ id: 'fieldLabelPlaceholder' })} />, fieldTypeSelect, addTextInput);
  }

  if (kind === 'matrixScale') {
    add('basic', titleInput(), nameInput, <LocaleInput key="rowTitle" name="rowTitle" label={formatMessage({ id: 'matrixScaleRowTitle' })} placeholder={formatMessage({ id: 'matrixScaleRowTitlePlaceholder' })} />, fieldTypeSelect);
    add(
      'rule',
      <Checkbox key="required" name="required">
        {formatMessage({ id: 'matrixScaleRequired' })}
      </Checkbox>
    );
    add(
      'layout',
      <Select key="layout" name="layout" label={formatMessage({ id: 'matrixScaleLayout' })} rule="REQ" options={MATRIX_LAYOUTS.map(value => ({ label: formatMessage({ id: `matrixScaleLayout_${value}` }), value }))} />,
      borderedCheckbox
    );
  }

  if (kind === 'steps') {
    add('basic', titleInput(), subtitleInput);
    add(
      'layout',
      <Select key="stepsStyle" name="stepsStyle" label={formatMessage({ id: 'stepsStyle' })} options={STEPS_STYLES.map(value => ({ label: formatMessage({ id: `stepsStyle_${value}` }), value }))} />,
      borderedCheckbox,
      <Checkbox key="autoStep" name="autoStep">
        {formatMessage({ id: 'blockAutoStep' })}
      </Checkbox>
    );
  }

  return (
    <>
      <div className={style['editor-intro']}>
        <Tag bordered={false} color={definition?.color || 'default'}>
          {formatMessage({ id: `blockKind_${kind}` })}
        </Tag>
        {definition ? <span>{formatMessage({ id: definition.descriptionId })}</span> : null}
      </div>
      <div className={style['field-editor-form']}>
        {SECTION_ORDER.filter(key => sections[key].length).map(key => (
          <FormInfo key={key} title={formatMessage({ id: SECTION_TEXT[key][0] })} subtitle={formatMessage({ id: SECTION_TEXT[key][1] })} column={column} list={arrangeEditorItems(sections[key], column)} />
        ))}
      </div>
    </>
  );
};

const BlockEditorModal = ({ open, block, onCancel, onSave, renderModal }) => {
  const { formatMessage } = useIntl();
  const isMobile = useIsMobile();
  const isEdit = !!block?.id;
  const formData = useMemo(() => blockToFormValues(block || createBlock('formInfo')), [block, open]);

  const handleSubmit = async values => {
    if (getBlockDefinition(block?.kind)?.requiresName && !values.name) {
      message.error(formatMessage({ id: 'blockNameRequired' }));
      return false;
    }
    onSave(formValuesToBlock(values, block || createBlock(values.kind || 'formInfo')));
  };

  return (
    <FormModal
      key={open ? (block?.id ? `edit-${block.id}` : `add-${block?.kind || 'formInfo'}-${formData.name || 'new'}`) : 'closed'}
      destroyOnHidden
      destroyOnClose
      title={formatMessage({ id: isEdit ? 'editBlock' : 'addBlock' })}
      open={open}
      onCancel={onCancel}
      {...getPropertyModalProps(isMobile, 720)}
      {...(renderModal ? { renderModal } : {})}
      formProps={{
        data: formData,
        onSubmit: handleSubmit
      }}
      okText={formatMessage({ id: 'confirm' })}
      cancelText={formatMessage({ id: 'cancel' })}
    >
      <BlockConfigFields kind={block?.kind || 'formInfo'} />
    </FormModal>
  );
};

export default BlockEditorModal;
