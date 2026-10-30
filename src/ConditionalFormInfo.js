import { createElement, useEffect, useMemo } from 'react';
import { useFormContext } from '@kne/react-form-antd';
import FormInfo from '@kne/form-info';
import { evaluateVisibleWhen, getByPath, isEmptyValue } from './fieldCondition';

/**
 * 按 visibleWhen 过滤字段的 FormInfo：
 * entries 为 [{ element, path, visibleWhen }]，不满足条件的字段从 list 中移除（卸载即不参与校验），
 * 已有值的隐藏字段清空，避免提交残留
 */
const ConditionalFormInfo = ({ entries, nested = [], knownNames, ...formInfoProps }) => {
  const { formData, openApi } = useFormContext() || {};
  const hasForm = !!openApi;

  const hiddenPaths = useMemo(() => {
    if (!hasForm) {
      return [];
    }
    return entries.filter(entry => entry.visibleWhen && !evaluateVisibleWhen(entry.visibleWhen, formData, knownNames)).map(entry => entry.path);
  }, [entries, formData, knownNames, hasForm]);

  useEffect(() => {
    if (!hasForm) {
      return;
    }
    const toClear = hiddenPaths.filter(path => !isEmptyValue(getByPath(formData, path)));
    if (toClear.length) {
      openApi.setFields(
        toClear.map(name => ({ name, value: undefined })),
        { runValidate: false }
      );
    }
  }, [hiddenPaths, formData, openApi, hasForm]);

  const list = entries.filter(entry => !hiddenPaths.includes(entry.path)).map(entry => entry.element);

  return createElement(FormInfo, { ...formInfoProps, list: [...list, ...nested] });
};

export default ConditionalFormInfo;
