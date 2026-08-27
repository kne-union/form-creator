import { createElement, useCallback, useEffect, useMemo } from 'react';
import { useFormContext, RadioGroup, CheckboxGroup } from '@kne/react-form-antd';
import InfoPage from '@kne/info-page';
import { collectBlockFieldNames } from './schema';
import style from './style.module.scss';

const getByPath = (obj, path) => {
  if (obj == null || path == null || path === '') {
    return undefined;
  }
  return String(path)
    .split('.')
    .reduce((current, key) => (current == null ? undefined : current[key]), obj);
};

const resolveSelectorName = block => {
  if (block.selectorName != null && String(block.selectorName).trim()) {
    return String(block.selectorName).trim();
  }
  if (block.discriminator?.propertyName) {
    return String(block.discriminator.propertyName).trim();
  }
  return `__choice_${block.id}`;
};

const resolveSelectedIds = (value, mode) => {
  if (mode === 'multiple') {
    if (Array.isArray(value)) {
      return value.map(String);
    }
    if (value == null || value === '') {
      return [];
    }
    return [String(value)];
  }
  if (value == null || value === '') {
    return [];
  }
  return [String(value)];
};

const clearUnselectedOptionFields = (openApi, formData, keepIds, allOptions) => {
  if (!openApi?.setFields) {
    return;
  }
  const entries = [];
  allOptions.forEach(option => {
    if (keepIds.includes(String(option.id))) {
      return;
    }
    (option.list || []).forEach(field => {
      if (!field?.name) {
        return;
      }
      const current = getByPath(formData, field.name);
      if (current !== undefined) {
        entries.push({ name: field.name, value: undefined });
      }
    });
    collectBlockFieldNames(option.blocks || []).forEach(name => {
      const current = getByPath(formData, name);
      if (current !== undefined) {
        entries.push({ name, value: undefined });
      }
    });
  });
  if (!entries.length) {
    return;
  }
  openApi.setFields(entries, { runValidate: false });
};

const resolveSelectLimits = block => {
  const minLength = Number.isFinite(Number(block.minLength)) ? Math.max(0, Math.floor(Number(block.minLength))) : undefined;
  let maxLength = Number.isFinite(Number(block.maxLength)) ? Math.max(1, Math.floor(Number(block.maxLength))) : undefined;
  if (minLength != null && maxLength != null && maxLength < minLength) {
    maxLength = minLength;
  }
  return { minLength, maxLength };
};

const buildMultipleHint = (formatMessage, minLength, maxLength) => {
  if (minLength != null && maxLength != null) {
    return formatMessage ? formatMessage({ id: 'choiceModeHintMultipleRange' }, { min: minLength, max: maxLength }) : `请选择 ${minLength}–${maxLength} 项`;
  }
  if (minLength != null) {
    return formatMessage ? formatMessage({ id: 'choiceModeHintMultipleMin' }, { count: minLength }) : `请至少选择 ${minLength} 项`;
  }
  if (maxLength != null) {
    return formatMessage ? formatMessage({ id: 'choiceModeHintMultipleMax' }, { count: maxLength }) : `最多选择 ${maxLength} 项`;
  }
  return formatMessage ? formatMessage({ id: 'choiceModeHintMultiple' }) : '可以选择多项';
};

/**
 * choice：同一条选项 UI；mode=single 只挂载一支；mode=multiple 平铺所有选中支。
 * 外层用 InfoPage.Part 的 title 展示标题。
 */
const ChoiceBlock = ({ block, preview = false, isMobile = false, formatMessage, renderOptionContent }) => {
  const mode = block.mode === 'multiple' ? 'multiple' : 'single';
  const selectorName = resolveSelectorName(block);
  const options = useMemo(() => block.options || [], [block.options]);
  const { formData, openApi } = useFormContext() || {};
  const titleText = block.title != null ? String(block.title).trim() : '';
  const title = titleText || (formatMessage ? formatMessage({ id: 'choiceAreaTitle' }) : '请选择');
  const bordered = isMobile ? false : block.bordered || undefined;
  const { minLength, maxLength } = mode === 'multiple' ? resolveSelectLimits(block) : {};
  const firstOptionId = options[0] != null ? String(options[0].id) : undefined;

  const rawValue = getByPath(formData || {}, selectorName);
  // 仅随 selector 值变化；勿依赖整个 formData，否则清空未选支字段会触发 options 重算 → CheckboxGroup 死循环
  const selectorValueKey = mode === 'multiple' ? (Array.isArray(rawValue) ? rawValue.map(String).join('\0') : String(rawValue ?? '')) : String(rawValue ?? '');

  // 单选且未选时，写入第一项，保证预览/提交与选项面板一致
  useEffect(() => {
    if (mode !== 'single' || !firstOptionId || !openApi?.setFields) {
      return;
    }
    if (selectorValueKey !== '') {
      return;
    }
    openApi.setFields([{ name: selectorName, value: firstOptionId }], { runValidate: false });
  }, [mode, firstOptionId, selectorName, openApi, selectorValueKey]);

  const selectedIdsFromValue = useMemo(() => resolveSelectedIds(rawValue, mode), [selectorValueKey, mode]);

  const selectorOptions = useMemo(() => {
    const atMax = mode === 'multiple' && maxLength != null && selectedIdsFromValue.length >= maxLength;

    return options.map((option, index) => {
      const value = String(option.id);
      return {
        label: option.title || (formatMessage ? formatMessage({ id: 'choiceOptionFallback' }, { index: index + 1 }) : `选项${index + 1}`),
        value,
        disabled: atMax && !selectedIdsFromValue.includes(value)
      };
    });
  }, [options, formatMessage, selectedIdsFromValue, mode, maxLength]);

  let selectedIds = selectedIdsFromValue;
  if (mode === 'single' && !selectedIds.length && firstOptionId) {
    selectedIds = [firstOptionId];
  }
  const activeOptions = options.filter(option => selectedIds.includes(String(option.id)));

  const handleChange = useCallback(
    value => {
      let nextIds = resolveSelectedIds(value, mode);
      if (mode === 'multiple' && maxLength != null && nextIds.length > maxLength) {
        nextIds = nextIds.slice(0, maxLength);
        openApi?.setFields?.([{ name: selectorName, value: nextIds }], { runValidate: false });
      }
      clearUnselectedOptionFields(openApi, formData, nextIds, options);
    },
    [mode, maxLength, openApi, selectorName, formData, options]
  );

  const selectorRule = useCallback(
    value => {
      const ids = resolveSelectedIds(value, 'multiple');
      if (minLength != null && ids.length < minLength) {
        return {
          result: false,
          errMsg: formatMessage ? formatMessage({ id: 'choiceMinSelectError' }, { count: minLength }) : `请至少选择 ${minLength} 项`
        };
      }
      if (maxLength != null && ids.length > maxLength) {
        return {
          result: false,
          errMsg: formatMessage ? formatMessage({ id: 'choiceMaxSelectError' }, { count: maxLength }) : `最多只能选择 ${maxLength} 项`
        };
      }
      return { result: true, errMsg: '' };
    },
    [minLength, maxLength, formatMessage]
  );

  const hasSelectLimitRule = mode === 'multiple' && (minLength != null || maxLength != null);

  const Selector = mode === 'multiple' ? CheckboxGroup : RadioGroup;
  const selectorProps = {
    key: `choice-selector-${mode}`,
    name: selectorName,
    label: titleText || (formatMessage ? formatMessage({ id: 'choiceAreaTitle' }) : '请选择'),
    labelHidden: true,
    options: selectorOptions,
    onChange: handleChange,
    ...(hasSelectLimitRule ? { rule: selectorRule } : {}),
    ...(mode === 'single'
      ? {
          optionType: 'button',
          buttonStyle: 'solid',
          ...(firstOptionId ? { defaultValue: firstOptionId } : {})
        }
      : {
          // CheckboxGroup 需要数组初值，避免 undefined↔[] 来回同步
          defaultValue: []
        })
  };

  const contentChildren = [];
  activeOptions.forEach(option => {
    const nodes = (typeof renderOptionContent === 'function' ? renderOptionContent(option, { preview, isMobile, formatMessage }) : []) || [];
    if (nodes.length) {
      contentChildren.push(
        createElement('div', { key: option.id, className: style['choice-option-panel'] }, mode === 'multiple' && option.title ? createElement('div', { className: style['choice-option-panel-title'] }, option.title) : null, ...nodes)
      );
    }
  });

  const modeHint = mode === 'multiple' ? buildMultipleHint(formatMessage, minLength, maxLength) : formatMessage ? formatMessage({ id: 'choiceModeHintSingle' }) : '请选择其中一项';

  return createElement(
    InfoPage.Part,
    {
      title,
      subtitle: modeHint,
      bordered,
      className: style['choice-block'],
      'data-choice-mode': mode
    },
    createElement('div', { className: style['choice-selector'] }, createElement(Selector, selectorProps)),
    contentChildren.length
      ? createElement('div', { className: style['choice-panels'] }, ...contentChildren)
      : createElement('div', { className: style['choice-panels-empty'] }, formatMessage ? formatMessage({ id: 'choiceSelectFirstHint' }) : '请先在上方选择')
  );
};

export default ChoiceBlock;
