import { useMemo } from 'react';
import FormInfo, { FormModal } from '@kne/form-info';
import { Switch, Slider, RadioGroup } from '@kne/react-form-antd';
import { useIntl } from '@kne/react-intl';
import { useIsMobile } from '@kne/responsive-utils';
import { normalizeFormActions } from './schema';
import style from './style.module.scss';
import { LocaleInput } from './LocaleTextInput';
import { getEditorColumn, getPropertyModalProps } from './editorLayout';

const FormActionsEditor = ({ open, value, onCancel, onSave, renderModal }) => {
  const { formatMessage } = useIntl();
  const isMobile = useIsMobile();
  const column = getEditorColumn(isMobile);
  const formData = useMemo(() => normalizeFormActions(value), [value, open]);

  const alignOptions = useMemo(
    () => [
      { label: formatMessage({ id: 'formActionsAlignStart' }), value: 'start' },
      { label: formatMessage({ id: 'formActionsAlignCenter' }), value: 'center' },
      { label: formatMessage({ id: 'formActionsAlignEnd' }), value: 'end' }
    ],
    [formatMessage]
  );

  const gapMarks = useMemo(
    () => ({
      0: '0',
      16: '16',
      32: '32',
      48: '48',
      64: '64'
    }),
    []
  );

  return (
    <FormModal
      key={open ? 'form-actions-open' : 'form-actions-closed'}
      destroyOnHidden
      destroyOnClose
      title={formatMessage({ id: 'formActionsSection' })}
      open={open}
      onCancel={onCancel}
      {...getPropertyModalProps(isMobile, 560)}
      {...(renderModal ? { renderModal } : {})}
      formProps={{
        data: formData,
        onSubmit: values => {
          onSave?.(normalizeFormActions(values));
        }
      }}
      okText={formatMessage({ id: 'confirm' })}
      cancelText={formatMessage({ id: 'cancel' })}
    >
      <div className={`${style['field-editor-form']} ${style['form-actions-editor']}`}>
        <FormInfo
          title={formatMessage({ id: 'formActionsButtonsSection' })}
          subtitle={formatMessage({ id: 'formActionsButtonsSectionDesc' })}
          column={column}
          list={[
            <Switch key="showSubmit" name="showSubmit" label={formatMessage({ id: 'formActionsShowSubmit' })} className={style['form-actions-switch-field']} />,
            <LocaleInput
              key="submitText"
              name="submitText"
              label={formatMessage({ id: 'formActionsSubmitText' })}
              placeholder={formatMessage({ id: 'formActionsSubmitTextHint' })}
              display={({ openApi }) => Boolean(openApi?.data?.showSubmit)}
            />,
            <Switch key="showReset" name="showReset" label={formatMessage({ id: 'formActionsShowReset' })} className={style['form-actions-switch-field']} />,
            <LocaleInput key="resetText" name="resetText" label={formatMessage({ id: 'formActionsResetText' })} placeholder={formatMessage({ id: 'formActionsResetTextHint' })} display={({ openApi }) => Boolean(openApi?.data?.showReset)} />,
            <Switch key="showCancel" name="showCancel" label={formatMessage({ id: 'formActionsShowCancel' })} className={style['form-actions-switch-field']} />,
            <LocaleInput
              key="cancelText"
              name="cancelText"
              label={formatMessage({ id: 'formActionsCancelText' })}
              placeholder={formatMessage({ id: 'formActionsCancelTextHint' })}
              display={({ openApi }) => Boolean(openApi?.data?.showCancel)}
            />
          ]}
        />
        <FormInfo
          title={formatMessage({ id: 'formActionsLayoutSection' })}
          subtitle={formatMessage({ id: 'formActionsLayoutSectionDesc' })}
          column={1}
          list={[
            <RadioGroup key="align" name="align" label={formatMessage({ id: 'formActionsAlign' })} optionType="button" buttonStyle="solid" options={alignOptions} className={style['form-actions-align-group']} />,
            <Slider key="gap" name="gap" label={formatMessage({ id: 'formActionsGap' })} min={0} max={64} step={1} marks={gapMarks} tooltip={{ formatter: v => `${v ?? 0}px` }} className={style['form-actions-gap-slider']} />
          ]}
        />
      </div>
    </FormModal>
  );
};

export default FormActionsEditor;
