const {
  default: FormCreator,
  registerField,
  registerRulePreset,
  defaultSchema,
  createBlock,
  createField
} = _FormCreator;
const { Rate, Slider, preset, RULES } = _ReactFormAntd;
const { default: JsonView } = _JsonView;
const { useState } = React;
const { Alert, Typography, Space } = antd;
const { Text, Paragraph } = Typography;

// 1) 用 react-form-antd preset 注册运行时校验规则
preset({
  rules: Object.assign({}, RULES, {
    // 身份证号（简化示例）
    ID_CARD: {
      reg: /^\d{17}[\dXx]$/,
      message: '%s格式不正确'
    },
    // 评分至少 3 星
    RATE_MIN: value => {
      const score = Number(value) || 0;
      return {
        result: score >= 3,
        errMsg: score >= 3 ? '' : '评分至少 3 星'
      };
    }
  })
});

// 2) 同步注册到 form-creator 规则勾选面板
registerRulePreset({ value: 'ID_CARD', label: '身份证格式' });
registerRulePreset({ value: 'RATE_MIN', label: '评分至少3星' });

// 3) 扩展自定义填写项：用 propsSchema 声明可编辑的额外参数
registerField('Rate', {
  label: '评分',
  groupName: '评价组件',
  component: Rate,
  defaultProps: { count: 5, allowHalf: false, allowClear: true },
  propsSchema: [
    {
      name: 'count',
      label: '星星总数',
      type: 'number',
      min: 1,
      max: 10,
      defaultValue: 5
    },
    {
      name: 'allowHalf',
      label: '允许半星',
      type: 'boolean',
      defaultValue: false
    },
    {
      name: 'allowClear',
      label: '允许清除',
      type: 'boolean',
      defaultValue: true
    }
  ]
});

registerField('Slider', {
  label: '滑块',
  component: Slider,
  defaultProps: { min: 0, max: 100, step: 1 },
  propsSchema: [
    { name: 'min', label: '最小值', type: 'number', defaultValue: 0 },
    { name: 'max', label: '最大值', type: 'number', defaultValue: 100 },
    { name: 'step', label: '步长', type: 'number', min: 0, defaultValue: 1 },
    {
      name: 'tooltipPlacement',
      label: '提示位置',
      type: 'select',
      defaultValue: 'top',
      options: [
        { label: '上', value: 'top' },
        { label: '下', value: 'bottom' },
        { label: '左', value: 'left' },
        { label: '右', value: 'right' }
      ]
    },
    { name: 'dots', label: '显示刻度点', type: 'boolean', defaultValue: false }
  ]
});

const PresetExtendExample = () => {
  const [schema, setSchema] = useState(() => ({
    ...defaultSchema(),
    blocks: [
      createBlock('formInfo', {
        title: '扩展字段与校验',
        subtitle: '演示 registerField + preset rules + registerRulePreset',
        column: 2,
        list: [
          createField({
            type: 'Input',
            name: 'idCard',
            label: '身份证号',
            rule: 'REQ ID_CARD',
            tips: '已通过 preset 注册 ID_CARD 规则',
            props: { placeholder: '请输入18位身份证号' }
          }),
          createField({
            type: 'Rate',
            name: 'score',
            label: '满意度',
            rule: 'REQ RATE_MIN',
            description: '自定义 Rate 字段，规则要求至少 3 星',
            props: { count: 5, allowHalf: false, allowClear: true }
          }),
          createField({
            type: 'Slider',
            name: 'progress',
            label: '完成度',
            block: true,
            props: { min: 0, max: 100, step: 5, dots: true }
          })
        ]
      })
    ]
  }));

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Alert
        type="info"
        showIcon
        message="扩展方式"
        description={
          <div>
            <Paragraph style={{ marginBottom: 4 }}>
              1. <Text code>{'preset({ rules })'}</Text>：注册运行时校验（@kne/react-form-antd）
            </Paragraph>
            <Paragraph style={{ marginBottom: 4 }}>
              2. <Text code>registerRulePreset</Text>：把规则挂到「填写规则」勾选面板
            </Paragraph>
            <Paragraph style={{ marginBottom: 0 }}>
              3. <Text code>registerField</Text>：扩展填写项；可用 <Text code>groupName</Text> 自定义分组，并用 <Text code>propsSchema</Text> 声明额外参数
            </Paragraph>
          </div>
        }
      />
      <FormCreator value={schema} onChange={setSchema} />
      <JsonView data={schema} theme="light" collapsedFrom={2} searchable={false} />
    </Space>
  );
};

render(<PresetExtendExample />);
