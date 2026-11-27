const { SchemaRenderer, createBlock, createField, createStep } = _FormCreator;
const { useMemo, useState } = React;
const { Alert, Flex, Segmented, Typography } = antd;
const { Text } = Typography;

const createOnboardingSteps = stepsStyle =>
  createBlock('steps', {
    title: '入职信息登记',
    subtitle: '按步骤完成，每步校验通过后进入下一步',
    stepsStyle,
    items: [
      createStep({
        title: '个人信息',
        column: 2,
        list: [
          createField({ type: 'Input', name: 'name', label: '姓名', rule: 'REQ', props: { placeholder: '请输入姓名' } }),
          createField({ type: 'Input', name: 'mobile', label: '手机号', rule: 'REQ TEL', props: { placeholder: '请输入手机号' } }),
          createField({ type: 'Input', name: 'email', label: '邮箱', rule: 'REQ EMAIL', props: { placeholder: 'name@company.com' } }),
          createField({ type: 'DatePicker', name: 'birthday', label: '出生日期', props: { placeholder: '请选择日期' } })
        ]
      }),
      createStep({
        title: '岗位与入职安排（含所属部门、岗位名称与入职日期确认，请与 HR 沟通后填写）',
        column: 2,
        list: [
          createField({
            type: 'Select',
            name: 'department',
            label: '所属部门',
            rule: 'REQ',
            props: {
              placeholder: '请选择部门',
              options: [
                { label: '产品研发中心', value: 'rd' },
                { label: '市场营销部', value: 'marketing' },
                { label: '人力资源部', value: 'hr' }
              ]
            }
          }),
          createField({ type: 'Input', name: 'position', label: '岗位名称', rule: 'REQ', props: { placeholder: '例如：高级前端工程师' } }),
          createField({ type: 'DatePicker', name: 'joinDate', label: '入职日期', rule: 'REQ', props: { placeholder: '请选择日期' } })
        ]
      }),
      createStep({
        title: '紧急联系人',
        column: 2,
        list: [
          createField({ type: 'Input', name: 'contactName', label: '联系人姓名', rule: 'REQ', props: { placeholder: '请输入姓名' } }),
          createField({ type: 'Input', name: 'contactMobile', label: '联系人电话', rule: 'REQ TEL', props: { placeholder: '请输入手机号' } })
        ]
      }),
      createStep({
        title: '银行卡与薪资账户',
        column: 2,
        list: [
          createField({ type: 'Input', name: 'bankName', label: '开户银行', rule: 'REQ', props: { placeholder: '例如：招商银行上海分行' } }),
          createField({ type: 'Input', name: 'bankAccount', label: '银行卡号', rule: 'REQ', props: { placeholder: '请输入银行卡号' } })
        ]
      }),
      createStep({
        title: '其他说明',
        column: 1,
        list: [createField({ type: 'TextArea', name: 'remark', label: '备注', block: true, props: { rows: 3, placeholder: '如有特殊情况请说明' } })]
      })
    ]
  });

const StepsStyleExample = () => {
  const [stepsStyle, setStepsStyle] = useState('focus');
  const schema = useMemo(
    () => ({
      actions: { showSubmit: true, showReset: true, submitText: '提交登记' },
      blocks: [createOnboardingSteps(stepsStyle)]
    }),
    [stepsStyle]
  );

  return (
    <Flex vertical gap={16}>
      <Alert
        type="info"
        showIcon
        message="步骤展示样式"
        description={
          <span>
            steps 模块通过 <Text code>stepsStyle</Text> 切换导航样式：<Text code>default</Text>（默认）为完整步骤条；
            <Text code>focus</Text> 突出当前步骤标题（长标题自动换行）与分段进度，已完成的进度段可点击回退，适合步骤多、标题长或窄屏场景。编辑器中可在「编辑模块」里配置。
          </span>
        }
      />
      <Segmented
        value={stepsStyle}
        onChange={setStepsStyle}
        options={[
          { label: '聚焦当前步骤（focus）', value: 'focus' },
          { label: '完整步骤条（default）', value: 'default' }
        ]}
      />
      <SchemaRenderer key={stepsStyle} schema={schema} />
    </Flex>
  );
};

render(<StepsStyleExample />);
