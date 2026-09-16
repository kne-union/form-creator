const { default: FormCreator, defaultSchema, createBlock, createField } = _FormCreator;
const { useState } = React;
const { Radio, Space, Typography, Alert } = antd;

const { Text, Paragraph } = Typography;

const demoSchema = () => ({
  ...defaultSchema(),
  blocks: [
    createBlock('formInfo', {
      title: 'Basic Info',
      column: 2,
      list: [
        createField({
          type: 'Input',
          name: 'name',
          label: 'Name',
          rule: 'REQ'
        }),
        createField({
          type: 'Select',
          name: 'city',
          label: 'City',
          props: {
            options: [
              { label: 'Shanghai', value: 'sh' },
              { label: 'Beijing', value: 'bj' }
            ]
          }
        }),
        createField({
          type: 'DatePicker',
          name: 'birthday',
          label: 'Birthday'
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
 *
 * 注意：扩展字段（Rate/Slider）若曾打开过「preset 扩展」示例，会残留中文 label；
 * 那是全局 registry 污染，不在本示例内重注册（避免热更新循环）。
 */
const LocaleSwitchExample = () => {
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
            Toggle locale, then open <Text code>Edit Field</Text> and check built-in <Text strong>Field Type</Text>{' '}
            groups/options, type tags, and Select/DatePicker placeholders.
          </Paragraph>
        }
      />
      <Radio.Group
        optionType="button"
        buttonStyle="solid"
        value={locale}
        onChange={e => setLocale(e.target.value)}
        options={[
          { label: '中文', value: 'zh-CN' },
          { label: 'English', value: 'en-US' }
        ]}
      />
      <FormCreator key={locale} locale={locale} value={schema} onChange={setSchema} />
    </Space>
  );
};

render(<LocaleSwitchExample />);
