const { default: FormCreator, defaultSchema, createBlock, createField } = _FormCreator;
const { useState } = React;
const { Alert, Space, Typography } = antd;
const { Text } = Typography;

const LockedFieldExample = () => {
  const [schema, setSchema] = useState(() => ({
    ...defaultSchema(),
    blocks: [
      createBlock('formInfo', {
        title: '面试评价',
        column: 1,
        list: [
          createField({
            type: 'RadioGroup',
            name: 'recommendation',
            label: '是否通过',
            rule: 'REQ',
            locked: true,
            props: {
              options: [
                { label: '通过', value: 'pass' },
                { label: '待定', value: 'hold' },
                { label: '不通过', value: 'reject' }
              ]
            }
          }),
          createField({ type: 'InputNumber', name: 'score', label: '综合评分（1-5）', rule: 'REQ', locked: true, props: { min: 1, max: 5 } }),
          createField({ type: 'TextArea', name: 'strengths', label: '优势', block: true, props: { rows: 3 } }),
          createField({ type: 'TextArea', name: 'notes', label: '备注', block: true, props: { rows: 3 } })
        ]
      }),
      createBlock('formInfo', {
        title: '补充信息',
        column: 2,
        list: [createField({ type: 'Input', name: 'expectedSalary', label: '期望薪资', props: { placeholder: '请输入期望薪资' } })]
      })
    ]
  }));

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Alert
        type="info"
        showIcon
        message="固定填写项"
        description={
          <span>
            字段设置 <Text code>locked: true</Text> 后不可编辑、删除或移动，其他字段也不能换到它前面；所在模块（含步骤、选项）不可删除、不可移动。适合「是否通过」「综合评分」这类业务依赖的固定字段。
          </span>
        }
      />
      <FormCreator value={schema} onChange={setSchema} />
    </Space>
  );
};

render(<LockedFieldExample />);
