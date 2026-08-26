import { useMemo } from 'react';
import FormInfo, { FormModal } from '@kne/form-info';
import { Input, Switch, Slider, RadioGroup } from '@kne/react-form-antd';
import { useIntl } from '@kne/react-intl';
import { useIsMobile } from '@kne/responsive-utils';
import { normalizeFormActions } from './schema';
import style from './style.module.scss';

const FormActionsEditor = ({ open, value, onCancel, onSave, renderModal }) => {
  const { formatMessage } = useIntl();
  const isMobile = useIsMobile();
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
      width={isMobile ? 'calc(100vw - 32px)' : 520}
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
      <div className={style['form-actions-editor']}>
        <FormInfo
          column={2}
          list={[
            <Switch key="showSubmit" name="showSubmit" label={formatMessage({ id: 'formActionsShowSubmit' })} className={style['form-actions-switch-field']} />,
            <Input key="submitText" name="submitText" label={formatMessage({ id: 'formActionsSubmitText' })} placeholder={formatMessage({ id: 'formActionsSubmitTextHint' })} display={({ openApi }) => Boolean(openApi?.data?.showSubmit)} />
          ]}
        />
        <FormInfo
          column={2}
          list={[
            <Switch key="showReset" name="showReset" label={formatMessage({ id: 'formActionsShowReset' })} className={style['form-actions-switch-field']} />,
            <Input key="resetText" name="resetText" label={formatMessage({ id: 'formActionsResetText' })} placeholder={formatMessage({ id: 'formActionsResetTextHint' })} display={({ openApi }) => Boolean(openApi?.data?.showReset)} />
          ]}
        />
        <FormInfo
          column={2}
          list={[
            <Switch key="showCancel" name="showCancel" label={formatMessage({ id: 'formActionsShowCancel' })} className={style['form-actions-switch-field']} />,
            <Input key="cancelText" name="cancelText" label={formatMessage({ id: 'formActionsCancelText' })} placeholder={formatMessage({ id: 'formActionsCancelTextHint' })} display={({ openApi }) => Boolean(openApi?.data?.showCancel)} />
          ]}
        />
        <div className={style['form-actions-layout-panel']}>
          <div className={style['form-actions-layout-title']}>{formatMessage({ id: 'formActionsLayoutSection' })}</div>
          <FormInfo
            column={1}
            list={[
              <RadioGroup key="align" name="align" label={formatMessage({ id: 'formActionsAlign' })} optionType="button" buttonStyle="solid" options={alignOptions} className={style['form-actions-align-group']} />,
              <Slider key="gap" name="gap" label={formatMessage({ id: 'formActionsGap' })} min={0} max={64} step={1} marks={gapMarks} tooltip={{ formatter: v => `${v ?? 0}px` }} className={style['form-actions-gap-slider']} />
            ]}
          />
        </div>
      </div>
    </FormModal>
  );
};

export default FormActionsEditor;
