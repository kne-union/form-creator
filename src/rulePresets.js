export const RULE_PRESET_ITEMS = [
  { value: 'REQ', label: '必填' },
  { value: 'TEL', label: '手机号格式' },
  { value: 'EMAIL', label: '邮箱格式' }
];

export const DEFAULT_RULE_CONFIG = () => ({
  presets: [],
  lenMin: '',
  lenMax: ''
});

export const RULE_LEN_PRESET = 'LEN';

/** 注册填写项校验规则 preset，会在规则勾选面板中展示 */
export const registerRulePreset = item => {
  if (!item?.value) {
    return;
  }
  const index = RULE_PRESET_ITEMS.findIndex(rule => rule.value === item.value);
  const next = {
    value: item.value,
    label: item.label || item.value
  };
  if (index >= 0) {
    RULE_PRESET_ITEMS[index] = next;
  } else {
    RULE_PRESET_ITEMS.push(next);
  }
};

export const getRulePresetItems = () => RULE_PRESET_ITEMS.slice();

export const parseRuleString = rule => {
  const config = DEFAULT_RULE_CONFIG();
  if (!rule) {
    return config;
  }
  const tokens = String(rule).trim().split(/\s+/).filter(Boolean);
  tokens.forEach(token => {
    if (RULE_PRESET_ITEMS.some(item => item.value === token)) {
      config.presets.push(token);
      return;
    }
    const lenMatch = token.match(/^LEN-(\d+)-(\d+)$/);
    if (lenMatch) {
      config.lenMin = lenMatch[1];
      config.lenMax = lenMatch[2];
      config.presets.push('LEN');
    }
  });
  return config;
};

export const buildRuleString = ({ presets = [], lenMin, lenMax } = {}) => {
  const parts = [];
  RULE_PRESET_ITEMS.forEach(item => {
    if (presets.includes(item.value)) {
      parts.push(item.value);
    }
  });
  if (presets.includes('LEN') && lenMin !== '' && lenMax !== '') {
    parts.push(`LEN-${lenMin}-${lenMax}`);
  }
  return parts.join(' ') || undefined;
};
