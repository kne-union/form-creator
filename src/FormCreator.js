import { useMemo, useState } from 'react';
import { Empty } from 'antd';
import { useIntl } from '@kne/react-intl';
import { useIsMobile, RESPONSIVE_BOUNDARY_CLASS } from '@kne/responsive-utils';
import withLocale from './withLocale';
import { collectSchemaFields, createBlock, createChoiceOption, createStep, defaultSchema, findBlock, mapBlocks, moveBlockInTree, moveItem, normalizeSchema, hasRenderableContent, removeBlockInTree, updateBlocks } from './schema';
import BlockListPanel from './BlockListPanel';
import BlockEditorModal from './BlockEditorModal';
import StepEditorModal from './StepEditorModal';
import ChoiceOptionEditorModal from './ChoiceOptionEditorModal';
import FieldEditorModal from './FieldEditorModal';
import FormActionsEditor from './FormActionsEditor';
import SchemaRenderer from './SchemaRenderer';
import style from './style.module.scss';

const FormCreator = withLocale(({ value, defaultValue, onChange, showPreview = true, className, formProps, renderModal, extraToolbar }) => {
  const { formatMessage } = useIntl();
  const isMobile = useIsMobile();
  const [innerSchema, setInnerSchema] = useState(() => normalizeSchema(defaultValue || defaultSchema()));
  const [blockEditorOpen, setBlockEditorOpen] = useState(false);
  const [editingBlock, setEditingBlock] = useState(null);
  const [blockParentId, setBlockParentId] = useState(null);
  const [blockParentStepId, setBlockParentStepId] = useState(null);
  const [blockParentOptionId, setBlockParentOptionId] = useState(null);
  const [stepEditorOpen, setStepEditorOpen] = useState(false);
  const [stepContext, setStepContext] = useState(null);
  const [choiceOptionEditorOpen, setChoiceOptionEditorOpen] = useState(false);
  const [choiceOptionContext, setChoiceOptionContext] = useState(null);
  const [fieldEditorOpen, setFieldEditorOpen] = useState(false);
  const [fieldContext, setFieldContext] = useState(null);
  const [editingField, setEditingField] = useState(null);
  const [formActionsOpen, setFormActionsOpen] = useState(false);

  const schema = useMemo(() => normalizeSchema(value ?? innerSchema), [value, innerSchema]);

  const updateSchema = nextSchema => {
    const normalized = normalizeSchema(nextSchema);
    if (value === undefined) {
      setInnerSchema(normalized);
    }
    onChange?.(normalized);
  };

  const clearBlockEditor = () => {
    setBlockEditorOpen(false);
    setEditingBlock(null);
    setBlockParentId(null);
    setBlockParentStepId(null);
    setBlockParentOptionId(null);
  };

  const handleAddBlock = (kind, { parentBlockId, stepId, optionId } = {}) => {
    setEditingBlock(createBlock(kind));
    setBlockParentId(parentBlockId || null);
    setBlockParentStepId(stepId || null);
    setBlockParentOptionId(optionId || null);
    setBlockEditorOpen(true);
  };

  const handleEditBlock = block => {
    setEditingBlock(block);
    setBlockParentId(null);
    setBlockParentStepId(null);
    setBlockParentOptionId(null);
    setBlockEditorOpen(true);
  };

  const handleSaveBlock = block => {
    const exists = !!findBlock(schema, block.id);
    if (exists) {
      updateSchema(mapBlocks(schema, block.id, () => block));
    } else if (blockParentId && blockParentStepId) {
      updateSchema(
        mapBlocks(schema, blockParentId, parent => ({
          ...parent,
          items: (parent.items || []).map(step => (step.id === blockParentStepId ? { ...step, blocks: [...(step.blocks || []), block] } : step))
        }))
      );
    } else if (blockParentId && blockParentOptionId) {
      updateSchema(
        mapBlocks(schema, blockParentId, parent => ({
          ...parent,
          options: (parent.options || []).map(option => (option.id === blockParentOptionId ? { ...option, blocks: [...(option.blocks || []), block] } : option))
        }))
      );
    } else if (blockParentId) {
      updateSchema(
        mapBlocks(schema, blockParentId, parent => {
          if (parent.kind === 'list') {
            return {
              ...parent,
              itemBlocks: [...(parent.itemBlocks || []), block]
            };
          }
          return {
            ...parent,
            blocks: [...(parent.blocks || []), block]
          };
        })
      );
    } else {
      updateSchema({
        ...schema,
        blocks: [...schema.blocks, block]
      });
    }
    clearBlockEditor();
  };

  const handleDeleteBlock = blockId => {
    updateSchema(updateBlocks(schema, blocks => removeBlockInTree(blocks, blockId)));
  };

  const handleMoveBlock = (blockId, direction) => {
    updateSchema(updateBlocks(schema, blocks => moveBlockInTree(blocks, blockId, direction)));
  };

  const handleAddStep = blockId => {
    setStepContext({ blockId, step: createStep() });
    setStepEditorOpen(true);
  };

  const handleEditStep = (blockId, step) => {
    setStepContext({ blockId, step });
    setStepEditorOpen(true);
  };

  const handleSaveStep = step => {
    const { blockId } = stepContext;
    updateSchema(
      mapBlocks(schema, blockId, block => {
        const exists = (block.items || []).some(item => item.id === step.id);
        return {
          ...block,
          items: exists ? block.items.map(item => (item.id === step.id ? step : item)) : [...(block.items || []), step]
        };
      })
    );
    setStepEditorOpen(false);
    setStepContext(null);
  };

  const handleDeleteStep = (blockId, stepId) => {
    updateSchema(
      mapBlocks(schema, blockId, block => ({
        ...block,
        items: (block.items || []).filter(item => item.id !== stepId)
      }))
    );
  };

  const handleMoveStep = (blockId, stepId, direction) => {
    updateSchema(
      mapBlocks(schema, blockId, block => ({
        ...block,
        items: moveItem(block.items || [], stepId, direction)
      }))
    );
  };

  const handleAddChoiceOption = blockId => {
    setChoiceOptionContext({ blockId, option: createChoiceOption() });
    setChoiceOptionEditorOpen(true);
  };

  const handleEditChoiceOption = (blockId, option) => {
    setChoiceOptionContext({ blockId, option });
    setChoiceOptionEditorOpen(true);
  };

  const handleSaveChoiceOption = option => {
    const { blockId } = choiceOptionContext;
    updateSchema(
      mapBlocks(schema, blockId, block => {
        const exists = (block.options || []).some(item => item.id === option.id);
        return {
          ...block,
          options: exists ? block.options.map(item => (item.id === option.id ? option : item)) : [...(block.options || []), option]
        };
      })
    );
    setChoiceOptionEditorOpen(false);
    setChoiceOptionContext(null);
  };

  const handleDeleteChoiceOption = (blockId, optionId) => {
    updateSchema(
      mapBlocks(schema, blockId, block => ({
        ...block,
        options: (block.options || []).filter(item => item.id !== optionId)
      }))
    );
  };

  const handleMoveChoiceOption = (blockId, optionId, direction) => {
    updateSchema(
      mapBlocks(schema, blockId, block => ({
        ...block,
        options: moveItem(block.options || [], optionId, direction)
      }))
    );
  };

  const normalizeFieldScope = scope => {
    if (typeof scope === 'string' || scope == null) {
      return { stepId: scope };
    }
    return scope;
  };

  const handleAddField = (blockId, scope) => {
    setFieldContext({ blockId, ...normalizeFieldScope(scope) });
    setEditingField(null);
    setFieldEditorOpen(true);
  };

  const handleEditField = (blockId, field, scope) => {
    setFieldContext({ blockId, ...normalizeFieldScope(scope) });
    setEditingField(field);
    setFieldEditorOpen(true);
  };

  const handleSaveField = field => {
    const { blockId, stepId, optionId } = fieldContext || {};
    updateSchema(
      mapBlocks(schema, blockId, block => {
        if (block.kind === 'steps') {
          return {
            ...block,
            items: (block.items || []).map(step => {
              if (step.id !== stepId) {
                return step;
              }
              const exists = (step.list || []).some(item => item.id === field.id);
              return {
                ...step,
                list: exists ? step.list.map(item => (item.id === field.id ? field : item)) : [...(step.list || []), field]
              };
            })
          };
        }
        if (block.kind === 'choice') {
          return {
            ...block,
            options: (block.options || []).map(option => {
              if (option.id !== optionId) {
                return option;
              }
              const exists = (option.list || []).some(item => item.id === field.id);
              return {
                ...option,
                list: exists ? option.list.map(item => (item.id === field.id ? field : item)) : [...(option.list || []), field]
              };
            })
          };
        }
        const exists = (block.list || []).some(item => item.id === field.id);
        return {
          ...block,
          list: exists ? block.list.map(item => (item.id === field.id ? field : item)) : [...(block.list || []), field]
        };
      })
    );
    setFieldEditorOpen(false);
    setFieldContext(null);
    setEditingField(null);
  };

  const handleDeleteField = (blockId, fieldId, scope) => {
    const { stepId, optionId } = normalizeFieldScope(scope);
    updateSchema(
      mapBlocks(schema, blockId, block => {
        if (block.kind === 'steps') {
          return {
            ...block,
            items: (block.items || []).map(step => (step.id === stepId ? { ...step, list: (step.list || []).filter(item => item.id !== fieldId) } : step))
          };
        }
        if (block.kind === 'choice') {
          return {
            ...block,
            options: (block.options || []).map(option => (option.id === optionId ? { ...option, list: (option.list || []).filter(item => item.id !== fieldId) } : option))
          };
        }
        return {
          ...block,
          list: (block.list || []).filter(item => item.id !== fieldId)
        };
      })
    );
  };

  const handleMoveField = (blockId, fieldId, direction, scope) => {
    const { stepId, optionId } = normalizeFieldScope(scope);
    updateSchema(
      mapBlocks(schema, blockId, block => {
        if (block.kind === 'steps') {
          return {
            ...block,
            items: (block.items || []).map(step => (step.id === stepId ? { ...step, list: moveItem(step.list || [], fieldId, direction) } : step))
          };
        }
        if (block.kind === 'choice') {
          return {
            ...block,
            options: (block.options || []).map(option => (option.id === optionId ? { ...option, list: moveItem(option.list || [], fieldId, direction) } : option))
          };
        }
        return {
          ...block,
          list: moveItem(block.list || [], fieldId, direction)
        };
      })
    );
  };

  const currentFieldScope = fieldContext ? collectSchemaFields(schema, { blockId: fieldContext.blockId, stepId: fieldContext.stepId, optionId: fieldContext.optionId }) : [];
  const toolbarExtra = typeof extraToolbar === 'function' ? extraToolbar({ schema }) : extraToolbar;

  return (
    <div className={[style['form-creator'], RESPONSIVE_BOUNDARY_CLASS, isMobile ? style['is-mobile'] : '', className].filter(Boolean).join(' ')}>
      <div className={style['editor-pane']}>
        <BlockListPanel
          blocks={schema.blocks}
          onAddBlock={handleAddBlock}
          onEditBlock={handleEditBlock}
          onDeleteBlock={handleDeleteBlock}
          onMoveBlock={handleMoveBlock}
          onAddField={handleAddField}
          onEditField={handleEditField}
          onDeleteField={handleDeleteField}
          onMoveField={handleMoveField}
          onAddStep={handleAddStep}
          onEditStep={handleEditStep}
          onDeleteStep={handleDeleteStep}
          onMoveStep={handleMoveStep}
          onAddChoiceOption={handleAddChoiceOption}
          onEditChoiceOption={handleEditChoiceOption}
          onDeleteChoiceOption={handleDeleteChoiceOption}
          onMoveChoiceOption={handleMoveChoiceOption}
          onOpenFormActions={() => setFormActionsOpen(true)}
          extraToolbar={toolbarExtra}
        />
      </div>
      {showPreview ? (
        <div className={style['preview-pane']}>
          <div className={style['preview-body']}>
            {hasRenderableContent(schema) ? <SchemaRenderer schema={schema} preview formProps={formProps} /> : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={formatMessage({ id: 'emptyBlockList' })} />}
          </div>
        </div>
      ) : null}
      <BlockEditorModal open={blockEditorOpen} block={editingBlock} renderModal={renderModal} onCancel={clearBlockEditor} onSave={handleSaveBlock} />
      <StepEditorModal
        open={stepEditorOpen}
        step={stepContext?.step}
        renderModal={renderModal}
        onCancel={() => {
          setStepEditorOpen(false);
          setStepContext(null);
        }}
        onSave={handleSaveStep}
      />
      <ChoiceOptionEditorModal
        open={choiceOptionEditorOpen}
        option={choiceOptionContext?.option}
        renderModal={renderModal}
        onCancel={() => {
          setChoiceOptionEditorOpen(false);
          setChoiceOptionContext(null);
        }}
        onSave={handleSaveChoiceOption}
      />
      <FieldEditorModal
        open={fieldEditorOpen}
        field={editingField}
        fieldList={currentFieldScope}
        renderModal={renderModal}
        onCancel={() => {
          setFieldEditorOpen(false);
          setFieldContext(null);
          setEditingField(null);
        }}
        onSave={handleSaveField}
      />
      <FormActionsEditor
        open={formActionsOpen}
        value={schema.actions}
        renderModal={renderModal}
        onCancel={() => setFormActionsOpen(false)}
        onSave={actions => {
          updateSchema({ ...schema, actions });
          setFormActionsOpen(false);
        }}
      />
    </div>
  );
});

export default FormCreator;
