import { useMemo, useState } from 'react';
import { Empty } from 'antd';
import { useIntl } from '@kne/react-intl';
import { useIsMobile, RESPONSIVE_BOUNDARY_CLASS } from '@kne/responsive-utils';
import withLocale from './withLocale';
import { collectSchemaFields, createBlock, createStep, defaultSchema, mapBlocks, moveItem, normalizeSchema, updateBlocks, hasRenderableContent } from './schema';
import BlockListPanel from './BlockListPanel';
import BlockEditorModal from './BlockEditorModal';
import StepEditorModal from './StepEditorModal';
import FieldEditorModal from './FieldEditorModal';
import FormActionsEditor from './FormActionsEditor';
import SchemaRenderer from './SchemaRenderer';
import style from './style.module.scss';

const FormCreator = withLocale(({ value, defaultValue, onChange, showPreview = true, className, formProps, renderModal }) => {
  const { formatMessage } = useIntl();
  const isMobile = useIsMobile();
  const [innerSchema, setInnerSchema] = useState(() => normalizeSchema(defaultValue || defaultSchema()));
  const [blockEditorOpen, setBlockEditorOpen] = useState(false);
  const [editingBlock, setEditingBlock] = useState(null);
  const [stepEditorOpen, setStepEditorOpen] = useState(false);
  const [stepContext, setStepContext] = useState(null);
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

  const handleAddBlock = kind => {
    setEditingBlock(createBlock(kind));
    setBlockEditorOpen(true);
  };

  const handleEditBlock = block => {
    setEditingBlock(block);
    setBlockEditorOpen(true);
  };

  const handleSaveBlock = block => {
    const exists = schema.blocks.some(item => item.id === block.id);
    updateSchema({
      ...schema,
      blocks: exists ? schema.blocks.map(item => (item.id === block.id ? block : item)) : [...schema.blocks, block]
    });
    setBlockEditorOpen(false);
    setEditingBlock(null);
  };

  const handleDeleteBlock = blockId => {
    updateSchema({
      ...schema,
      blocks: schema.blocks.filter(item => item.id !== blockId)
    });
  };

  const handleMoveBlock = (blockId, direction) => {
    updateSchema({
      ...schema,
      blocks: moveItem(schema.blocks, blockId, direction)
    });
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

  const handleAddField = (blockId, stepId) => {
    setFieldContext({ blockId, stepId });
    setEditingField(null);
    setFieldEditorOpen(true);
  };

  const handleEditField = (blockId, field, stepId) => {
    setFieldContext({ blockId, stepId });
    setEditingField(field);
    setFieldEditorOpen(true);
  };

  const handleSaveField = field => {
    const { blockId, stepId } = fieldContext;
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

  const handleDeleteField = (blockId, fieldId, stepId) => {
    updateSchema(
      mapBlocks(schema, blockId, block => {
        if (block.kind === 'steps') {
          return {
            ...block,
            items: (block.items || []).map(step => (step.id === stepId ? { ...step, list: (step.list || []).filter(item => item.id !== fieldId) } : step))
          };
        }
        return {
          ...block,
          list: (block.list || []).filter(item => item.id !== fieldId)
        };
      })
    );
  };

  const handleMoveField = (blockId, fieldId, direction, stepId) => {
    updateSchema(
      mapBlocks(schema, blockId, block => {
        if (block.kind === 'steps') {
          return {
            ...block,
            items: (block.items || []).map(step => (step.id === stepId ? { ...step, list: moveItem(step.list || [], fieldId, direction) } : step))
          };
        }
        return {
          ...block,
          list: moveItem(block.list || [], fieldId, direction)
        };
      })
    );
  };

  const currentFieldScope = fieldContext ? collectSchemaFields(schema, { blockId: fieldContext.blockId, stepId: fieldContext.stepId }) : [];

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
          onOpenFormActions={() => setFormActionsOpen(true)}
        />
      </div>
      {showPreview ? (
        <div className={style['preview-pane']}>
          <div className={style['preview-body']}>
            {hasRenderableContent(schema) ? <SchemaRenderer schema={schema} preview formProps={formProps} /> : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={formatMessage({ id: 'emptyBlockList' })} />}
          </div>
        </div>
      ) : null}
      <BlockEditorModal
        open={blockEditorOpen}
        block={editingBlock}
        renderModal={renderModal}
        onCancel={() => {
          setBlockEditorOpen(false);
          setEditingBlock(null);
        }}
        onSave={handleSaveBlock}
      />
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
