import { useState } from 'react';
import { Button, Dropdown, Empty, Flex, Space, Tag, Typography } from 'antd';
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  DeleteOutlined,
  EditOutlined,
  FormOutlined,
  UnorderedListOutlined,
  TableOutlined,
  AppstoreOutlined,
  OrderedListOutlined,
  PlusOutlined,
  SelectOutlined,
  SettingOutlined,
  ClusterOutlined,
  PartitionOutlined
} from '@ant-design/icons';
import { useIntl } from '@kne/react-intl';
import { getBlockDefinition } from './blockRegistry';
import { MAX_BLOCK_DEPTH } from './schema';
import FieldRow from './FieldRow';
import style from './style.module.scss';

const { Text } = Typography;

const ActionGroup = ({ children }) => <div className={style['action-group']}>{children}</div>;

const IconBtn = ({ title, danger, ...props }) => <Button type="text" size="small" title={title} danger={danger} className={style['action-btn']} {...props} />;

const ROOT_ADD_OPTIONS = [
  { key: 'formInfo', icon: <FormOutlined /> },
  { key: 'list', icon: <UnorderedListOutlined /> },
  { key: 'tableList', icon: <TableOutlined /> },
  { key: 'object', icon: <ClusterOutlined /> },
  { key: 'choice', icon: <PartitionOutlined /> },
  { key: 'multiField', icon: <AppstoreOutlined /> },
  { key: 'steps', icon: <OrderedListOutlined /> }
];

/** 可挂子模块的容器；表格列表 / 同类多值本身不支持子模块 */
const NESTED_ADD_OPTIONS = ROOT_ADD_OPTIONS.filter(opt => opt.key !== 'steps');

const BlockListPanel = ({
  blocks,
  onAddBlock,
  onEditBlock,
  onDeleteBlock,
  onMoveBlock,
  onAddField,
  onEditField,
  onDeleteField,
  onMoveField,
  onAddStep,
  onEditStep,
  onDeleteStep,
  onMoveStep,
  onAddChoiceOption,
  onEditChoiceOption,
  onDeleteChoiceOption,
  onMoveChoiceOption,
  onOpenFormActions
}) => {
  const { formatMessage } = useIntl();
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const [addFieldMenuId, setAddFieldMenuId] = useState(null);

  const renderAddBlockMenu = (options, { onSelect, className } = {}) => (
    <div className={className || style['add-block-dropdown']}>
      {options.map(opt => {
        const definition = getBlockDefinition(opt.key);
        return (
          <div
            key={opt.key}
            role="button"
            tabIndex={0}
            className={style['add-block-option']}
            onClick={() => onSelect(opt.key)}
            onKeyDown={e => {
              if (e.key === 'Enter' || e.key === ' ') {
                onSelect(opt.key);
              }
            }}
          >
            <div className={style['add-block-option-icon']}>{opt.icon}</div>
            <div className={style['add-block-option-text']}>
              <div className={style['add-block-option-title']}>{formatMessage({ id: `blockKind_${opt.key}` })}</div>
              <div className={style['add-block-option-desc']}>{definition?.description}</div>
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderAddFieldButton = ({ menuKey, depth, onAddFieldClick, onAddChildBlock }) => {
    const canAddChild = typeof onAddChildBlock === 'function' && depth < MAX_BLOCK_DEPTH;
    const menuOpen = addFieldMenuId === menuKey;
    const btnClass = `${style['add-inline-btn']} ${style['hover-reveal']} ${menuOpen ? style['hover-reveal-active'] : ''}`.trim();

    if (!canAddChild) {
      return (
        <Button type="text" size="small" icon={<PlusOutlined />} className={btnClass} onClick={onAddFieldClick}>
          {formatMessage({ id: 'addField' })}
        </Button>
      );
    }

    return (
      <Dropdown
        open={menuOpen}
        onOpenChange={open => setAddFieldMenuId(open ? menuKey : null)}
        trigger={['hover']}
        mouseEnterDelay={0.1}
        mouseLeaveDelay={0.15}
        getPopupContainer={trigger => trigger.parentElement || document.body}
        dropdownRender={() => (
          <div className={style['add-field-dropdown']}>
            <div
              role="button"
              tabIndex={0}
              className={style['add-field-dropdown-item']}
              onClick={() => {
                onAddFieldClick();
                setAddFieldMenuId(null);
              }}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  onAddFieldClick();
                  setAddFieldMenuId(null);
                }
              }}
            >
              <span className={style['add-field-dropdown-item-icon']}>
                <SelectOutlined />
              </span>
              <span>{formatMessage({ id: 'addField' })}</span>
            </div>
            <div className={style['add-field-dropdown-divider']} />
            <div className={style['add-field-dropdown-label']}>{formatMessage({ id: 'addChildBlock' })}</div>
            {NESTED_ADD_OPTIONS.map(opt => {
              const definition = getBlockDefinition(opt.key);
              return (
                <div
                  key={opt.key}
                  role="button"
                  tabIndex={0}
                  className={style['add-field-dropdown-item']}
                  onClick={() => {
                    onAddChildBlock(opt.key);
                    setAddFieldMenuId(null);
                  }}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      onAddChildBlock(opt.key);
                      setAddFieldMenuId(null);
                    }
                  }}
                >
                  <span className={style['add-field-dropdown-item-icon']}>{opt.icon}</span>
                  <span>{formatMessage({ id: `blockKind_${opt.key}` })}</span>
                  {definition?.description ? <span className={style['add-field-dropdown-item-desc']}>{definition.description}</span> : null}
                </div>
              );
            })}
          </div>
        )}
      >
        <Button
          type="text"
          size="small"
          icon={<PlusOutlined />}
          className={btnClass}
          onClick={() => {
            onAddFieldClick();
            setAddFieldMenuId(null);
          }}
        >
          {formatMessage({ id: 'addField' })}
        </Button>
      </Dropdown>
    );
  };

  const renderFieldList = (fields, blockId, { stepId, optionId } = {}) => {
    if (!(fields || []).length) {
      return (
        <Text type="secondary" className={style['inline-empty']}>
          {formatMessage({ id: 'emptyFieldList' })}
        </Text>
      );
    }

    return (
      <div className={style['field-list']}>
        {fields.map((field, fieldIndex) => (
          <FieldRow
            key={field.id}
            field={field}
            index={fieldIndex}
            total={fields.length}
            onEdit={fieldItem => onEditField(blockId, fieldItem, { stepId, optionId })}
            onDelete={fieldId => onDeleteField(blockId, fieldId, { stepId, optionId })}
            onMove={(fieldId, direction) => onMoveField(blockId, fieldId, direction, { stepId, optionId })}
          />
        ))}
      </div>
    );
  };

  const renderNestedBlocks = (childBlocks, depth) => {
    if (!(childBlocks || []).length) {
      return null;
    }
    return (
      <div className={style['item-blocks-section']}>
        <div className={style['nested-block-list']}>{childBlocks.map((child, childIndex) => renderBlockSection(child, childIndex, childBlocks.length, depth + 1))}</div>
      </div>
    );
  };

  const renderItemBlocks = (parentBlock, depth) => renderNestedBlocks(parentBlock.itemBlocks, depth);

  const renderBlockChildren = (block, depth) => {
    if (block.kind === 'steps') {
      return (
        <div className={style['block-body']}>
          <div className={style['section-toolbar']}>
            <Text type="secondary" className={style['section-toolbar-label']}>
              {formatMessage({ id: 'stepListTitle' })}
            </Text>
            <Button type="text" size="small" icon={<PlusOutlined />} className={`${style['add-inline-btn']} ${style['hover-reveal']}`} onClick={() => onAddStep(block.id)}>
              {formatMessage({ id: 'addStep' })}
            </Button>
          </div>
          {(block.items || []).length ? (
            <div className={style['step-list']}>
              {(block.items || []).map((step, stepIndex) => (
                <div key={step.id} className={style['step-section']}>
                  <div className={style['step-section-header']}>
                    <Space size={8} className={style['step-section-title']}>
                      <span className={style['step-index']}>{stepIndex + 1}</span>
                      <Text strong>{step.title || formatMessage({ id: 'untitledStep' }, { index: stepIndex + 1 })}</Text>
                      <Text type="secondary">
                        {(step.blocks || []).length ? formatMessage({ id: 'fieldAndItemBlockCount' }, { fields: step.list?.length || 0, nests: step.blocks.length }) : formatMessage({ id: 'fieldCount' }, { count: step.list?.length || 0 })}
                      </Text>
                    </Space>
                    <ActionGroup>
                      <IconBtn title={formatMessage({ id: 'moveUp' })} icon={<ArrowUpOutlined />} disabled={stepIndex === 0} onClick={() => onMoveStep(block.id, step.id, 'up')} />
                      <IconBtn title={formatMessage({ id: 'moveDown' })} icon={<ArrowDownOutlined />} disabled={stepIndex === (block.items?.length || 0) - 1} onClick={() => onMoveStep(block.id, step.id, 'down')} />
                      <IconBtn title={formatMessage({ id: 'editStep' })} icon={<EditOutlined />} onClick={() => onEditStep(block.id, step)} />
                      <IconBtn title={formatMessage({ id: 'deleteStep' })} danger icon={<DeleteOutlined />} onClick={() => onDeleteStep(block.id, step.id)} />
                    </ActionGroup>
                    {renderAddFieldButton({
                      menuKey: `${block.id}:${step.id}`,
                      depth,
                      onAddFieldClick: () => onAddField(block.id, { stepId: step.id }),
                      onAddChildBlock: kind => onAddBlock(kind, { parentBlockId: block.id, stepId: step.id })
                    })}
                  </div>
                  {renderFieldList(step.list, block.id, { stepId: step.id })}
                  {renderNestedBlocks(step.blocks, depth)}
                </div>
              ))}
            </div>
          ) : (
            <Text type="secondary" className={style['inline-empty']}>
              {formatMessage({ id: 'emptyStepList' })}
            </Text>
          )}
        </div>
      );
    }

    if (block.kind === 'multiField') {
      return (
        <div className={style['block-body']}>
          <Text type="secondary">{formatMessage({ id: 'multiFieldEditorHint' })}</Text>
        </div>
      );
    }

    if (block.kind === 'choice') {
      return (
        <div className={style['block-body']}>
          <div className={style['section-toolbar']}>
            <Text type="secondary" className={style['section-toolbar-label']}>
              {formatMessage({ id: 'choiceOptionListTitle' })}
            </Text>
            <Button type="text" size="small" icon={<PlusOutlined />} className={`${style['add-inline-btn']} ${style['hover-reveal']}`} onClick={() => onAddChoiceOption(block.id)}>
              {formatMessage({ id: 'addChoiceOption' })}
            </Button>
          </div>
          {(block.options || []).length ? (
            <div className={style['step-list']}>
              {(block.options || []).map((option, optionIndex) => (
                <div key={option.id} className={style['step-section']}>
                  <div className={style['step-section-header']}>
                    <Space size={8} className={style['step-section-title']}>
                      <span className={style['step-index']}>{optionIndex + 1}</span>
                      <Text strong>{option.title || formatMessage({ id: 'choiceOptionFallback' }, { index: optionIndex + 1 })}</Text>
                      <Text type="secondary">
                        {(option.blocks || []).length
                          ? formatMessage({ id: 'fieldAndItemBlockCount' }, { fields: option.list?.length || 0, nests: option.blocks.length })
                          : formatMessage({ id: 'fieldCount' }, { count: option.list?.length || 0 })}
                      </Text>
                    </Space>
                    <ActionGroup>
                      <IconBtn title={formatMessage({ id: 'moveUp' })} icon={<ArrowUpOutlined />} disabled={optionIndex === 0} onClick={() => onMoveChoiceOption(block.id, option.id, 'up')} />
                      <IconBtn title={formatMessage({ id: 'moveDown' })} icon={<ArrowDownOutlined />} disabled={optionIndex === (block.options?.length || 0) - 1} onClick={() => onMoveChoiceOption(block.id, option.id, 'down')} />
                      <IconBtn title={formatMessage({ id: 'editChoiceOption' })} icon={<EditOutlined />} onClick={() => onEditChoiceOption(block.id, option)} />
                      <IconBtn title={formatMessage({ id: 'deleteChoiceOption' })} danger icon={<DeleteOutlined />} onClick={() => onDeleteChoiceOption(block.id, option.id)} />
                    </ActionGroup>
                    {renderAddFieldButton({
                      menuKey: `${block.id}:opt:${option.id}`,
                      depth,
                      onAddFieldClick: () => onAddField(block.id, { optionId: option.id }),
                      onAddChildBlock: kind => onAddBlock(kind, { parentBlockId: block.id, optionId: option.id })
                    })}
                  </div>
                  {renderFieldList(option.list, block.id, { optionId: option.id })}
                  {renderNestedBlocks(option.blocks, depth)}
                </div>
              ))}
            </div>
          ) : (
            <Text type="secondary" className={style['inline-empty']}>
              {formatMessage({ id: 'emptyChoiceOptionList' })}
            </Text>
          )}
        </div>
      );
    }

    const supportsItemBlocks = block.kind === 'list';
    const supportsBlocks = block.kind === 'formInfo' || block.kind === 'object';

    return (
      <div className={style['block-body']}>
        {renderFieldList(block.list, block.id)}
        {supportsItemBlocks ? renderItemBlocks(block, depth) : null}
        {supportsBlocks ? renderNestedBlocks(block.blocks, depth) : null}
      </div>
    );
  };

  const renderBlockSection = (block, blockIndex, total, depth = 0) => {
    const definition = getBlockDefinition(block.kind);
    const canAddField = block.kind !== 'steps' && block.kind !== 'multiField' && block.kind !== 'choice';
    const supportsItemBlocks = block.kind === 'list';
    const supportsBlocks = block.kind === 'formInfo' || block.kind === 'object';
    const supportsChildModules = supportsItemBlocks || supportsBlocks;
    const nestCount = supportsItemBlocks ? block.itemBlocks?.length || 0 : block.blocks?.length || 0;
    const summary =
      block.kind === 'steps'
        ? formatMessage({ id: 'stepCount' }, { count: block.items?.length || 0 })
        : block.kind === 'multiField'
          ? formatMessage({ id: 'multiFieldSummary' }, { type: block.fieldType })
          : block.kind === 'choice'
            ? formatMessage({ id: 'choiceOptionCount' }, { count: block.options?.length || 0 })
            : supportsChildModules && nestCount > 0
              ? formatMessage({ id: 'fieldAndItemBlockCount' }, { fields: block.list?.length || 0, nests: nestCount })
              : formatMessage({ id: 'fieldCount' }, { count: block.list?.length || 0 });

    return (
      <section key={block.id} className={`${style['block-section']} ${style[`block-kind-${block.kind}`] || ''} ${depth > 0 ? style['block-section-nested'] : ''}`.trim()}>
        <header className={style['block-section-header']}>
          <div className={style['block-header-left']}>
            <Tag bordered={false} color={definition?.color || 'default'}>
              {definition?.label || block.kind}
            </Tag>
            <Text strong ellipsis className={style['block-title']}>
              {block.title || block.label || block.name || formatMessage({ id: 'untitledBlock' })}
            </Text>
            <span className={style['block-summary']}>{summary}</span>
          </div>
          <Space size={4} wrap className={style['block-header-actions']}>
            <ActionGroup>
              <IconBtn title={formatMessage({ id: 'moveUp' })} icon={<ArrowUpOutlined />} disabled={blockIndex === 0} onClick={() => onMoveBlock(block.id, 'up')} />
              <IconBtn title={formatMessage({ id: 'moveDown' })} icon={<ArrowDownOutlined />} disabled={blockIndex === total - 1} onClick={() => onMoveBlock(block.id, 'down')} />
              <IconBtn title={formatMessage({ id: 'editBlock' })} icon={<SettingOutlined />} onClick={() => onEditBlock(block)} />
              <IconBtn title={formatMessage({ id: 'deleteBlock' })} danger icon={<DeleteOutlined />} onClick={() => onDeleteBlock(block.id)} />
            </ActionGroup>
            {canAddField
              ? renderAddFieldButton({
                  menuKey: block.id,
                  depth,
                  onAddFieldClick: () => onAddField(block.id),
                  onAddChildBlock: supportsChildModules ? kind => onAddBlock(kind, { parentBlockId: block.id }) : undefined
                })
              : null}
          </Space>
        </header>
        {renderBlockChildren(block, depth)}
      </section>
    );
  };

  return (
    <div className={style['block-list-panel']}>
      <Flex justify="flex-end" gap={8} align="center" className={style['panel-toolbar']}>
        <Dropdown
          open={addMenuOpen}
          onOpenChange={setAddMenuOpen}
          trigger={['click']}
          dropdownRender={() =>
            renderAddBlockMenu(ROOT_ADD_OPTIONS, {
              onSelect: kind => {
                onAddBlock(kind);
                setAddMenuOpen(false);
              }
            })
          }
        >
          <Button type="primary" size="small" icon={<PlusOutlined />} className={style['add-block-btn']}>
            {formatMessage({ id: 'addBlock' })}
          </Button>
        </Dropdown>
        <Button type="default" size="small" shape="circle" icon={<SettingOutlined />} className={style['form-actions-setting-btn']} title={formatMessage({ id: 'formActionsSection' })} onClick={onOpenFormActions} />
      </Flex>
      {!blocks.length ? (
        <Empty className={style['field-empty']} image={Empty.PRESENTED_IMAGE_SIMPLE} description={formatMessage({ id: 'emptyBlockList' })} />
      ) : (
        <div className={style['block-list']}>{blocks.map((block, blockIndex) => renderBlockSection(block, blockIndex, blocks.length, 0))}</div>
      )}
    </div>
  );
};

export default BlockListPanel;
