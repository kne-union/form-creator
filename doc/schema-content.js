const { SchemaRenderer, SchemaContent, createBlock, createField, createChoiceOption } = _FormCreator;
const { useState } = React;
const { Alert, Card, Col, Row, Space, Typography } = antd;
const { Text } = Typography;

const demoSchema = {
  actions: {
    showSubmit: true,
    showReset: true,
    submitText: '提交并展示',
    resetText: '重置'
  },
  blocks: [
    createBlock('formInfo', {
      title: '员工信息',
      subtitle: '提交后按各字段 valueSchema 展示',
      column: 2,
      list: [
        createField({ type: 'Input', name: 'name', label: '姓名', rule: 'REQ', props: { placeholder: '请输入姓名' } }),
        createField({ type: 'Input', name: 'mobile', label: '手机号', rule: 'REQ TEL', props: { placeholder: '请输入手机号' } }),
        createField({
          type: 'Select',
          name: 'gender',
          label: '性别',
          rule: 'REQ',
          props: {
            placeholder: '请选择',
            options: [
              { label: '男', value: 'male' },
              { label: '女', value: 'female' }
            ]
          }
        }),
        createField({ type: 'Switch', name: 'agree', label: '同意协议' }),
        createField({ type: 'DatePicker', name: 'joinDate', label: '入职日期', props: { placeholder: '请选择日期' } }),
        createField({ type: 'TextArea', name: 'remark', label: '备注', block: true, props: { rows: 2, placeholder: '选填' } })
      ]
    }),
    createBlock('list', {
      title: '项目经历',
      name: 'projects',
      addText: '添加项目',
      list: [
        createField({ type: 'Input', name: 'projectName', label: '项目名', rule: 'REQ' }),
        createField({ type: 'Input', name: 'role', label: '角色' })
      ]
    }),
    createBlock('choice', {
      title: '客户类型',
      mode: 'single',
      selectorName: 'customerType',
      selectorInData: true,
      options: [
        createChoiceOption({
          id: 'enterprise',
          title: '企业',
          list: [createField({ type: 'Input', name: 'companyName', label: '公司名', rule: 'REQ' })]
        }),
        createChoiceOption({
          id: 'person',
          title: '个人',
          list: [createField({ type: 'Input', name: 'idName', label: '姓名', rule: 'REQ' })]
        })
      ]
    })
  ]
};

const demoData = {
  name: '张三',
  mobile: '13800138000',
  gender: 'male',
  agree: true,
  joinDate: '2024-03-01',
  remark: '可远程办公',
  projects: [
    { projectName: '招聘门户改版', role: '前端' },
    { projectName: '表单搭建器', role: '全栈' }
  ],
  customerType: 'enterprise',
  companyName: '示例科技有限公司'
};

const SchemaContentExample = () => {
  const [data, setData] = useState(demoData);

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Alert
        type="info"
        showIcon
        message="SchemaContent"
        description={
          <span>
            按搭建 Schema 的分组结构展示提交数据；字段展示形态由各填写项的 <Text code>valueSchema</Text>
            （如 string / number / boolean / enum）决定。布局与 FormInfo 相同，使用 InfoPage.Part + Content。
          </span>
        }
      />
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card size="small" title="填写并提交" bordered>
            <SchemaRenderer
              schema={demoSchema}
              formProps={{
                data: demoData,
                onSubmit: values => setData(values)
              }}
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card size="small" title="数据展示（SchemaContent）" bordered>
            <SchemaContent schema={demoSchema} data={data} />
          </Card>
        </Col>
      </Row>
    </Space>
  );
};

render(<SchemaContentExample />);
