import { useEffect, useMemo, useState } from 'react';
import FormInfo, { FormModal } from '@kne/form-info';
import { Input, Select, InputNumber, Checkbox } from '@kne/react-form-antd';
import { message } from 'antd';
import { useIntl } from '@kne/react-intl';
import { useIsMobile } from '@kne/responsive-utils';
import { blockToFormValues, formValuesToBlock, getBlockDefinition, getBlockKindOptions } from './blockRegistry';
import { getFieldTypes } from './fieldRegistry';
import { createBlock } from './schema';
import style from './style.module.scss';

const BlockConfigFields = ({ kind }) => {
  const { formatMessage } = useIntl();
  const definition = getBlockDefinition(kind);
  const fieldTypeOptions = useMemo(() => getFieldTypes(), []);

  const list = [];

  if (kind === 'formInfo' || kind === 'list' || kind === 'tableList') {
    list.push(
      <Input key="title" name="title" label={formatMessage({ id: 'blockTitle' })} placeholder={formatMessage({ id: 'blockTitlePlaceholder' })} />,
      kind === 'formInfo' ? <Input key="subtitle" name="subtitle" label={formatMessage({ id: 'blockSubtitle' })} placeholder={formatMessage({ id: 'blockSubtitlePlaceholder' })} /> : null,
      kind !== 'formInfo' ? <Input key="name" name="name" label={formatMessage({ id: 'blockName' })} rule="REQ" placeholder={formatMessage({ id: 'fieldNamePlaceholder' })} /> : null,
      <InputNumber key="column" name="column" label={formatMessage({ id: 'formColumnPlaceholder' })} min={1} max={4} />,
      kind === 'formInfo' ? <InputNumber key="gap" name="gap" label={formatMessage({ id: 'blockGap' })} min={0} max={48} /> : null,
      <Checkbox key="bordered" name="bordered">
        {formatMessage({ id: 'blockBordered' })}
      </Checkbox>,
      kind === 'list' ? (
        <Checkbox key="important" name="important">
          {formatMessage({ id: 'blockImportant' })}
        </Checkbox>
      ) : null,
      kind !== 'formInfo' ? <Input key="addText" name="addText" label={formatMessage({ id: 'blockAddText' })} placeholder={formatMessage({ id: 'blockAddTextPlaceholder' })} /> : null,
      kind !== 'formInfo' ? <InputNumber key="maxLength" name="maxLength" label={formatMessage({ id: 'blockMaxLength' })} min={1} /> : null,
      kind !== 'formInfo' ? <InputNumber key="minLength" name="minLength" label={formatMessage({ id: 'blockMinLength' })} min={0} /> : null
    );
  }

  if (kind === 'multiField') {
    list.push(
      <Input key="name" name="name" label={formatMessage({ id: 'blockName' })} rule="REQ" placeholder={formatMessage({ id: 'fieldNamePlaceholder' })} />,
      <Input key="label" name="label" label={formatMessage({ id: 'fieldLabel' })} rule="REQ" placeholder={formatMessage({ id: 'fieldLabelPlaceholder' })} />,
      <Select key="fieldType" name="fieldType" label={formatMessage({ id: 'multiFieldType' })} rule="REQ" options={fieldTypeOptions} />,
      <Input key="addText" name="addText" label={formatMessage({ id: 'blockAddText' })} placeholder={formatMessage({ id: 'blockAddTextPlaceholder' })} />
    );
  }

  if (kind === 'steps') {
    list.push(
      <Input key="title" name="title" label={formatMessage({ id: 'blockTitle' })} placeholder={formatMessage({ id: 'blockTitlePlaceholder' })} />,
      <Input key="subtitle" name="subtitle" label={formatMessage({ id: 'blockSubtitle' })} placeholder={formatMessage({ id: 'blockSubtitlePlaceholder' })} />,
      <Checkbox key="bordered" name="bordered">
        {formatMessage({ id: 'blockBordered' })}
      </Checkbox>,
      <Checkbox key="autoStep" name="autoStep">
        {formatMessage({ id: 'blockAutoStep' })}
      </Checkbox>
    );
  }

  return (
    <div className={style['field-editor-form']}>
      <FormInfo title={definition?.label || kind} subtitle={definition?.description} column={1} list={list.filter(Boolean)} />
    </div>
  );
};

const BlockEditorModal = ({ open, block, onCancel, onSave, renderModal }) => {
  const { formatMessage } = useIntl();
  const isMobile = useIsMobile();
  const isEdit = !!block?.id;
  const formData = useMemo(() => blockToFormValues(block || createBlock('formInfo')), [block, open]);

  const handleSubmit = async values => {
    if ((block?.kind === 'list' || block?.kind === 'tableList' || block?.kind === 'multiField') && !values.name) {
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
      width={isMobile ? 'calc(100vw - 32px)' : 720}
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
