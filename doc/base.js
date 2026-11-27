const {
  default: FormCreator,
  defaultSchema,
  createBlock,
  createField,
  createStep,
  createChoiceOption,
  normalizeSchema
} = _FormCreator;
const {default: JsonView} = _JsonView;
const {createWithRemoteLoader, preset: remoteLoaderPreset} = remoteLoader;
const {useState, useRef} = React;
const {Typography, Button, Space, Alert, message, Modal} = antd;

const {Text} = Typography;

/** 仅在用到 JSONEditor 时声明 components-thirdparty（merge 进全局 remotes，不覆盖 core） */
remoteLoaderPreset({
  remotes: {
    'components-thirdparty': {
      url: 'https://uc.fatalent.cn',
      tpl: '{{url}}/packages/@kne-components/{{remote}}/{{version}}/build',
      remote: 'components-thirdparty',
      defaultVersion: '0.1.64'
    }
  }
});

const SchemaJsonEditor = ({JSONEditorField, initialText, textRef}) => {
  const [text, setText] = useState(initialText);
  return (
    <JSONEditorField
      height={420}
      value={text}
      onChange={next => {
        setText(next);
        textRef.current = next;
      }}
    />
  );
};

const BaseExample = createWithRemoteLoader({
  // JSONEditor.Field：纯 UI（value/onChange）；默认 JSONEditor 是 FormInfo 字段
  // Schema 弹窗用 antd Modal 受控打开（示例页未挂 ModalContextHolder，useModal 会静默无效果）
  modules: ['components-thirdparty:JSONEditor.Field']
})(({remoteModules}) => {
  const [JSONEditorField] = remoteModules;
  const [schemaJsonOpen, setSchemaJsonOpen] = useState(false);
  const schemaJsonTextRef = useRef('');
  const [schemaJsonInitial, setSchemaJsonInitial] = useState('');
  const [schema, setSchema] = useState(() => ({
        ...defaultSchema(),
        actions: {
            showSubmit: true,
            showReset: true,
            showCancel: false,
            submitText: '',
            resetText: '',
            cancelText: '',
            align: 'center',
            gap: 16
        },
        blocks: [
            createBlock('formInfo', {
                title: '基本信息',
                subtitle: '请先填写基础资料',
                column: 2,
                list: [
                    createField({
                        type: 'Input',
                        name: 'name',
                        label: '姓名',
                        rule: 'REQ',
                        tips: '与证件姓名一致',
                        props: {placeholder: '请输入姓名'}
                    }),
                    createField({
                        type: 'Input',
                        name: 'mobile',
                        label: '手机号',
                        rule: 'REQ TEL',
                        props: {placeholder: '请输入手机号'}
                    }),
                    createField({
                        type: 'Select',
                        name: 'gender',
                        label: '性别',
                        rule: 'REQ',
                        props: {
                            placeholder: '请选择',
                            options: [
                                {label: '男', value: 'male'},
                                {label: '女', value: 'female'}
                            ]
                        }
                    }),
                    createField({
                        type: 'DatePicker',
                        name: 'birthday',
                        label: '出生日期',
                        props: {placeholder: '请选择日期'}
                    }),
                    createField({
                        type: 'TextArea',
                        name: 'remark',
                        label: '备注',
                        block: true,
                        description: '选填',
                        props: {rows: 3, placeholder: '补充说明'}
                    }),
                    createField({
                        type: 'RadioGroupOther',
                        name: 'channel',
                        label: '了解渠道',
                        rule: 'REQ',
                        block: true,
                        props: {
                            modern: true,
                            block: true,
                            indexType: 'letter',
                            options: [
                                {label: '招聘网站', value: 'website'},
                                {label: '内部推荐', value: 'referral'},
                                {label: '校园宣讲', value: 'campus'}
                            ],
                            otherProps: {placeholder: '请说明其他渠道'}
                        }
                    }),
                    createField({
                        type: 'CheckboxGroupOther',
                        name: 'benefits',
                        label: '期望福利',
                        block: true,
                        props: {
                            modern: true,
                            block: true,
                            indexType: 'check',
                            options: [
                                {label: '五险一金', value: 'insurance'},
                                {label: '带薪年假', value: 'vacation'},
                                {label: '餐补', value: 'meal'}
                            ],
                            otherOption: {label: '其他福利', value: 'other'},
                            otherProps: {placeholder: '请描述其他福利'}
                        }
                    })
                ]
            }),
            createBlock('list', {
                title: '工作经历',
                name: 'workExperiences',
                addText: '添加工作经历',
                minLength: 1,
                list: [
                    createField({
                        type: 'Input',
                        name: 'company',
                        label: '公司',
                        rule: 'REQ',
                        props: {placeholder: '请输入公司名称'}
                    }),
                    createField({
                        type: 'Input',
                        name: 'title',
                        label: '职位',
                        rule: 'REQ',
                        props: {placeholder: '请输入职位'}
                    }),
                    createField({
                        type: 'DatePicker',
                        name: 'startDate',
                        label: '入职时间',
                        props: {placeholder: '请选择日期'}
                    })
                ]
            }),
            createBlock('tableList', {
                title: '教育经历',
                name: 'educations',
                addText: '添加教育经历',
                list: [
                    createField({
                        type: 'Input',
                        name: 'school',
                        label: '学校',
                        rule: 'REQ',
                        props: {placeholder: '请输入学校'}
                    }),
                    createField({
                        type: 'Input',
                        name: 'major',
                        label: '专业',
                        props: {placeholder: '请输入专业'}
                    }),
                    createField({
                        type: 'Select',
                        name: 'degree',
                        label: '学历',
                        props: {
                            placeholder: '请选择',
                            options: [
                                {label: '本科', value: 'bachelor'},
                                {label: '硕士', value: 'master'},
                                {label: '博士', value: 'doctor'}
                            ]
                        }
                    })
                ]
            }),
            createBlock('editableList', {
                title: '证书资质（行内编辑列表）',
                name: 'certificates',
                addText: '添加证书',
                list: [
                    createField({
                        type: 'Input',
                        name: 'certName',
                        label: '证书名称',
                        rule: 'REQ',
                        props: {placeholder: '请输入证书名称'}
                    }),
                    createField({
                        type: 'DatePicker',
                        name: 'issueDate',
                        label: '获得时间',
                        props: {placeholder: '请选择日期'}
                    })
                ]
            }),
            createBlock('editableList', {
                title: '岗位核心任务（行内编辑列表 + 嵌套）',
                name: 'tasks',
                addText: '添加任务',
                addPosition: 'top',
                minLength: 1,
                list: [
                    createField({
                        type: 'Input',
                        name: 'taskName',
                        label: '任务名称',
                        rule: 'REQ',
                        props: {placeholder: '请输入任务名称'}
                    }),
                    createField({
                        type: 'Select',
                        name: 'frequency',
                        label: '执行频率',
                        props: {
                            placeholder: '请选择',
                            options: [
                                {label: '每天', value: 'daily'},
                                {label: '每周', value: 'weekly'},
                                {label: '每月', value: 'monthly'}
                            ]
                        }
                    })
                ],
                itemBlocks: [
                    createBlock('list', {
                        title: '分析依据',
                        name: 'evidence',
                        addText: '添加依据',
                        list: [
                            createField({
                                type: 'Input',
                                name: 'source',
                                label: '来源',
                                props: {placeholder: '如：JD 原文'}
                            })
                        ]
                    })
                ]
            }),
            createBlock('list', {
                title: '项目经历（含嵌套）',
                name: 'projects',
                addText: '添加项目',
                minLength: 0,
                list: [
                    createField({
                        type: 'Input',
                        name: 'projectName',
                        label: '项目名称',
                        rule: 'REQ',
                        props: {placeholder: '请输入项目名称'}
                    }),
                    createField({
                        type: 'Input',
                        name: 'role',
                        label: '担任角色',
                        props: {placeholder: '如：前端开发'}
                    })
                ],
                itemBlocks: [
                    createBlock('object', {
                        name: 'period',
                        title: '项目周期',
                        column: 2,
                        list: [
                            createField({
                                type: 'DatePicker',
                                name: 'start',
                                label: '开始时间',
                                props: {placeholder: '请选择'}
                            }),
                            createField({
                                type: 'DatePicker',
                                name: 'end',
                                label: '结束时间',
                                props: {placeholder: '请选择'}
                            })
                        ]
                    }),
                    createBlock('list', {
                        title: '项目成果',
                        name: 'achievements',
                        addText: '添加成果',
                        list: [
                            createField({
                                type: 'Input',
                                name: 'content',
                                label: '成果说明',
                                props: {placeholder: '请输入成果'}
                            })
                        ]
                    })
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
                        list: [
                            createField({
                                type: 'Input',
                                name: 'companyName',
                                label: '公司名',
                                rule: 'REQ',
                                props: {placeholder: '公司名称'}
                            }),
                            createField({
                                type: 'Input',
                                name: 'creditCode',
                                label: '信用代码',
                                props: {placeholder: '统一社会信用代码'}
                            })
                        ]
                    }),
                    createChoiceOption({
                        id: 'person',
                        title: '个人',
                        list: [
                            createField({
                                type: 'Input',
                                name: 'idName',
                                label: '姓名',
                                rule: 'REQ',
                                props: {placeholder: '姓名'}
                            }),
                            createField({
                                type: 'Input',
                                name: 'idNo',
                                label: '证件号',
                                props: {placeholder: '证件号码'}
                            })
                        ]
                    }),
                    createChoiceOption({
                        id: 'other',
                        title: '其他',
                        list: [
                            createField({
                                type: 'TextArea',
                                name: 'otherNote',
                                label: '说明',
                                block: true,
                                props: {rows: 3, placeholder: '补充说明'}
                            })
                        ]
                    })
                ]
            }),
            createBlock('choice', {
                title: '兴趣标签',
                mode: 'multiple',
                minLength: 1,
                maxLength: 2,
                selectorName: 'interests',
                selectorInData: true,
                options: [
                    createChoiceOption({
                        id: 'sports',
                        title: '运动',
                        list: [
                            createField({
                                type: 'Input',
                                name: 'sportsNote',
                                label: '擅长项目',
                                props: {placeholder: '如：篮球'}
                            })
                        ]
                    }),
                    createChoiceOption({
                        id: 'music',
                        title: '音乐',
                        list: [
                            createField({
                                type: 'Input',
                                name: 'musicNote',
                                label: '偏好风格',
                                props: {placeholder: '如：古典'}
                            })
                        ]
                    }),
                    createChoiceOption({
                        id: 'reading',
                        title: '阅读',
                        list: [
                            createField({
                                type: 'TextArea',
                                name: 'readingNote',
                                label: '近期书单',
                                block: true,
                                props: {rows: 2, placeholder: '选填'}
                            })
                        ]
                    })
                ]
            }),
            createBlock('multiField', {
                title: '备用联系方式',
                name: 'backupContacts',
                label: '联系方式',
                fieldType: 'Input',
                maxLength: 3,
                minLength: 1
            }),
            createBlock('matrixScale', {
                title: '一天中各项活动的时间占比',
                name: 'timeShare',
                rowTitle: '活动',
                layout: 'options',
                fieldType: 'RadioGroup',
                rule: 'REQ',
                rows: [
                    { label: '工作/学习', name: 'work' },
                    { label: '通勤', name: 'commute' },
                    { label: '休闲娱乐', name: 'leisure' }
                ],
                options: [
                    { label: '几乎没有（0%）', value: 'none' },
                    { label: '少量（1%-20%）', value: 'little' },
                    { label: '约一半（41%-60%）', value: 'half' },
                    { label: '大部分（81%-100%）', value: 'most' }
                ]
            }),
            createBlock('matrixScale', {
                title: '近一周每天的时长（小时）',
                name: 'weekHours',
                rowTitle: '项目',
                layout: 'columns',
                fieldType: 'InputNumber',
                rule: 'REQ',
                rows: [
                    { label: '工作', name: 'work' },
                    { label: '运动', name: 'exercise' }
                ],
                columns: [
                    { label: '周一', name: 'mon' },
                    { label: '周二', name: 'tue' },
                    { label: '周三', name: 'wed' }
                ]
            }),
            createBlock('steps', {
                title: '入职补充信息',
                autoStep: true,
                items: [
                    createStep({
                        title: '账号信息',
                        column: 2,
                        list: [
                            createField({
                                type: 'Input',
                                name: 'email',
                                label: '邮箱',
                                rule: 'REQ EMAIL',
                                props: {placeholder: '请输入邮箱'}
                            }),
                            createField({
                                type: 'Input',
                                name: 'employeeNo',
                                label: '工号',
                                props: {placeholder: '选填'}
                            })
                        ]
                    }),
                    createStep({
                        title: '紧急联系人',
                        column: 2,
                        list: [
                            createField({
                                type: 'Input',
                                name: 'emergencyName',
                                label: '联系人',
                                rule: 'REQ',
                                props: {placeholder: '请输入姓名'}
                            }),
                            createField({
                                type: 'Input',
                                name: 'emergencyMobile',
                                label: '联系电话',
                                rule: 'REQ TEL',
                                props: {placeholder: '请输入手机号'}
                            }),
                            createField({
                                type: 'Select',
                                name: 'emergencyRelation',
                                label: '关系',
                                props: {
                                    placeholder: '请选择',
                                    options: [
                                        {label: '父母', value: 'parent'},
                                        {label: '配偶', value: 'spouse'},
                                        {label: '子女', value: 'child'},
                                        {label: '其他', value: 'other'}
                                    ]
                                }
                            })
                        ]
                    }),
                    createStep({
                        title: '其他说明',
                        column: 1,
                        list: [
                            createField({
                                type: 'TextArea',
                                name: 'onboardNote',
                                label: '补充说明',
                                props: {rows: 3, placeholder: '如有特殊需求请填写'}
                            })
                        ]
                    })
                ]
            })
        ]
    }));

  const handleSchemaJson = () => {
    const initialText = JSON.stringify(schema, null, 2);
    schemaJsonTextRef.current = initialText;
    setSchemaJsonInitial(initialText);
    setSchemaJsonOpen(true);
  };

  const handleCopySchemaJson = () => {
    const text = schemaJsonTextRef.current;
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).then(
        () => message.success('已复制 Schema JSON'),
        () => message.error('复制失败')
      );
    } else {
      message.info(text);
    }
  };

  const handleApplySchemaJson = () => {
    const text = schemaJsonTextRef.current;
    if (!String(text || '').trim()) {
      message.warning('请先编辑 Schema JSON');
      return;
    }
    try {
      setSchema(normalizeSchema(JSON.parse(text)));
      message.success('已应用 Schema');
      setSchemaJsonOpen(false);
    } catch (e) {
      message.error('JSON 无效，请检查后再试');
    }
  };

  return (
    <Space direction="vertical" size={16} style={{width: '100%'}}>
      <Alert
        type="info"
        showIcon
        message="Schema JSON"
        description={
          <span>
            工具栏「Schema JSON」打开弹窗（远程 <Text code>components-thirdparty:JSONEditor.Field</Text>
            ）：「复制」导出当前内容，「应用」把修改写回编辑器（经 <Text code>normalizeSchema</Text>）。
          </span>
        }
      />
      <FormCreator
        value={schema}
        onChange={setSchema}
        extraToolbar={
          <Button size="small" onClick={handleSchemaJson}>
            Schema JSON
          </Button>
        }
      />
      <Modal
        title="Schema JSON"
        open={schemaJsonOpen}
        onCancel={() => setSchemaJsonOpen(false)}
        width={860}
        destroyOnHidden
        footer={
          <Space>
            <Button onClick={() => setSchemaJsonOpen(false)}>取消</Button>
            <Button onClick={handleCopySchemaJson}>复制</Button>
            <Button type="primary" onClick={handleApplySchemaJson}>
              应用
            </Button>
          </Space>
        }
      >
        {schemaJsonOpen ? (
          <SchemaJsonEditor key={schemaJsonInitial} JSONEditorField={JSONEditorField} initialText={schemaJsonInitial} textRef={schemaJsonTextRef} />
        ) : null}
      </Modal>
      <div>
        <JsonView data={schema} theme="light" collapsedFrom={2} searchable={false} />
        <Text type="secondary">
          初始示例已包含表单分组、列表、表格列表、行内编辑列表、列表嵌套、选项切换、多字段、分步、矩阵量表等模块。
        </Text>
      </div>
    </Space>
  );
});

render(<BaseExample />);
