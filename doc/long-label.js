const { default: FormCreator, defaultSchema, createBlock, createField, createStep } = _FormCreator;
const { useState } = React;
const { Alert, Space, Typography } = antd;
const { Text } = Typography;

const LongLabelExample = () => {
  const [schema, setSchema] = useState(() => ({
    ...defaultSchema(),
    blocks: [
      createBlock('formInfo', {
        title: '候选人面试综合评价表（适用于技术岗位、产品岗位以及跨部门协作岗位的多轮面试场景）',
        subtitle: '请面试官在面试结束后 24 小时内完成填写，评价结果将同步给招聘负责人、用人部门负责人以及 HRBP 作为录用决策依据',
        column: 2,
        list: [
          createField({
            type: 'RadioGroup',
            name: 'recommendation',
            label: '综合以上所有面试环节的表现，您是否推荐该候选人进入下一轮面试或直接发放录用通知',
            rule: 'REQ',
            locked: true,
            props: {
              options: [
                { label: '强烈推荐，候选人能力明显超出岗位要求，建议尽快推进后续流程', value: 'pass' },
                { label: '待定，需要结合其他面试官意见或补充一轮面试后再做决定', value: 'hold' },
                { label: '不推荐，候选人在核心能力项上与岗位要求存在明显差距', value: 'reject' }
              ]
            }
          }),
          createField({
            type: 'InputNumber',
            name: 'score',
            label: '综合评分（1-5 分，请结合专业能力、沟通表达、文化契合度与成长潜力综合打分）',
            rule: 'REQ',
            locked: true,
            props: { min: 1, max: 5 }
          }),
          createField({
            type: 'Input',
            name: 'expectedSalaryAndAvailableDateAndOtherRemarks',
            label: '候选人期望薪资、最快到岗时间以及其他需要招聘负责人特别关注的事项说明',
            hidden: true,
            props: { placeholder: '例如：期望 35K × 15 薪，最快一个月后到岗，需要确认是否接受出差' }
          }),
          createField({
            type: 'Select',
            name: 'interviewRound',
            label: '本次面试所属轮次（如为加面或交叉面，请选择最接近的轮次并在备注中说明）',
            props: {
              options: [
                { label: '第一轮：业务部门技术或专业能力面试', value: 'first' },
                { label: '第二轮：部门负责人综合面试', value: 'second' },
                { label: '终面：HRBP 与高管联合面试', value: 'final' }
              ]
            }
          }),
          createField({
            type: 'TextArea',
            name: 'strengthsAndWeaknesses',
            label: '请详细描述候选人在本轮面试中展现出的主要优势、明显短板以及对岗位胜任力的整体判断依据',
            block: true,
            props: { rows: 3 }
          })
        ]
      }),
      createBlock('steps', {
        title: '分步骤填写的超长模块标题：第一步填写基础评价，第二步填写补充说明与附件',
        items: [
          createStep({
            title: '第一步：基础评价信息（包括专业能力、沟通表达与团队协作等维度）',
            column: 1,
            list: [createField({ type: 'Input', name: 'stepRemark', label: '对候选人专业能力与过往项目经验真实性的核实情况说明', props: {} })]
          }),
          createStep({
            title: '第二步：补充说明',
            column: 1,
            list: [createField({ type: 'TextArea', name: 'stepNotes', label: '其他补充说明', props: { rows: 2 } })]
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
        message="超长文案"
        description={
          <span>
            模块标题、副标题、字段 label、选项文案、步骤标题均为超长文本，并叠加 <Text code>locked</Text> / <Text code>hidden</Text> / <Text code>block</Text>{' '}
            标签，用于检查编辑器列表与右侧预览的换行、省略与对齐。
          </span>
        }
      />
      <FormCreator value={schema} onChange={setSchema} />
    </Space>
  );
};

render(<LongLabelExample />);
