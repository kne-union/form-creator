const {default: FormCreator, defaultSchema, createBlock, createField, createStep} = _FormCreator;
const {default: JsonView} = _JsonView;
const {useState} = React;
const {Typography} = antd;

const {Text} = Typography;

const BaseExample = () => {
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
            createBlock('multiField', {
                title: '备用联系方式',
                name: 'backupContacts',
                label: '联系方式',
                fieldType: 'Input',
                maxLength: 3,
                minLength: 1
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

    return <div>
        <FormCreator value={schema} onChange={setSchema} />
        <div style={{marginTop: 16}}>
            <JsonView data={schema} theme="light" collapsedFrom={2} searchable={false} />
            <Text type="secondary">初始示例已包含 FormInfo / List / TableList / MultiField / Steps 五种模块。</Text>
        </div>
    </div>;
};

render(<BaseExample />);
