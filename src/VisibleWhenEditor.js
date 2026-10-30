import { useMemo, useState } from 'react';
import FormInfo from '@kne/form-info';
import { useFormContext } from '@kne/react-form-antd';
import { Button, Flex, Input, InputNumber, Radio, Select, Switch, Typography } from 'antd';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { useIntl } from '@kne/react-intl';
import { getFieldDefinition } from './fieldRegistry';
import { resolveLocaleText } from './localeText';
import { ALLOWED_REGEX_FLAGS, NO_VALUE_OPERATORS, compileConditionRegex, getConditionOperators, getConditionValueKind, getFieldConditionPath, wouldCreateCycle } from './fieldCondition';
import style from './style.module.scss';

const { Text } = Typography;

const MULTI_VALUE_OPERATORS = ['in', 'includesAny'];

const createCondition = () => ({ field: undefined, operator: undefined, value: undefined });

/** 编辑器提交前校验：返回错误文案 id，通过返回 null */
export const validateVisibleWhenDraft = visibleWhen => {
  if (!visibleWhen) {
    return null;
  }
  const incomplete = (visibleWhen.conditions || []).some(condition => {
    if (!condition?.field || !condition.operator) {
      return true;
    }
    if (NO_VALUE_OPERATORS.includes(condition.operator)) {
      return false;
    }
    const value = condition.value;
    return value === undefined || value === null || value === '' || (Array.isArray(value) && !value.length);
  });
  if (incomplete || !(visibleWhen.conditions || []).length) {
    return 'visibleWhenConditionRequired';
  }
  if (visibleWhen.conditions.some(condition => condition.operator === 'regex' && !compileConditionRegex(condition.value, condition.flags))) {
    return 'visibleWhenRegexInvalid';
  }
  return null;
};

const RegexTester = ({ condition }) => {
  const { formatMessage } = useIntl();
  const [text, setText] = useState('');
  const regex = compileConditionRegex(condition.value, condition.flags);
  const status = regex && text !== '' ? regex.test(text) : null;
  return (
    <Flex gap={8} align="center" className={style['visible-when-regex-tester']}>
      <Input size="small" value={text} placeholder={formatMessage({ id: 'visibleWhenRegexTester' })} onChange={e => setText(e.target.value)} />
      {status === null ? null : <Text type={status ? 'success' : 'warning'}>{formatMessage({ id: status ? 'visibleWhenRegexMatched' : 'visibleWhenRegexNotMatched' })}</Text>}
    </Flex>
  );
};

const ConditionValueInput = ({ condition, trigger, onChange }) => {
  const { formatMessage, locale } = useIntl();
  const definition = getFieldDefinition(trigger?.type);
  const kind = getConditionValueKind(trigger, definition);

  if (NO_VALUE_OPERATORS.includes(condition.operator)) {
    return null;
  }

  if (condition.operator === 'regex') {
    const regexInvalid = condition.value != null && condition.value !== '' && !compileConditionRegex(condition.value, condition.flags);
    return (
      <div className={style['visible-when-regex']}>
        <Flex gap={8}>
          <Input prefix="/" suffix="/" status={regexInvalid ? 'error' : undefined} value={condition.value ?? ''} placeholder={formatMessage({ id: 'visibleWhenValue' })} onChange={e => onChange({ value: e.target.value })} />
          <Select
            mode="multiple"
            className={style['visible-when-flags']}
            placeholder={formatMessage({ id: 'visibleWhenRegexFlags' })}
            value={String(condition.flags || '')
              .split('')
              .filter(Boolean)}
            options={ALLOWED_REGEX_FLAGS.map(flag => ({ value: flag, label: formatMessage({ id: `visibleWhenRegexFlag_${flag}` }) }))}
            optionLabelProp="value"
            onChange={flags => onChange({ flags: flags.join('') })}
          />
        </Flex>
        {regexInvalid ? <Text type="danger">{formatMessage({ id: 'visibleWhenRegexInvalid' })}</Text> : null}
        <RegexTester condition={condition} />
      </div>
    );
  }

  if (kind === 'boolean') {
    return (
      <Select
        className={style['visible-when-value']}
        value={condition.value}
        placeholder={formatMessage({ id: 'visibleWhenValue' })}
        options={[
          { value: true, label: formatMessage({ id: 'conditionValueTrue' }) },
          { value: false, label: formatMessage({ id: 'conditionValueFalse' }) }
        ]}
        onChange={value => onChange({ value })}
      />
    );
  }

  if (kind === 'options' || kind === 'multiOptions') {
    const multiple = MULTI_VALUE_OPERATORS.includes(condition.operator);
    const options = (trigger?.props?.options || []).filter(item => item?.value != null && item.value !== '').map(item => ({ value: item.value, label: resolveLocaleText(item.label, locale) || String(item.value) }));
    const value = multiple ? (Array.isArray(condition.value) ? condition.value : condition.value != null ? [condition.value] : []) : Array.isArray(condition.value) ? condition.value[0] : condition.value;
    return (
      <Select
        className={style['visible-when-value']}
        // 远程数据源没有静态选项时允许手动输入值
        mode={options.length ? (multiple ? 'multiple' : undefined) : 'tags'}
        value={value}
        placeholder={formatMessage({ id: 'visibleWhenValue' })}
        options={options}
        onChange={next => onChange({ value: !options.length && !multiple && Array.isArray(next) ? next[next.length - 1] : next })}
      />
    );
  }

  if (kind === 'number') {
    return <InputNumber className={style['visible-when-value']} value={condition.value ?? null} placeholder={formatMessage({ id: 'visibleWhenValue' })} onChange={value => onChange({ value: value ?? undefined })} />;
  }

  return <Input className={style['visible-when-value']} value={condition.value ?? ''} placeholder={formatMessage({ id: 'visibleWhenValue' })} onChange={e => onChange({ value: e.target.value })} />;
};

/**
 * 条件显示配置（受控）：value 为 visibleWhen 草稿或 undefined
 * triggerFields：collectConditionFields 中可作为触发项的字段；scope：当前字段所在模块
 */
const VisibleWhenEditor = ({ value, onChange, schema, triggerFields = [], scope, fieldId }) => {
  const { formatMessage, locale } = useIntl();
  const { formData } = useFormContext() || {};
  const selfPath = getFieldConditionPath(scope, formData?.name ? String(formData.name).trim() : '');

  const candidates = useMemo(
    () =>
      triggerFields
        .filter(item => item.id !== fieldId && item.path !== selfPath)
        .map(item => ({
          ...item,
          disabled: selfPath ? wouldCreateCycle(schema, selfPath, item.path) : false
        })),
    [triggerFields, fieldId, selfPath, schema]
  );

  if (scope?.inList) {
    return (
      <FormInfo
        title={formatMessage({ id: 'visibleWhenTitle' })}
        column={1}
        list={[
          <div key="unsupported" block>
            <Text type="secondary">{formatMessage({ id: 'visibleWhenListUnsupported' })}</Text>
          </div>
        ]}
      />
    );
  }

  const enabled = !!value;
  const conditions = value?.conditions || [];
  const updateConditions = next => onChange({ ...value, conditions: next });
  const updateCondition = (index, patch) => updateConditions(conditions.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)));

  const body = (
    <div key="visible-when" block className={style['visible-when-editor']}>
      <Flex gap={8} align="center">
        <Switch size="small" checked={enabled} disabled={!enabled && !candidates.length} onChange={checked => onChange(checked ? { logic: 'and', conditions: [createCondition()] } : undefined)} />
        <Text>{formatMessage({ id: 'visibleWhenEnable' })}</Text>
      </Flex>
      <Text type="secondary" className={style['visible-when-hint']}>
        {formatMessage({ id: candidates.length || enabled ? 'visibleWhenEnableTips' : 'visibleWhenNoTrigger' })}
      </Text>
      {enabled ? (
        <>
          {conditions.length > 1 ? (
            <Flex gap={8} align="center">
              <Text>{formatMessage({ id: 'visibleWhenLogic' })}</Text>
              <Radio.Group
                size="small"
                value={value.logic === 'or' ? 'or' : 'and'}
                options={['and', 'or'].map(logic => ({ value: logic, label: formatMessage({ id: `conditionLogic_${logic}` }) }))}
                onChange={e => onChange({ ...value, logic: e.target.value })}
              />
            </Flex>
          ) : null}
          <div className={style['visible-when-list']}>
            {conditions.map((condition, index) => {
              const trigger = triggerFields.find(item => item.path === condition.field)?.field;
              const operators = trigger ? getConditionOperators(trigger, getFieldDefinition(trigger.type)) : [];
              return (
                <Flex key={index} gap={8} align="start" className={style['visible-when-row']}>
                  <div className={style['visible-when-row-main']}>
                    <Flex gap={8} wrap>
                      <Select
                        showSearch
                        optionFilterProp="label"
                        className={style['visible-when-field']}
                        status={condition.field && !trigger ? 'error' : undefined}
                        value={condition.field}
                        placeholder={formatMessage({ id: 'visibleWhenField' })}
                        options={candidates.map(item => ({
                          value: item.path,
                          disabled: item.disabled,
                          label: `${resolveLocaleText(item.field.label, locale) || item.field.name}（${item.path}）`
                        }))}
                        onChange={path => {
                          const nextTrigger = triggerFields.find(item => item.path === path)?.field;
                          const nextOperators = getConditionOperators(nextTrigger, getFieldDefinition(nextTrigger?.type));
                          updateCondition(index, { field: path, operator: nextOperators[0], value: undefined, flags: undefined });
                        }}
                      />
                      <Select
                        className={style['visible-when-operator']}
                        value={condition.operator}
                        disabled={!trigger}
                        placeholder={formatMessage({ id: 'visibleWhenOperator' })}
                        options={operators.map(operator => ({ value: operator, label: formatMessage({ id: `conditionOperator_${operator}` }) }))}
                        onChange={operator => updateCondition(index, { operator, value: undefined, flags: undefined })}
                      />
                    </Flex>
                    {trigger && condition.operator ? <ConditionValueInput condition={condition} trigger={trigger} onChange={patch => updateCondition(index, patch)} /> : null}
                  </div>
                  <Button
                    type="text"
                    danger
                    className={style['icon-square-btn-sm']}
                    icon={<DeleteOutlined />}
                    onClick={() => {
                      const next = conditions.filter((_, itemIndex) => itemIndex !== index);
                      onChange(next.length ? { ...value, conditions: next } : undefined);
                    }}
                  />
                </Flex>
              );
            })}
          </div>
          <Button type="dashed" block icon={<PlusOutlined />} onClick={() => updateConditions([...conditions, createCondition()])}>
            {formatMessage({ id: 'visibleWhenAddCondition' })}
          </Button>
        </>
      ) : null}
    </div>
  );

  return <FormInfo title={formatMessage({ id: 'visibleWhenTitle' })} column={1} list={[body]} />;
};

export default VisibleWhenEditor;
