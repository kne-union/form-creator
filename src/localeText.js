/** 编辑器双语输入支持的语言；首项为基础语言，其它语言缺省时回退到它 */
export const LOCALE_TEXT_LANGUAGES = ['zh-CN', 'en-US'];

export const BASE_LANGUAGE = LOCALE_TEXT_LANGUAGES[0];

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

/** 取文案回退顺序：当前语言之后依次尝试 */
export const FALLBACK_LANGUAGES = ['zh-CN', 'en-US'];

/** 普通字符串原样返回；多语言按 locale → zh-CN → en-US 取第一个有内容的 */
export const resolveLocaleText = (value, locale) => {
  if (!isLocaleText(value)) {
    return value;
  }
  const language = [locale, ...FALLBACK_LANGUAGES].find(key => key && hasText(value[key]));
  return language ? value[language] : '';
};

/** 深度解析 schema（或任意片段）中的多语言文案，返回新对象 */
export const localizeSchema = (value, locale) => {
  if (Array.isArray(value)) {
    return value.map(item => localizeSchema(item, locale));
  }
  if (isLocaleText(value)) {
    return resolveLocaleText(value, locale);
  }
  if (!isPlainObject(value)) {
    return value;
  }
  return Object.keys(value).reduce((result, key) => {
    result[key] = localizeSchema(value[key], locale);
    return result;
  }, {});
};

/** 取某个语言的原始输入值；普通字符串视为基础语言 */
export const getLocaleTextValue = (value, language) => {
  if (isLocaleText(value)) {
    return value[language] || '';
  }
  if (value == null || typeof value === 'object') {
    return '';
  }
  return language === BASE_LANGUAGE ? String(value) : '';
};

/** 只有基础语言时存为字符串，保持与单语言 schema 兼容 */
export const toLocaleText = (map = {}) => {
  const entries = Object.keys(map)
    .filter(key => hasText(map[key]))
    .map(key => [key, map[key]]);
  if (!entries.length) {
    return '';
  }
  if (entries.length === 1 && entries[0][0] === BASE_LANGUAGE) {
    return entries[0][1];
  }
  return Object.fromEntries(entries);
};

export const setLocaleTextValue = (value, language, text) => {
  const map = isLocaleText(value) ? { ...value } : { [BASE_LANGUAGE]: getLocaleTextValue(value, BASE_LANGUAGE) };
  map[language] = text;
  return toLocaleText(map);
};

/** 判断文案（字符串或多语言）是否有内容 */
export const hasLocaleText = value => (isLocaleText(value) ? Object.values(value).some(hasText) : value != null && String(value).trim() !== '');

/** 去除首尾空白；多语言文案逐项处理 */
export const trimLocaleText = value => {
  if (isLocaleText(value)) {
    return toLocaleText(Object.fromEntries(Object.keys(value).map(key => [key, (value[key] || '').trim()])));
  }
  return String(value ?? '').trim();
};

/** 由文案派生数据值时用基础语言，保证各语言下值一致 */
export const localeTextToValue = value => (isLocaleText(value) ? String(resolveLocaleText(value, BASE_LANGUAGE)).trim() : String(value ?? '').trim());
