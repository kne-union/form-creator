import { useMemo } from 'react';
import FormInfo, { FormModal } from '@kne/form-info';
import { Input, InputNumber } from '@kne/react-form-antd';
import { useIntl } from '@kne/react-intl';
import { useIsMobile } from '@kne/responsive-utils';
import { formValuesToStep, stepToFormValues } from './blockRegistry';
import { createStep } from './schema';

const StepEditorModal = ({ open, step, onCancel, onSave, renderModal }) => {
  const { formatMessage } = useIntl();
  const isMobile = useIsMobile();
  const formData = useMemo(() => stepToFormValues(step || createStep()), [step, open]);

  return (
    <FormModal
      key={open ? (step?.id ? `edit-${step.id}` : `add-step-${formData.title || 'new'}`) : 'closed'}
      destroyOnHidden
      destroyOnClose
      title={formatMessage({ id: step?.id ? 'editStep' : 'addStep' })}
      open={open}
      onCancel={onCancel}
      width={isMobile ? 'calc(100vw - 32px)' : 560}
      {...(renderModal ? { renderModal } : {})}
      formProps={{
        data: formData,
        onSubmit: values => {
          onSave(formValuesToStep(values, step || createStep()));
        }
      }}
      okText={formatMessage({ id: 'confirm' })}
      cancelText={formatMessage({ id: 'cancel' })}
    >
      <FormInfo
        column={1}
        list={[
          <Input key="title" name="title" label={formatMessage({ id: 'stepTitle' })} rule="REQ" placeholder={formatMessage({ id: 'stepTitlePlaceholder' })} />,
          <InputNumber key="column" name="column" label={formatMessage({ id: 'formColumnPlaceholder' })} min={1} max={4} />
        ]}
      />
    </FormModal>
  );
};

export default StepEditorModal;
