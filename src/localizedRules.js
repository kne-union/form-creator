import { RULES } from '@kne/react-form-antd';

// @kne/react-form 内置规则的错误提示写死中文；在 preset 覆盖前记下原函数，只替换未被业务覆盖的规则
const BUILTIN_RULES = { TEL: RULES.TEL, EMAIL: RULES.EMAIL, LEN: RULES.LEN };

const isBuiltin = name => RULES[name] === BUILTIN_RULES[name];

const lenMessageId = (value, start, end) => {
  if (end === start) {
    return 'ruleErrorLenEqual';
  }
  return String(value ?? '').length < start ? 'ruleErrorLenMin' : 'ruleErrorLenMax';
};

/** 按当前语言生成表单级 rules，传给 Form 覆盖全局同名规则 */
export const createLocalizedRules = formatMessage => {
  if (typeof formatMessage !== 'function') {
    return {};
  }
  const rules = {};
  ['TEL', 'EMAIL'].forEach(name => {
    if (isBuiltin(name)) {
      rules[name] = (...args) => {
        const res = BUILTIN_RULES[name](...args);
        return res.result ? res : { ...res, errMsg: formatMessage({ id: `ruleError${name}` }) };
      };
    }
  });
  if (isBuiltin('LEN')) {
    rules.LEN = (value, start, end) => {
      const res = BUILTIN_RULES.LEN(value, start, end);
      return res.result ? res : { ...res, errMsg: formatMessage({ id: lenMessageId(value, start, end) }, { start, end }) };
    };
  }
  return rules;
};
