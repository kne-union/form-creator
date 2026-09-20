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
    createBlock('formInfo', {
      title: '111',
      subtitle: '长题干问卷（用于核对窄栏上下排布）',
      column: 1,
      list: [
        createField({
          type: 'RadioGroup',
          name: 'yearsInRole',
          label: '您在本岗位（人才招聘方向）的工作年限是？（单选题）',
          rule: 'REQ',
          props: {
            inline: true,
            options: [
              { label: 'A. 不到6个月', value: 'lt6m' },
              { label: 'B. 6个月-1年', value: '6m1y' },
              { label: 'C. 1-3年', value: '1to3y' },
              { label: 'D. 3年以上', value: 'gt3y' }
            ]
          }
        }),
        createField({
          type: 'RadioGroup',
          name: 'aiFrequency',
          label: '过去一个月，您使用AI工具（如ChatGPT、Kimi、Copilot、文心一言等）辅助工作的频率是？（单选题）',
          rule: 'REQ',
          props: {
            inline: false,
            options: [
              { label: 'A. 每天都在用', value: 'daily' },
              { label: 'B. 每周几次', value: 'weekly' },
              { label: 'C. 偶尔使用', value: 'rarely' },
              { label: 'D. 几乎不用', value: 'never' }
            ]
          }
        }),
        createField({
          type: 'CheckboxGroup',
          name: 'aiTasks',
          label: '目前您用AI辅助过以下哪些具体工作？（多选题）',
          props: {
            inline: false,
            options: [
              { label: 'A. 撰写或优化职位说明书/JD', value: 'jd' },
              { label: 'H. 其他（请在下方文本框中说明）', value: 'other' }
            ]
          }
        }),
        createField({
          type: 'TextArea',
          name: 'aiTasksOther',
          label: 'H. 其他（请在下方文本框中说明）',
          block: true,
          props: { rows: 2, placeholder: '选填说明' }
        }),
        createField({
          type: 'TextArea',
          name: 'workOpinion',
          label: '您对工作中使用AI工具的整体看法是？（开放题）',
          block: true,
          props: { rows: 3, placeholder: '请输入' }
        })
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
  remark: '可远程办公',
  yearsInRole: 'lt6m',
  aiFrequency: 'daily',
  aiTasks: ['jd', 'other'],
  aiTasksOther: '示例内容',
  workOpinion: '希望团队统一工具与规范，再逐步推广。',
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
            决定。长题干采用 label 在上、值在下。RadioGroup / CheckboxGroup 支持 <Text code>inline</Text>
            （选项是否单行）；示例中「工作年限」为单行，「AI 频率 / 多选」为纵向。右侧窄栏约 480px 用于核对布局。
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
      <Card size="small" title="窄栏预览（模拟弹窗右栏 ~480px）" bordered style={{ maxWidth: 480 }}>
        <SchemaContent schema={demoSchema} data={data} />
      </Card>
    </Space>
  );
};

render(<SchemaContentExample />);
