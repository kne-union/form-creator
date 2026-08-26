# form-creator

### 描述

配置式表单搭建组件，产出 Schema 并用 @kne/form-info 渲染

### 安装

```shell
npm i --save @kne/form-creator
```

### 概述

配置式表单搭建组件：通过字段列表 UI 产出 Schema，并用 `@kne/form-info` 实时预览与运行时渲染。


### 示例

#### 示例样式

```scss
@use '~@kne/responsive-utils/scss' as resp;

@include resp.mobile-container {
  .example-driver-runner {
    padding: 12px 16px 24px;
    box-sizing: border-box;
  }
}
```

#### 示例代码

- 配置式表单搭建(全屏)
- 通过字段列表添加/编辑/排序字段，右侧实时预览 form-info 渲染结果，并导出 Schema JSON
- _FormCreator(@kne/current-lib_form-creator)[import * as _FormCreator from "@kne/form-creator"],(@kne/current-lib_form-creator/dist/index.css)[import "@kne/form-creator/dist/index.css"],_JsonView(@kne/json-view)[import * as _JsonView from "@kne/json-view"],(@kne/json-view/dist/index.css)[import "@kne/json-view/dist/index.css"],antd(antd)[import antd from "antd"],_FormInfo(@kne/form-info)[import * as _FormInfo from "@kne/form-info"]

```jsx
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

```

- Schema 直接渲染表单
- 传入已有 Schema，用 SchemaRenderer 直接展示可提交表单（运行时，不经过编辑器）
- _FormCreator(@kne/current-lib_form-creator)[import * as _FormCreator from "@kne/form-creator"],(@kne/current-lib_form-creator/dist/index.css)[import "@kne/form-creator/dist/index.css"],_JsonView(@kne/json-view)[import * as _JsonView from "@kne/json-view"],(@kne/json-view/dist/index.css)[import "@kne/json-view/dist/index.css"],antd(antd)[import antd from "antd"]

```jsx
const { SchemaRenderer, createBlock, createField } = _FormCreator;
const { default: JsonView } = _JsonView;
const { useState } = React;
const { Alert, Space, Typography } = antd;
const { Text } = Typography;

const demoSchema = {
  actions: {
    showSubmit: true,
    showReset: true,
    submitText: '提交报名',
    resetText: '清空'
  },
  blocks: [
    createBlock('formInfo', {
      title: '员工信息',
      subtitle: '传入 Schema，用 SchemaRenderer 直接渲染表单',
      column: 2,
      list: [
        createField({
          type: 'Input',
          name: 'name',
          label: '姓名',
          rule: 'REQ',
          props: { placeholder: '请输入姓名' }
        }),
        createField({
          type: 'Input',
          name: 'mobile',
          label: '手机号',
          rule: 'REQ TEL',
          props: { placeholder: '请输入手机号' }
        }),
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
        createField({
          type: 'DatePicker',
          name: 'joinDate',
          label: '入职日期',
          props: { placeholder: '请选择日期' }
        }),
        createField({
          type: 'TextArea',
          name: 'remark',
          label: '备注',
          block: true,
          description: '选填',
          props: { rows: 3, placeholder: '补充说明' }
        })
      ]
    })
  ]
};

const SchemaRenderExample = () => {
  const [result, setResult] = useState(null);

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Alert
        type="info"
        showIcon
        message="运行时渲染"
        description={
          <span>
            业务侧 Schema 可带 <Text code>actions</Text>（FormCreator 左侧可配）。SchemaRenderer 会识别并居中渲染提交
            / 重置；也可用组件 props 覆盖。
          </span>
        }
      />
      <JsonView data={demoSchema} theme="light" collapsedFrom={2} searchable={false} />
      <SchemaRenderer
        schema={demoSchema}
        formProps={{
          onSubmit: data => setResult(data)
        }}
      />
      {result ? <JsonView data={result} theme="light" collapsedFrom={2} searchable={false} /> : null}
    </Space>
  );
};

render(<SchemaRenderExample />);

```

- 扩展组件与校验规则
- 通过 registerField 扩展填写项，通过 preset + registerRulePreset 扩展运行时校验与规则勾选面板
- _FormCreator(@kne/current-lib_form-creator)[import * as _FormCreator from "@kne/form-creator"],(@kne/current-lib_form-creator/dist/index.css)[import "@kne/form-creator/dist/index.css"],_ReactFormAntd(@kne/react-form-antd)[import * as _ReactFormAntd from "@kne/react-form-antd"],_JsonView(@kne/json-view)[import * as _JsonView from "@kne/json-view"],(@kne/json-view/dist/index.css)[import "@kne/json-view/dist/index.css"],antd(antd)[import antd from "antd"]

```jsx
const {
  default: FormCreator,
  registerField,
  registerRulePreset,
  defaultSchema,
  createBlock,
  createField
} = _FormCreator;
const { Rate, Slider, preset, RULES } = _ReactFormAntd;
const { default: JsonView } = _JsonView;
const { useState } = React;
const { Alert, Typography, Space } = antd;
const { Text, Paragraph } = Typography;

// 1) 用 react-form-antd preset 注册运行时校验规则
preset({
  rules: Object.assign({}, RULES, {
    // 身份证号（简化示例）
    ID_CARD: {
      reg: /^\d{17}[\dXx]$/,
      message: '%s格式不正确'
    },
    // 评分至少 3 星
    RATE_MIN: value => {
      const score = Number(value) || 0;
      return {
        result: score >= 3,
        errMsg: score >= 3 ? '' : '评分至少 3 星'
      };
    }
  })
});

// 2) 同步注册到 form-creator 规则勾选面板
registerRulePreset({ value: 'ID_CARD', label: '身份证格式' });
registerRulePreset({ value: 'RATE_MIN', label: '评分至少3星' });

// 3) 扩展自定义填写项：用 propsSchema 声明可编辑的额外参数
registerField('Rate', {
  label: '评分',
  groupName: '评价组件',
  component: Rate,
  defaultProps: { count: 5, allowHalf: false, allowClear: true },
  propsSchema: [
    {
      name: 'count',
      label: '星星总数',
      type: 'number',
      min: 1,
      max: 10,
      defaultValue: 5
    },
    {
      name: 'allowHalf',
      label: '允许半星',
      type: 'boolean',
      defaultValue: false
    },
    {
      name: 'allowClear',
      label: '允许清除',
      type: 'boolean',
      defaultValue: true
    }
  ]
});

registerField('Slider', {
  label: '滑块',
  component: Slider,
  defaultProps: { min: 0, max: 100, step: 1 },
  propsSchema: [
    { name: 'min', label: '最小值', type: 'number', defaultValue: 0 },
    { name: 'max', label: '最大值', type: 'number', defaultValue: 100 },
    { name: 'step', label: '步长', type: 'number', min: 0, defaultValue: 1 },
    {
      name: 'tooltipPlacement',
      label: '提示位置',
      type: 'select',
      defaultValue: 'top',
      options: [
        { label: '上', value: 'top' },
        { label: '下', value: 'bottom' },
        { label: '左', value: 'left' },
        { label: '右', value: 'right' }
      ]
    },
    { name: 'dots', label: '显示刻度点', type: 'boolean', defaultValue: false }
  ]
});

const PresetExtendExample = () => {
  const [schema, setSchema] = useState(() => ({
    ...defaultSchema(),
    blocks: [
      createBlock('formInfo', {
        title: '扩展字段与校验',
        subtitle: '演示 registerField + preset rules + registerRulePreset',
        column: 2,
        list: [
          createField({
            type: 'Input',
            name: 'idCard',
            label: '身份证号',
            rule: 'REQ ID_CARD',
            tips: '已通过 preset 注册 ID_CARD 规则',
            props: { placeholder: '请输入18位身份证号' }
          }),
          createField({
            type: 'Rate',
            name: 'score',
            label: '满意度',
            rule: 'REQ RATE_MIN',
            description: '自定义 Rate 字段，规则要求至少 3 星',
            props: { count: 5, allowHalf: false, allowClear: true }
          }),
          createField({
            type: 'Slider',
            name: 'progress',
            label: '完成度',
            block: true,
            props: { min: 0, max: 100, step: 5, dots: true }
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
        message="扩展方式"
        description={
          <div>
            <Paragraph style={{ marginBottom: 4 }}>
              1. <Text code>{'preset({ rules })'}</Text>：注册运行时校验（@kne/react-form-antd）
            </Paragraph>
            <Paragraph style={{ marginBottom: 4 }}>
              2. <Text code>registerRulePreset</Text>：把规则挂到「填写规则」勾选面板
            </Paragraph>
            <Paragraph style={{ marginBottom: 0 }}>
              3. <Text code>registerField</Text>：扩展填写项；可用 <Text code>groupName</Text> 自定义分组，并用 <Text code>propsSchema</Text> 声明额外参数
            </Paragraph>
          </div>
        }
      />
      <FormCreator value={schema} onChange={setSchema} />
      <JsonView data={schema} theme="light" collapsedFrom={2} searchable={false} />
    </Space>
  );
};

render(<PresetExtendExample />);

```

### API

| 属性 | 类型 | 默认值 | 说明 |
|----|----|-----|----|
| value | object | - | 受控 Schema |
| defaultValue | object | - | 非受控初始 Schema |
| onChange | function(schema) | - | Schema 变更回调 |
| showPreview | boolean | true | 是否显示右侧预览 |
| className | string | - | 根节点类名 |
| formProps | object | {} | 透传给预览区 Form / FormSteps 的属性 |
| renderModal | function(props) | - | 自定义编辑弹窗渲染，透传给内部 FormModal（同 super-select / form-info） |

#### SchemaRenderer

传入 Schema 直接渲染可填写表单（运行时，不经过编辑器）。示例见「Schema 直接渲染表单」。

| 属性 | 类型 | 默认值 | 说明 |
|----|----|-----|----|
| schema | object | - | 表单 Schema |
| formProps | object | {} | 透传给内部 `Form`（如 `onSubmit`、`data`） |
| preview | boolean | false | 预览态（字段预览行为） |
| className | string | - | 根 Form 类名 |
| children | ReactNode | - | 追加到表单内容与操作区之间 |
| showActions | boolean | true | 是否展示提交/重置操作区（默认开启，可不传） |
| actions | ReactNode \| false | - | 自定义操作区；不传则按 Schema `actions` / 默认居中「提交/重置」；`false` 隐藏 |
| showSubmit | boolean | - | 覆盖 Schema；不传则读 `schema.actions.showSubmit`（默认 true） |
| showReset | boolean | - | 覆盖 Schema；不传则读 `schema.actions.showReset`（默认 true） |
| submitText | string | - | 覆盖 Schema；不传则读 `schema.actions.submitText` 或「提交」 |
| resetText | string | - | 覆盖 Schema；不传则读 `schema.actions.resetText` 或「重置」 |
| submitButtonProps | object | - | 与 Schema 合并后透传给 `SubmitButton` |
| resetButtonProps | object | - | 与 Schema 合并后透传给 `ResetButton` |

```js
import { SchemaRenderer } from '@kne/form-creator';

// 默认居中提交 / 重置
<SchemaRenderer schema={schema} formProps={{ onSubmit: console.log }} />

// 定制文案与按钮属性
<SchemaRenderer
  schema={schema}
  submitText="保存"
  resetText="清空"
  submitButtonProps={{ size: 'large' }}
  formProps={{ onSubmit: console.log }}
/>

// 完全自定义操作区
<SchemaRenderer schema={schema} actions={<MyButtons />} />

// 不显示操作按钮
<SchemaRenderer schema={schema} showActions={false} />
// 或
<SchemaRenderer schema={schema} actions={false} />
```

#### SchemaRendererInner

只渲染 Schema 区块内容，**不包外层 Form**，便于放入业务已有 `Form` 内。操作区相关 props 与 `SchemaRenderer` 相同。

| 属性 | 类型 | 默认值 | 说明 |
|----|----|-----|----|
| schema | object | - | 表单 Schema |
| preview | boolean | false | 预览态 |
| className | string | - | 包在表单区块外层的 className（可选） |
| children | ReactNode | - | 追加内容 |
| showActions | boolean | true | 是否展示提交/重置操作区（默认开启，可不传） |
| actions / showSubmit / showReset / submitText / resetText / \*ButtonProps | - | - | 同 SchemaRenderer |

```js
import { SchemaRendererInner } from '@kne/form-creator';
import { Form, SubmitButton } from '@kne/form-info';

<Form onSubmit={console.log}>
  <SchemaRendererInner schema={schema} />
</Form>

// 不展示按钮区，自行放按钮
<Form onSubmit={console.log}>
  <SchemaRendererInner schema={schema} showActions={false} />
  <SubmitButton>提交</SubmitButton>
</Form>
```

#### Schema 结构

```js
{
  actions?: {
    showSubmit?: boolean,   // 默认 true
    showReset?: boolean,    // 默认 true
    showCancel?: boolean,   // 默认 false（可选取消按钮）
    submitText?: string,    // 空则用「提交」
    resetText?: string,     // 空则用「重置」
    cancelText?: string,    // 空则用「取消」
    align?: 'center' | 'start' | 'end', // 默认 center
    gap?: number,           // 按钮间距，默认 16
    submitButtonProps?: object,
    resetButtonProps?: object,
    cancelButtonProps?: object
  },
  blocks: [{
    id: string,
    kind: 'formInfo' | 'list' | 'tableList' | 'multiField' | 'steps',
    title?, subtitle?, column?, gap?, bordered?, important?,
    name?, label?, addText?, maxLength?, minLength?, fieldType?, autoStep?,
    list?: [{ id, type, name, label, tips?, description?, rule?, block?, hidden?, props? }],
    items?: [{ id, title, column, list: [...] }] // steps 专用
  }]
}
```

`actions` 由 FormCreator 顶部「添加模块」旁的设置按钮弹窗配置，写入 Schema；`SchemaRenderer` 会读取并渲染居中操作按钮（组件 props 可覆盖 Schema）。
#### 区块类型

| kind | 说明 | 主要参数 |
|------|------|----------|
| formInfo | 表单信息区块 | title, subtitle, column, gap, bordered, list |
| list | 动态列表 | name, title, important, bordered, maxLength, list |
| tableList | 表格列表 | name, title, bordered, maxLength, list |
| multiField | 同类型多值 | name, label, fieldType, addText |
| steps | 步骤表单 | title, subtitle, bordered, autoStep, items[{ title, column, list }] |

兼容旧版：若仅有顶层 `list` 且无 `blocks`，会自动迁移为一个 `formInfo` 区块。

#### 字段类型

基础：Input、TextArea、InputNumber、Switch、Checkbox、DatePicker  
选择：Select、RadioGroup、CheckboxGroup、SuperSelect、SuperSelectPlus

#### 工具方法

- `createBlock(kind)` / `createStep()` / `normalizeSchema(schema)`
- `registerField(type, definition)` 扩展字段类型；可用 `groupName` 指定类型下拉分组，不传则归入「扩展字段」；用 `propsSchema` 声明额外参数（`string` / `number` / `boolean` / `select`）
- `registerRulePreset({ value, label })` 扩展「填写规则」勾选面板中的规则项
- `parseRuleString(rule)` / `buildRuleString(config)` 校验规则字符串解析/组装

#### 扩展组件与校验（示例见「扩展组件与校验规则」）

运行时校验由 `@kne/react-form-antd` 的 `preset({ rules })` 注册；勾选面板需同步调用 `registerRulePreset`，否则 Schema 里写了规则名但编辑器勾选不到。

扩展填写项时，用 `propsSchema` 声明可编辑的额外参数（写入字段 `props`），编辑器会按声明自动生成「填写项设置」表单：

```js
registerField('Rate', {
  label: '评分',
  groupName: '评价组件', // 自定义分组；不传则归入「扩展字段」
  component: Rate,
  defaultProps: { count: 5 },
  propsSchema: [
    { name: 'count', label: '星星总数', type: 'number', min: 1, max: 10, defaultValue: 5 }
  ]
});

registerField('Slider', {
  label: '滑块',
  component: Slider,
  defaultProps: { min: 0, max: 100, step: 1 },
  propsSchema: [
    { name: 'min', label: '最小值', type: 'number', defaultValue: 0 },
    { name: 'max', label: '最大值', type: 'number', defaultValue: 100 },
    { name: 'step', label: '步长', type: 'number', min: 0, defaultValue: 1 },
    {
      name: 'tooltipPlacement',
      label: '提示位置',
      type: 'select',
      defaultValue: 'top',
      options: [
        { label: '上', value: 'top' },
        { label: '下', value: 'bottom' }
      ]
    },
    { name: 'dots', label: '显示刻度点', type: 'boolean' }
  ]
});
```

`propsSchema` 项约定：

| 字段 | 说明 |
|------|------|
| name | 写入 `field.props` 的键名 |
| label | 编辑器展示名 |
| type | `string` \| `number` \| `boolean` \| `select` |
| placeholder | 输入提示（string/number/select） |
| defaultValue | 缺省值 |
| min / max | `type=number` 时的范围 |
| options | `type=select` 的选项 `{ label, value }[]` |

有 `propsSchema` 时会自动开启 `hasFieldProps`，无需再手写开关。
