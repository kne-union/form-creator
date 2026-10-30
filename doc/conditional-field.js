const { default: FormCreator, defaultSchema, createBlock, createField, schemaToDataSchema } = _FormCreator;
const { useState } = React;
const { Alert, Collapse, Space, Typography } = antd;
const { Text } = Typography;

const ConditionalFieldExample = () => {
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
            props: {
              options: [
                { label: '通过', value: 'pass' },
                { label: '待定', value: 'hold' },
                { label: '不通过', value: 'reject' }
              ]
            }
          }),
          createField({
            type: 'TextArea',
            name: 'rejectReason',
            label: '不通过原因',
            rule: 'REQ',
            block: true,
            props: { rows: 3 },
            visibleWhen: { logic: 'and', conditions: [{ field: 'recommendation', operator: 'eq', value: 'reject' }] }
          }),
          createField({ type: 'InputNumber', name: 'score', label: '综合评分（1-5）', rule: 'REQ', props: { min: 1, max: 5 } }),
          createField({
            type: 'TextArea',
            name: 'improvement',
            label: '改进建议',
            block: true,
            props: { rows: 3 },
            visibleWhen: { logic: 'and', conditions: [{ field: 'score', operator: 'lte', value: 2 }] }
          }),
          createField({
            type: 'CheckboxGroup',
            name: 'dimensions',
            label: '考察维度',
            props: {
              options: [
                { label: '专业能力', value: 'skill' },
                { label: '沟通表达', value: 'communication' },
                { label: '管理能力', value: 'management' }
              ]
            }
          }),
          createField({
            type: 'InputNumber',
            name: 'teamSize',
            label: '带过的团队规模（人）',
            rule: 'REQ',
            props: { min: 1 },
            visibleWhen: { logic: 'and', conditions: [{ field: 'dimensions', operator: 'includesAny', value: ['management'] }] }
          }),
          createField({ type: 'Input', name: 'interviewerEmail', label: '面试官邮箱' }),
          createField({
            type: 'Input',
            name: 'referrer',
            label: '内部推荐人',
            visibleWhen: { logic: 'and', conditions: [{ field: 'interviewerEmail', operator: 'regex', value: '@leapin\\.ai$', flags: 'i' }] }
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
        message="条件显示"
        description={
          <span>
            字段配置 <Text code>visibleWhen</Text> 后，满足条件才显示：选「不通过」出现「不通过原因」；评分 ≤ 2 出现「改进建议」；考察维度勾选「管理能力」出现「团队规模」；面试官邮箱匹配 <Text code>/@leapin\.ai$/i</Text> 出现「内部推荐人」。隐藏的字段不参与校验，已填的值会被清空。在编辑弹窗的「条件显示」中可修改条件。
          </span>
        }
      />
      <FormCreator value={schema} onChange={setSchema} />
      <Collapse
        items={[
          {
            key: 'data-schema',
            label: 'schemaToDataSchema 输出（条件字段不进 required，description 附条件说明）',
            children: <pre style={{ margin: 0, maxHeight: 360, overflow: 'auto' }}>{JSON.stringify(schemaToDataSchema(schema), null, 2)}</pre>
          }
        ]}
      />
    </Space>
  );
};

render(<ConditionalFieldExample />);
