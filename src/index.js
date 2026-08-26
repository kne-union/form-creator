import './style.module.scss';
import '@kne/form-info/dist/index.css';
import '@kne/info-page/dist/index.css';
import FormCreator from './FormCreator';
import SchemaRenderer, { SchemaRendererInner } from './SchemaRenderer';

export {
  defaultSchema,
  defaultFormActions,
  normalizeFormActions,
  createField,
  createFieldId,
  createBlock,
  createStep,
  normalizeSchema,
  normalizeBlock,
  moveItem,
  isFieldNameUnique,
  collectSchemaFields,
  updateBlocks,
  mapBlocks,
  findBlock,
  hasRenderableContent
} from './schema';
export { getBlockKindOptions, getBlockDefinition, blockToFormValues, formValuesToBlock } from './blockRegistry';
export { registerField, getFieldDefinition, getFieldComponent, getFieldTypes, fieldToFormValues, formValuesToField, normalizeOptions, pickFromPropsSchema, applyFromPropsSchema, pickFieldProps } from './fieldRegistry';
export { RULE_PRESET_ITEMS, RULE_LEN_PRESET, registerRulePreset, getRulePresetItems, parseRuleString, buildRuleString } from './rulePresets';
export { SchemaRenderer, SchemaRendererInner, FormCreator };
export default FormCreator;
