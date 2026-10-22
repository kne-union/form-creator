/** 未传 languages 时，多语言文案按此顺序回退 */
export const DEFAULT_FALLBACK_LANGUAGES = ['zh-CN', 'en-US'];

const LOCALE_KEY = /^[a-z]{2,3}(-[A-Za-z]{2,4})?$/;

const isPlainObject = value => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
};

/** 多语言文案：键全为语言代码、值全为字符串，如 { 'zh-CN': '姓名', 'en-US': 'Name' } */
export const isLocaleText = value => {
  if (!isPlainObject(value)) {
    return false;
  }
  const keys = Object.keys(value);
  return keys.length > 0 && keys.every(key => LOCALE_KEY.test(key) && (value[key] == null || typeof value[key] === 'string'));
};

const hasText = value => typeof value === 'string' && value.trim() !== '';

/** 规范调用方传入的语言列表 [{ value, label }]，丢弃无 value 的项 */
export const normalizeLanguages = languages => (Array.isArray(languages) ? languages : []).filter(item => item && typeof item.value === 'string' && item.value).map(item => ({ value: item.value, label: item.label || item.value }));

const getFallbackLanguages = languages => {
  const list = normalizeLanguages(languages);
  return list.length ? list.map(item => item.value) : DEFAULT_FALLBACK_LANGUAGES;
};

/** 普通字符串原样返回；多语言按 locale → languages 顺序（未传为 zh-CN → en-US）取第一个有内容的 */
export const resolveLocaleText = (value, locale, languages) => {
  if (!isLocaleText(value)) {
    return value;
  }
  const language = [locale, ...getFallbackLanguages(languages)].find(key => key && hasText(value[key]));
  return language ? value[language] : '';
};

/** 深度解析 schema（或任意片段）中的多语言文案，返回新对象 */
export const localizeSchema = (value, locale, languages) => {
  if (Array.isArray(value)) {
    return value.map(item => localizeSchema(item, locale, languages));
  }
  if (isLocaleText(value)) {
    return resolveLocaleText(value, locale, languages);
  }
  if (!isPlainObject(value)) {
    return value;
  }
  return Object.keys(value).reduce((result, key) => {
    result[key] = localizeSchema(value[key], locale, languages);
    return result;
  }, {});
};

/** 取某个语言的原始输入值；普通字符串视为基础语言 */
export const getLocaleTextValue = (value, language, baseLanguage) => {
  if (isLocaleText(value)) {
    return value[language] || '';
  }
  if (value == null || typeof value === 'object') {
    return '';
  }
  return language === baseLanguage ? String(value) : '';
};

/** 只有基础语言时存为字符串，保持与单语言 schema 兼容 */
export const toLocaleText = (map = {}, baseLanguage) => {
  const entries = Object.keys(map)
    .filter(key => hasText(map[key]))
    .map(key => [key, map[key]]);
  if (!entries.length) {
    return '';
  }
  if (entries.length === 1 && entries[0][0] === baseLanguage) {
    return entries[0][1];
  }
  return Object.fromEntries(entries);
};

export const setLocaleTextValue = (value, language, text, baseLanguage) => {
  const map = isLocaleText(value) ? { ...value } : { [baseLanguage]: getLocaleTextValue(value, baseLanguage, baseLanguage) };
  map[language] = text;
  return toLocaleText(map, baseLanguage);
};

/** 判断文案（字符串或多语言）是否有内容 */
export const hasLocaleText = value => (isLocaleText(value) ? Object.values(value).some(hasText) : value != null && String(value).trim() !== '');

/** 去除首尾空白；多语言文案逐项处理 */
export const trimLocaleText = (value, baseLanguage) => {
  if (isLocaleText(value)) {
    return toLocaleText(Object.fromEntries(Object.keys(value).map(key => [key, (value[key] || '').trim()])), baseLanguage);
  }
  return String(value ?? '').trim();
};

/** 由文案派生数据值时用基础语言，保证各语言下值一致；基础语言为空时取第一个有内容的语言 */
export const localeTextToValue = (value, baseLanguage) => {
  if (!isLocaleText(value)) {
    return String(value ?? '').trim();
  }
  const text = resolveLocaleText(value, baseLanguage) || Object.values(value).find(hasText) || '';
  return String(text).trim();
};
