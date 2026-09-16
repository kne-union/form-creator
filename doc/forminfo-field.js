const { default: FormCreator, defaultSchema, createBlock, createField } = _FormCreator;
const { default: FormInfo, FormModal, Input, hooks } = _FormInfo;
const { useState } = React;
const { Alert, Button, Space, Typography } = antd;
const { Text, Paragraph } = Typography;
const { useDecorator } = hooks;

/**
 * 业务侧常见写法：把 FormCreator 用 form-info 的 useDecorator 包成表单字段，
 * 再放进 FormModal / FormInfo。外层 Part（常 no-title）会套住内层 Schema 的 FormInfo Part，
 * InfoPage 会把内层标题渲染成「二级标签」胶囊样式。
 */
const FormCreatorField = props => {
  const render = useDecorator(Object.assign({ block: true }, props));
  return render(FormCreator);
};

const demoSchema = {
  ...defaultSchema(),
  blocks: [
    createBlock('formInfo', {
      title: '在校时间',
      bordered: true,
      column: 2,
      list: [
        createField({
          type: 'TextArea',
          name: 'multiLine',
          label: '多行文本',
          block: true,
          props: { placeholder: '请输入多行文本', rows: 3 }
        }),
        createField({
          type: 'Input',
          name: 'decimal',
          label: '小数点保留两位',
          props: { placeholder: '请输入小数点保留两位' }
        }),
        createField({
          type: 'Switch',
          name: 'enabled',
          label: '开关'
        }),
        createField({
          type: 'Select',
          name: 'select',
          label: '下拉选择',
          props: {
            placeholder: '请选择下拉选择',
            options: [
              { label: '选项 A', value: 'a' },
              { label: '选项 B', value: 'b' }
            ]
          }
        })
      ]
    })
  ]
};

const FormInfoFieldExample = () => {
  const [open, setOpen] = useState(false);
  const [schema, setSchema] = useState(demoSchema);

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Alert
        type="warning"
        showIcon
        message="嵌套 Part：顶层模块自动重设一级标题"
        description={
          <div>
            <Paragraph style={{ marginBottom: 8 }}>
              业务里用 <Text code>FormModal</Text> + <Text code>FormInfo</Text> 包一层，再把 <Text code>FormCreator</Text>{' '}
              用 <Text code>useDecorator</Text> 做成字段时，外层 Part 会让内层模块标题变成二级胶囊。
            </Paragraph>
            <Paragraph style={{ marginBottom: 0 }}>
              Schema 顶层模块会自动挂上 <Text code>InfoPage.partRootClassName</Text>
              ，标题从一级色条重新起算；模块内再嵌套仍为二级。
            </Paragraph>
          </div>
        }
      />
      <Button type="primary" onClick={() => setOpen(true)}>
        打开业务弹窗（FormCreator 作字段）
      </Button>
      <FormModal
        title="编辑表单配置"
        open={open}
        onCancel={() => setOpen(false)}
        width={960}
        formProps={{
          data: { name: '示例项目', schema },
          onSubmit: data => {
            setSchema(data.schema || demoSchema);
            return true;
          }
        }}
      >
        {/* 无 title → Part.no-title，内层 Schema 的 FormInfo 标题会走 InfoPage 二级标签样式 */}
        <FormInfo
          column={1}
          list={[
            <Input key="name" name="name" label="配置名称" rule="REQ" />,
            <FormCreatorField key="schema" name="schema" label="表单搭建" block />
          ]}
        />
      </FormModal>
    </Space>
  );
};

render(<FormInfoFieldExample />);
