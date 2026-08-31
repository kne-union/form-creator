const { default: FormCreator, defaultSchema, createBlock, createField } = _FormCreator;
const { useState } = React;
const { Alert, Button, Space, Typography, message } = antd;
const { Text } = Typography;

const ExtraToolbarExample = () => {
  const [schema, setSchema] = useState(() => ({
    ...defaultSchema(),
    blocks: [
      createBlock('formInfo', {
        title: '基本信息',
        column: 2,
        list: [
          createField({ type: 'Input', name: 'name', label: '姓名', rule: 'REQ', props: { placeholder: '请输入姓名' } }),
          createField({ type: 'Input', name: 'mobile', label: '手机号', rule: 'REQ TEL', props: { placeholder: '请输入手机号' } })
        ]
      })
    ]
  }));

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Alert
        type="info"
        showIcon
        message="扩展工具栏按钮"
        description={
          <span>
            「添加模块」旁的设置按钮后面可通过 <Text code>extraToolbar</Text> 追加自定义按钮（ReactNode，或
            <Text code>{'({ schema }) => ReactNode'}</Text>）。
          </span>
        }
      />
      <FormCreator
        value={schema}
        onChange={setSchema}
        extraToolbar={
          <Space size={8}>
            <Button
              size="small"
              onClick={() => {
                const text = JSON.stringify(schema, null, 2);
                if (navigator.clipboard?.writeText) {
                  navigator.clipboard.writeText(text).then(() => message.success('已复制 Schema JSON'));
                } else {
                  message.info(text);
                }
              }}
            >
              复制 Schema
            </Button>
            <Button size="small" onClick={() => message.info('这里可以接导入 / 预览等业务逻辑')}>
              导入
            </Button>
          </Space>
        }
      />
    </Space>
  );
};

render(<ExtraToolbarExample />);
