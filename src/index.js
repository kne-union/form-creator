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
  createChoiceOption,
  normalizeSchema,
  normalizeBlock,
  moveItem,
  isFieldNameUnique,
  collectSchemaFields,
  collectBlockFieldNames,
  updateBlocks,
  mapBlocks,
  findBlock,
  findBlockInTree,
  removeBlockInTree,
  moveBlockInTree,
  hasRenderableContent,
  MAX_BLOCK_DEPTH
} from './schema';
export { getBlockKindOptions, getBlockDefinition, blockToFormValues, formValuesToBlock } from './blockRegistry';
export { getFieldDefinition, getFieldComponent, getFieldTypes, fieldToFormValues, formValuesToField, normalizeOptions, pickFromPropsSchema, applyFromPropsSchema, pickFieldProps } from './fieldRegistry';
export { RULE_PRESET_ITEMS, RULE_LEN_PRESET, getRulePresetItems, parseRuleString, buildRuleString } from './rulePresets';
export { preset } from './preset';
export { SchemaRenderer, SchemaRendererInner, FormCreator };
export default FormCreator;
