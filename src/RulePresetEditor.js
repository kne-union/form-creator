import FormInfo from '@kne/form-info';
import { InputNumber, hooks } from '@kne/react-form-antd';
import { Checkbox } from 'antd';
import { useIntl } from '@kne/react-intl';
import { RULE_LEN_PRESET, RULE_PRESET_ITEMS } from './rulePresets';

const { useOnChange } = hooks;

const RulePresetsGroup = props => {
  const render = useOnChange(props);
  return render(Checkbox.Group);
};
RulePresetsGroup.field = Checkbox.Group;

const RulePresetEditor = ({ column = 1 }) => {
  const { formatMessage } = useIntl();
  const options = [...RULE_PRESET_ITEMS.map(item => ({ label: item.labelId ? formatMessage({ id: item.labelId }) : item.label, value: item.value })), { label: formatMessage({ id: 'ruleLen' }), value: RULE_LEN_PRESET }];

  const list = [
    <RulePresetsGroup key="rulePresets" name="rulePresets" block options={options} />,
    <InputNumber key="lenMin" name="lenMin" label={formatMessage({ id: 'ruleLenMin' })} min={0} display={({ openApi }) => (openApi?.data?.rulePresets || []).includes(RULE_LEN_PRESET)} />,
    <InputNumber key="lenMax" name="lenMax" label={formatMessage({ id: 'ruleLenMax' })} min={0} display={({ openApi }) => (openApi?.data?.rulePresets || []).includes(RULE_LEN_PRESET)} />
  ];

  return <FormInfo title={formatMessage({ id: 'fieldRule' })} subtitle={formatMessage({ id: 'ruleEditorHint' })} column={column} list={list} />;
};

export default RulePresetEditor;
