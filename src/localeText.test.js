import { isLocaleText, resolveLocaleText, localizeSchema, getLocaleTextValue, setLocaleTextValue, trimLocaleText, localeTextToValue } from './localeText';

describe('localeText', () => {
  test('isLocaleText 只识别语言代码为键的字符串映射', () => {
    expect(isLocaleText({ 'zh-CN': '姓名', 'en-US': 'Name' })).toBe(true);
    expect(isLocaleText({ en: 'Name' })).toBe(true);
    expect(isLocaleText('姓名')).toBe(false);
    expect(isLocaleText({ label: '姓名' })).toBe(false);
    expect(isLocaleText({ 'zh-CN': 1 })).toBe(false);
    expect(isLocaleText([])).toBe(false);
    expect(isLocaleText({})).toBe(false);
  });

  test('resolveLocaleText 按语言回退', () => {
    const text = { 'zh-CN': '姓名', 'en-US': 'Name' };
    expect(resolveLocaleText(text, 'en-US')).toBe('Name');
    expect(resolveLocaleText(text, 'zh-CN')).toBe('姓名');
    expect(resolveLocaleText(text, 'ja-JP')).toBe('姓名');
    expect(resolveLocaleText(text)).toBe('姓名');
    expect(resolveLocaleText({ 'zh-CN': '姓名', 'en-US': '' }, 'en-US')).toBe('姓名');
    expect(resolveLocaleText({ 'en-US': 'Name' }, 'zh-CN')).toBe('Name');
    expect(resolveLocaleText({ 'en-US': 'Name' }, 'ja-JP')).toBe('Name');
    expect(resolveLocaleText({ 'ja-JP': '名前', 'en-US': 'Name' }, 'ja-JP')).toBe('名前');
    expect(resolveLocaleText({ 'ja-JP': '名前' }, 'zh-CN')).toBe('');
    expect(resolveLocaleText('姓名', 'en-US')).toBe('姓名');
  });

  test('localizeSchema 深度解析且不改原对象', () => {
    const schema = {
      title: { 'zh-CN': '问卷', 'en-US': 'Survey' },
      actions: { submitText: { 'zh-CN': '提交', 'en-US': 'Submit' }, showReset: true },
      blocks: [
        {
          kind: 'formInfo',
          list: [
            {
              name: 'gender',
              label: { 'zh-CN': '性别', 'en-US': 'Gender' },
              props: {
                options: [
                  { label: { 'zh-CN': '男', 'en-US': 'Male' }, value: 'male' },
                  { label: '其他', value: 'other' }
                ]
              }
            }
          ]
        }
      ]
    };
    const result = localizeSchema(schema, 'en-US');
    expect(result.title).toBe('Survey');
    expect(result.actions).toEqual({ submitText: 'Submit', showReset: true });
    expect(result.blocks[0].list[0].label).toBe('Gender');
    expect(result.blocks[0].list[0].props.options).toEqual([
      { label: 'Male', value: 'male' },
      { label: '其他', value: 'other' }
    ]);
    expect(schema.title).toEqual({ 'zh-CN': '问卷', 'en-US': 'Survey' });
  });

  test('编辑：只有中文时存字符串，有英文时存对象', () => {
    expect(getLocaleTextValue('姓名', 'zh-CN')).toBe('姓名');
    expect(getLocaleTextValue('姓名', 'en-US')).toBe('');
    expect(setLocaleTextValue('姓名', 'en-US', 'Name')).toEqual({ 'zh-CN': '姓名', 'en-US': 'Name' });
    expect(setLocaleTextValue({ 'zh-CN': '姓名', 'en-US': 'Name' }, 'en-US', '')).toBe('姓名');
    expect(setLocaleTextValue('', 'en-US', 'Name')).toEqual({ 'en-US': 'Name' });
    expect(setLocaleTextValue('姓名', 'zh-CN', '')).toBe('');
  });

  test('trimLocaleText / localeTextToValue', () => {
    expect(trimLocaleText(' 男 ')).toBe('男');
    expect(trimLocaleText({ 'zh-CN': ' 男 ', 'en-US': ' Male ' })).toEqual({ 'zh-CN': '男', 'en-US': 'Male' });
    expect(trimLocaleText({ 'zh-CN': ' 男 ', 'en-US': ' ' })).toBe('男');
    expect(localeTextToValue({ 'zh-CN': '男', 'en-US': 'Male' })).toBe('男');
    expect(localeTextToValue({ 'en-US': 'Male' })).toBe('Male');
    expect(localeTextToValue(' 男 ')).toBe('男');
  });
});
