import { preset as applyFormAntdPreset, RULES } from '@kne/react-form-antd';
import { registerField } from './fieldRegistry';
import { registerRulePreset } from './rulePresets';

/**
 * 统一注册扩展规则与填写项：运行时校验 + 编辑器规则面板 + 字段类型 registry。
 * 应用入口调用一次即可，FormCreator / SchemaRenderer 共用。
 */
export const preset = ({ rules = {}, fields = {} } = {}) => {
  const runtimeRules = { ...RULES };

  Object.entries(rules).forEach(([value, def]) => {
    if (def == null) {
      return;
    }

    if (typeof def === 'function') {
      registerRulePreset({ value, label: value });
      runtimeRules[value] = def;
      return;
    }

    const { label, validator, ...ruleBody } = def;
    if (label) {
      registerRulePreset({ value, label });
    }

    if (typeof validator === 'function') {
      runtimeRules[value] = validator;
    } else if (Object.keys(ruleBody).length) {
      runtimeRules[value] = ruleBody;
    }
  });

  applyFormAntdPreset({ rules: runtimeRules });

  Object.entries(fields).forEach(([type, definition]) => {
    registerField(type, definition);
  });
};
