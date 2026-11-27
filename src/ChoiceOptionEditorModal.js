import { useMemo } from 'react';
import FormInfo, { FormModal } from '@kne/form-info';
import { useIntl } from '@kne/react-intl';
import { useIsMobile } from '@kne/responsive-utils';
import { choiceOptionToFormValues, formValuesToChoiceOption } from './blockRegistry';
import { createChoiceOption } from './schema';
import { LocaleInput } from './LocaleTextInput';
import { getPropertyModalProps } from './editorLayout';
import style from './style.module.scss';

const ChoiceOptionEditorModal = ({ open, option, onCancel, onSave, renderModal }) => {
  const { formatMessage } = useIntl();
  const isMobile = useIsMobile();
  const formData = useMemo(() => choiceOptionToFormValues(option || createChoiceOption()), [option, open]);

  return (
    <FormModal
      key={open ? (option?.id ? `edit-option-${option.id}` : `add-option-${formData.title || 'new'}`) : 'closed'}
      destroyOnHidden
      destroyOnClose
      title={formatMessage({ id: option?.id ? 'editChoiceOption' : 'addChoiceOption' })}
      open={open}
      onCancel={onCancel}
      {...getPropertyModalProps(isMobile, 560)}
      {...(renderModal ? { renderModal } : {})}
      formProps={{
        data: formData,
        onSubmit: values => {
          onSave(formValuesToChoiceOption(values, option || createChoiceOption()));
        }
      }}
      okText={formatMessage({ id: 'confirm' })}
      cancelText={formatMessage({ id: 'cancel' })}
    >
      <div className={`${style['field-editor-form']} ${style['is-plain']}`}>
        <FormInfo column={1} list={[<LocaleInput key="title" name="title" label={formatMessage({ id: 'choiceOptionTitle' })} rule="REQ" placeholder={formatMessage({ id: 'choiceOptionTitlePlaceholder' })} />]} />
      </div>
    </FormModal>
  );
};

export default ChoiceOptionEditorModal;
