import { useMemo } from 'react';
import FormInfo from '@kne/form-info';
import { Input, InputNumber, Checkbox, useFormContext } from '@kne/react-form-antd';
import { useIntl } from '@kne/react-intl';

const SuperSelectPropsEditor = ({ definition }) => {
  const { formatMessage } = useIntl();
  const { openApi } = useFormContext();

  const list = useMemo(() => {
    const items = [
      <Checkbox
        key="single"
        name="single"
        onChange={checked => {
          if (checked) {
            openApi?.setFields?.(
              [
                { name: 'allowSelectedAll', value: false },
                { name: 'maxLength', value: undefined }
              ],
              { runValidate: false }
            );
          }
        }}
      >
        {formatMessage({ id: 'superSelectSingle' })}
      </Checkbox>,
      <Checkbox key="isPopup" name="isPopup">
        {formatMessage({ id: 'superSelectIsPopup' })}
      </Checkbox>,
      <Checkbox key="allowClear" name="allowClear">
        {formatMessage({ id: 'superSelectAllowClear' })}
      </Checkbox>,
      <Checkbox key="allowSelectedAll" name="allowSelectedAll" display={({ openApi }) => !openApi?.data?.single}>
        {formatMessage({ id: 'superSelectAllowSelectedAll' })}
      </Checkbox>
    ];

    if (definition?.hasOnlyLastLevel) {
      items.push(
        <Checkbox key="onlyAllowLastLevel" name="onlyAllowLastLevel">
          {formatMessage({ id: 'superSelectOnlyLastLevel' })}
        </Checkbox>
      );
    }

    items.push(
      <InputNumber key="maxLength" name="maxLength" label={formatMessage({ id: 'superSelectMaxLength' })} min={1} placeholder={formatMessage({ id: 'superSelectMaxLengthPlaceholder' })} display={({ openApi }) => !openApi?.data?.single} />,
      <Input key="placeholder" name="placeholder" label={formatMessage({ id: 'fieldPlaceholder' })} placeholder={formatMessage({ id: 'superSelectPlaceholderHint' })} />,
      <Input key="searchPlaceholder" name="searchPlaceholder" label={formatMessage({ id: 'superSelectSearchPlaceholder' })} placeholder={formatMessage({ id: 'superSelectSearchPlaceholderHint' })} />
    );

    return items;
  }, [definition, formatMessage, openApi]);

  return <FormInfo title={formatMessage({ id: 'superSelectPropsSection' })} column={1} list={list} />;
};

export default SuperSelectPropsEditor;
