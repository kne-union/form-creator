const { default: FormCreator, defaultSchema, createBlock, createField } = _FormCreator;
const { createWithRemoteLoader } = remoteLoader;
const { useState } = React;
const { Radio, Space, Typography, Alert } = antd;

const { Text, Paragraph } = Typography;

const languages = [
  { value: 'zh-CN', label: '中文' },
  { value: 'en-US', label: 'English' }
];

const demoSchema = () => ({
  ...defaultSchema(),
  blocks: [
    createBlock('formInfo', {
      title: { 'zh-CN': '基本信息', 'en-US': 'Basic Info' },
      column: 2,
      list: [
        createField({
          type: 'Input',
          name: 'name',
          label: { 'zh-CN': '姓名', 'en-US': 'Name' },
          rule: 'REQ'
        }),
        createField({
          type: 'Input',
          name: 'email',
          label: { 'zh-CN': '邮箱', 'en-US': 'Email' },
          rule: 'EMAIL LEN-6-30'
        }),
        createField({
          type: 'Select',
          name: 'city',
          label: { 'zh-CN': '城市', 'en-US': 'City' },
          props: {
            options: [
              { label: { 'zh-CN': '上海', 'en-US': 'Shanghai' }, value: 'sh' },
              { label: { 'zh-CN': '北京', 'en-US': 'Beijing' }, value: 'bj' }
            ]
          }
        }),
        createField({
          type: 'DatePicker',
          name: 'birthday',
          label: { 'zh-CN': '生日', 'en-US': 'Birthday' }
        })
      ]
    })
  ]
});

/**
 * 通过 FormCreator 的 locale prop 切换语言，检查：
 * - 编辑器壳层文案（Add Section / Field Type 等）
 * - 内置 Field Type 分组与选项（Single-line Text / Dropdown）
 * - 左侧列表字段类型 Tag、Select/DatePicker 默认占位
 * - Schema 内多语言文案（{ 'zh-CN', 'en-US' }）随 locale 切换；languages 决定编辑时有哪几栏输入
 * - 内置校验（EMAIL / TEL / LEN）错误提示随 locale 切换
 * - DatePicker 面板等 antd 内置文案由外层 PureGlobal 的 preset.locale 决定
 *
 * 注意：扩展字段（Rate/Slider）若曾打开过「preset 扩展」示例，会残留中文 label；
 * 那是全局 registry 污染，不在本示例内重注册（避免热更新循环）。
 */
const LocaleSwitchExample = createWithRemoteLoader({
  modules: ['components-core:Global@PureGlobal']
})(({ remoteModules }) => {
  const [PureGlobal] = remoteModules;
  const [locale, setLocale] = useState('en-US');
  const [schema, setSchema] = useState(demoSchema);

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Alert
        type="info"
        showIcon
        message="Language switch"
        description={
          <Paragraph style={{ marginBottom: 0 }}>
            Toggle locale, then open <Text code>Edit Field</Text> and check built-in <Text strong>Field Type</Text> groups/options, type tags, and Select/DatePicker placeholders.
          </Paragraph>
        }
      />
      <Radio.Group
        optionType="button"
        buttonStyle="solid"
        value={locale}
        onChange={e => setLocale(e.target.value)}
        options={languages}
      />
      <PureGlobal key={locale} preset={{ locale }}>
        <FormCreator locale={locale} languages={languages} value={schema} onChange={setSchema} />
      </PureGlobal>
    </Space>
  );
});

render(<LocaleSwitchExample />);
