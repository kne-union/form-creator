import { hooks } from '@kne/react-form-antd';
import { useIntl } from '@kne/react-intl';
import SelectList, { SelectCascader, SelectTableList, SelectTree } from '@kne/super-select';
import { SelectFunction, SelectIndustry, SelectAddress } from '@kne/super-select-plus';
import '@kne/super-select/dist/index.css';
import '@kne/super-select-plus/dist/index.css';
import withLocale from '../withLocale';
import { alignOptionKeys, createApiFromOptions, flattenTreeOptions } from './optionsApi';

const { useOnChange } = hooks;

const hasNestedOptions = options => Array.isArray(options) && options.some(item => Array.isArray(item?.children) && item.children.length);

const createField = (Component, { preferOptions = false, flattenTree = false } = {}) => {
  const FieldInner = props => {
    const { formatMessage, locale } = useIntl();
    const { options, api, placeholder, ...rest } = props;
    const valueKey = rest.valueKey || 'value';
    const labelKey = rest.labelKey || 'label';
    const parentKey = rest.parentKey || 'parentId';
    const flattened = flattenTree && Array.isArray(options) ? flattenTreeOptions(options, { valueKey, parentKey }) : options;
    const resolvedOptions = Array.isArray(flattened) ? alignOptionKeys(flattened, { valueKey, labelKey }) : flattened;
    const useOptionsDirectly = preferOptions || hasNestedOptions(resolvedOptions);
    const mergedApi = api || (!useOptionsDirectly && Array.isArray(resolvedOptions) && resolvedOptions.length ? createApiFromOptions(resolvedOptions) : undefined);
    const resolvedPlaceholder = placeholder != null && String(placeholder).trim() ? placeholder : formatMessage({ id: 'extendedFieldPlaceholder' }, { label: props.label || '' }).trim();

    const render = useOnChange(
      Object.assign(
        {},
        {
          isPopup: true,
          placeholder: resolvedPlaceholder
        },
        rest,
        {
          locale,
          valueKey,
          labelKey
        },
        useOptionsDirectly && Array.isArray(resolvedOptions) ? { options: resolvedOptions } : {},
        mergedApi ? { api: mergedApi } : {}
      )
    );
    return render(Component);
  };
  const Field = withLocale(FieldInner);
  Field.field = Component;
  return Field;
};

export const SuperSelectList = createField(SelectList);
export const SuperSelectTableList = createField(SelectTableList, { preferOptions: true });
export const SuperSelectTree = createField(SelectTree, { preferOptions: true, flattenTree: true });
export const SuperSelectCascader = createField(SelectCascader, { preferOptions: true });

export const SelectFunctionField = createField(SelectFunction);
export const SelectIndustryField = createField(SelectIndustry);
export const SelectAddressField = createField(SelectAddress);
