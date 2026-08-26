import { hooks } from '@kne/react-form-antd';
import SelectList, { SelectCascader, SelectTableList, SelectTree } from '@kne/super-select';
import { SelectFunction, SelectIndustry, SelectAddress } from '@kne/super-select-plus';
import '@kne/super-select/dist/index.css';
import '@kne/super-select-plus/dist/index.css';
import { createApiFromOptions } from './optionsApi';

const { useOnChange } = hooks;

const hasNestedOptions = options => Array.isArray(options) && options.some(item => Array.isArray(item?.children) && item.children.length);

const createField = (Component, { preferOptions = false, placeholderPrefix = '请选择' } = {}) => {
  const Field = props => {
    const { options, api, placeholder, ...rest } = props;
    const useOptionsDirectly = preferOptions || hasNestedOptions(options);
    const mergedApi = api || (!useOptionsDirectly && Array.isArray(options) && options.length ? createApiFromOptions(options) : undefined);
    const resolvedPlaceholder = placeholder != null && String(placeholder).trim() ? placeholder : `${placeholderPrefix}${props.label || ''}`;

    const render = useOnChange(
      Object.assign(
        {},
        {
          isPopup: true,
          placeholder: resolvedPlaceholder
        },
        rest,
        useOptionsDirectly && Array.isArray(options) ? { options } : {},
        mergedApi ? { api: mergedApi } : {}
      )
    );
    return render(Component);
  };
  Field.field = Component;
  return Field;
};

export const SuperSelectList = createField(SelectList);
export const SuperSelectTableList = createField(SelectTableList, { preferOptions: true });
export const SuperSelectTree = createField(SelectTree, { preferOptions: true });
export const SuperSelectCascader = createField(SelectCascader, { preferOptions: true });

export const SelectFunctionField = createField(SelectFunction);
export const SelectIndustryField = createField(SelectIndustry);
export const SelectAddressField = createField(SelectAddress);
