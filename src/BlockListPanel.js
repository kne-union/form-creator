import { createElement, useMemo, useRef, useState } from 'react';
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
  PartitionOutlined,
  ProfileOutlined,
  BorderOuterOutlined,
  HolderOutlined,
  RightOutlined
} from '@ant-design/icons';
import { useIntl } from '@kne/react-intl';
import { getBlockDefinition } from './blockRegistry';
import { resolveFieldTypeLabel } from './fieldRegistry';
import { MAX_BLOCK_DEPTH, blockHasLockedField, isFieldLocked, supportsItemBlocks as kindSupportsItemBlocks } from './schema';
import FieldRow, { getFieldTypeIcon } from './FieldRow';
import { collectConditionFields } from './fieldCondition';
import { resolveLocaleText } from './localeText';
import { useLocaleTextLanguages } from './LocaleTextInput';
import MatrixScaleEditor from './MatrixScaleEditor';
import SortableList, { getSortHandleProps } from './SortableList';
import RowActions, { orderActions } from './RowActions';
import { useIsMobile } from '@kne/responsive-utils';
import style from './style.module.scss';

const { Text } = Typography;

const ROOT_ADD_OPTIONS = [
  { key: 'formInfo', icon: <FormOutlined /> },
  { key: 'list', icon: <UnorderedListOutlined /> },
  { key: 'tableList', icon: <TableOutlined /> },
  { key: 'editableList', icon: <ProfileOutlined /> },
  { key: 'object', icon: <ClusterOutlined /> },
  { key: 'choice', icon: <PartitionOutlined /> },
  { key: 'multiField', icon: <AppstoreOutlined /> },
  { key: 'matrixScale', icon: <BorderOuterOutlined /> },
  { key: 'steps', icon: <OrderedListOutlined /> }
];

const BLOCK_KIND_ICONS = Object.fromEntries(ROOT_ADD_OPTIONS.map(({ key, icon }) => [key, icon]));

/** 可挂子模块的容器；表格列表 / 同类多值本身不支持子模块 */
const NESTED_ADD_OPTIONS = ROOT_ADD_OPTIONS.filter(opt => opt.key !== 'steps');

/** 模块列表的拖柄 scope 须稳定：ReactSortable 只在挂载时读取 handle，scope 随列表内容变化会导致拖柄失效 */
const getBlockScope = parentKey => `blocks:${parentKey}`;

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
  onOpenFormActions,
  onPatchBlock,
  extraToolbar
}) => {
  const { formatMessage, locale } = useIntl();
  const isMobile = useIsMobile();
  const languages = useLocaleTextLanguages();
  const text = value => resolveLocaleText(value, locale, languages);
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const [addFieldMenuId, setAddFieldMenuId] = useState(null);
  const keepAddFieldMenuOpenRef = useRef(false);
  const [collapsedIds, setCollapsedIds] = useState(() => new Set());
  const toggleCollapsed = id =>
    setCollapsedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  const renderDragHandle = (scope, standalone) => (
    <span className={standalone ? style['drag-handle'] : `${style['drag-handle']} ${style['drag-handle-action']}`} title={formatMessage({ id: 'dragSort' })} {...getSortHandleProps(scope)}>
      <HolderOutlined />
    </span>
  );
  const conditionContext = useMemo(() => {
    const triggerFields = collectConditionFields({ blocks }).filter(item => !item.inList);
    return {
      triggerNames: new Set(triggerFields.map(item => item.path)),
      fieldLookup: new Map(triggerFields.map(item => [item.path, item.field]))
    };
  }, [blocks]);

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
              <div className={style['add-block-option-desc']}>{definition ? formatMessage({ id: definition.descriptionId }) : null}</div>
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderAddFieldButton = ({ menuKey, depth, onAddFieldClick, onAddChildBlock }) => {
    const canAddChild = typeof onAddChildBlock === 'function' && depth < MAX_BLOCK_DEPTH;
    const menuOpen = addFieldMenuId === menuKey;
    const btnClass = `${style['add-inline-btn']} ${style['hover-reveal']} ${menuOpen ? style['hover-reveal-active'] : ''} ${isMobile ? style['add-inline-btn-icon'] : ''}`.trim();
    const addFieldText = formatMessage({ id: 'addField' });

    if (!canAddChild) {
      return (
        <Button type="text" size="small" icon={<PlusOutlined />} className={btnClass} title={addFieldText} onClick={onAddFieldClick}>
          {isMobile ? null : addFieldText}
        </Button>
      );
    }

    return (
      <Dropdown
        open={menuOpen}
        onOpenChange={open => {
          if (open) {
            setAddFieldMenuId(menuKey);
            return;
          }
          // 已打开时再点触发器：antd 会 toggle 关闭，这里忽略，保持展开
          if (keepAddFieldMenuOpenRef.current) {
            keepAddFieldMenuOpenRef.current = false;
            return;
          }
          setAddFieldMenuId(null);
        }}
        trigger={['hover', 'click']}
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
                  {definition ? <span className={style['add-field-dropdown-item-desc']}>{formatMessage({ id: definition.descriptionId })}</span> : null}
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
          onMouseDown={() => {
            if (menuOpen) {
              keepAddFieldMenuOpenRef.current = true;
            }
          }}
          title={addFieldText}
          onClick={() => setAddFieldMenuId(menuKey)}
        >
          {isMobile ? null : addFieldText}
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

    const scope = `fields:${blockId}:${stepId || ''}:${optionId || ''}`;
    const canDrag = fields.length > 1;

    return (
      <SortableList className={style['field-list']} scope={scope} list={fields} isFixed={isFieldLocked} onMove={(fieldId, to) => onMoveField(blockId, fieldId, to, { stepId, optionId })}>
        {fields.map((field, fieldIndex) => (
          <FieldRow
            key={field.id}
            isMobile={isMobile}
            dragHandleProps={canDrag && !isFieldLocked(field) ? getSortHandleProps(scope) : null}
            field={field}
            index={fieldIndex}
            total={fields.length}
            prevLocked={isFieldLocked(fields[fieldIndex - 1])}
            nextLocked={isFieldLocked(fields[fieldIndex + 1])}
            conditionContext={conditionContext}
            onEdit={fieldItem => onEditField(blockId, fieldItem, { stepId, optionId })}
            onDelete={fieldId => onDeleteField(blockId, fieldId, { stepId, optionId })}
            onMove={(fieldId, direction) => onMoveField(blockId, fieldId, direction, { stepId, optionId })}
          />
        ))}
      </SortableList>
    );
  };

  const renderNestedBlocks = (childBlocks, depth, parentKey) => {
    if (!(childBlocks || []).length) {
      return null;
    }
    return (
      <div className={style['item-blocks-section']}>
        <SortableList className={style['nested-block-list']} scope={getBlockScope(parentKey)} list={childBlocks} isFixed={blockHasLockedField} onMove={onMoveBlock}>
          {childBlocks.map((child, childIndex) => renderBlockSection(child, childIndex, childBlocks, depth + 1, parentKey))}
        </SortableList>
      </div>
    );
  };

  const renderItemBlocks = (parentBlock, depth) => renderNestedBlocks(parentBlock.itemBlocks, depth, `item:${parentBlock.id}`);

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
            <SortableList className={style['step-list']} scope={`steps:${block.id}`} list={block.items} isFixed={blockHasLockedField} onMove={(stepId, to) => onMoveStep(block.id, stepId, to)}>
              {(block.items || []).map((step, stepIndex) => (
                <div key={step.id} className={style['step-section']}>
                  <div className={style['step-section-header']}>
                    <div className={style['step-section-title']}>
                      {isMobile && block.items.length > 1 && !blockHasLockedField(step) ? renderDragHandle(`steps:${block.id}`, true) : null}
                      <span className={style['step-index']}>{stepIndex + 1}</span>
                      <div className={style['step-section-text']}>
                        <Text strong>{text(step.title) || formatMessage({ id: 'untitledStep' }, { index: stepIndex + 1 })}</Text>
                        <Text type="secondary" className={style['step-section-count']}>
                          {(step.blocks || []).length ? formatMessage({ id: 'fieldAndItemBlockCount' }, { fields: step.list?.length || 0, nests: step.blocks.length }) : formatMessage({ id: 'fieldCount' }, { count: step.list?.length || 0 })}
                        </Text>
                      </div>
                    </div>
                    <Space size={4} className={style['step-section-actions']}>
                      <RowActions
                        isMobile={isMobile}
                        moreTitle={formatMessage({ id: 'moreActions' })}
                        prefix={!isMobile && block.items.length > 1 && !blockHasLockedField(step) ? renderDragHandle(`steps:${block.id}`) : null}
                        actions={orderActions(isMobile, [
                          {
                            key: 'up',
                            label: formatMessage({ id: 'moveUp' }),
                            icon: <ArrowUpOutlined />,
                            disabled: stepIndex === 0 || blockHasLockedField(step) || blockHasLockedField(block.items[stepIndex - 1]),
                            onClick: () => onMoveStep(block.id, step.id, 'up')
                          },
                          {
                            key: 'down',
                            label: formatMessage({ id: 'moveDown' }),
                            icon: <ArrowDownOutlined />,
                            disabled: stepIndex === (block.items?.length || 0) - 1 || blockHasLockedField(step) || blockHasLockedField(block.items[stepIndex + 1]),
                            onClick: () => onMoveStep(block.id, step.id, 'down')
                          },
                          { key: 'edit', label: formatMessage({ id: 'editStep' }), icon: <EditOutlined />, onClick: () => onEditStep(block.id, step) },
                          blockHasLockedField(step) ? null : { key: 'delete', label: formatMessage({ id: 'deleteStep' }), icon: <DeleteOutlined />, danger: true, onClick: () => onDeleteStep(block.id, step.id) }
                        ])}
                      />
                      {renderAddFieldButton({
                        menuKey: `${block.id}:${step.id}`,
                        depth,
                        onAddFieldClick: () => onAddField(block.id, { stepId: step.id }),
                        onAddChildBlock: kind => onAddBlock(kind, { parentBlockId: block.id, stepId: step.id })
                      })}
                    </Space>
                  </div>
                  {renderFieldList(step.list, block.id, { stepId: step.id })}
                  {renderNestedBlocks(step.blocks, depth, `step:${step.id}`)}
                </div>
              ))}
            </SortableList>
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

    if (block.kind === 'matrixScale') {
      return <MatrixScaleEditor block={block} onChange={next => onPatchBlock?.(next)} />;
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
            <SortableList className={style['step-list']} scope={`options:${block.id}`} list={block.options} isFixed={blockHasLockedField} onMove={(optionId, to) => onMoveChoiceOption(block.id, optionId, to)}>
              {(block.options || []).map((option, optionIndex) => (
                <div key={option.id} className={style['step-section']}>
                  <div className={style['step-section-header']}>
                    <div className={style['step-section-title']}>
                      {isMobile && block.options.length > 1 && !blockHasLockedField(option) ? renderDragHandle(`options:${block.id}`, true) : null}
                      <span className={style['step-index']}>{optionIndex + 1}</span>
                      <div className={style['step-section-text']}>
                        <Text strong>{text(option.title) || formatMessage({ id: 'choiceOptionFallback' }, { index: optionIndex + 1 })}</Text>
                        <Text type="secondary" className={style['step-section-count']}>
                          {(option.blocks || []).length
                            ? formatMessage({ id: 'fieldAndItemBlockCount' }, { fields: option.list?.length || 0, nests: option.blocks.length })
                            : formatMessage({ id: 'fieldCount' }, { count: option.list?.length || 0 })}
                        </Text>
                      </div>
                    </div>
                    <Space size={4} className={style['step-section-actions']}>
                      <RowActions
                        isMobile={isMobile}
                        moreTitle={formatMessage({ id: 'moreActions' })}
                        prefix={!isMobile && block.options.length > 1 && !blockHasLockedField(option) ? renderDragHandle(`options:${block.id}`) : null}
                        actions={orderActions(isMobile, [
                          {
                            key: 'up',
                            label: formatMessage({ id: 'moveUp' }),
                            icon: <ArrowUpOutlined />,
                            disabled: optionIndex === 0 || blockHasLockedField(option) || blockHasLockedField(block.options[optionIndex - 1]),
                            onClick: () => onMoveChoiceOption(block.id, option.id, 'up')
                          },
                          {
                            key: 'down',
                            label: formatMessage({ id: 'moveDown' }),
                            icon: <ArrowDownOutlined />,
                            disabled: optionIndex === (block.options?.length || 0) - 1 || blockHasLockedField(option) || blockHasLockedField(block.options[optionIndex + 1]),
                            onClick: () => onMoveChoiceOption(block.id, option.id, 'down')
                          },
                          { key: 'edit', label: formatMessage({ id: 'editChoiceOption' }), icon: <EditOutlined />, onClick: () => onEditChoiceOption(block.id, option) },
                          blockHasLockedField(option) ? null : { key: 'delete', label: formatMessage({ id: 'deleteChoiceOption' }), icon: <DeleteOutlined />, danger: true, onClick: () => onDeleteChoiceOption(block.id, option.id) }
                        ])}
                      />
                      {renderAddFieldButton({
                        menuKey: `${block.id}:opt:${option.id}`,
                        depth,
                        onAddFieldClick: () => onAddField(block.id, { optionId: option.id }),
                        onAddChildBlock: kind => onAddBlock(kind, { parentBlockId: block.id, optionId: option.id })
                      })}
                    </Space>
                  </div>
                  {renderFieldList(option.list, block.id, { optionId: option.id })}
                  {renderNestedBlocks(option.blocks, depth, `option:${option.id}`)}
                </div>
              ))}
            </SortableList>
          ) : (
            <Text type="secondary" className={style['inline-empty']}>
              {formatMessage({ id: 'emptyChoiceOptionList' })}
            </Text>
          )}
        </div>
      );
    }

    const supportsItemBlocks = kindSupportsItemBlocks(block.kind);
    const supportsBlocks = block.kind === 'formInfo' || block.kind === 'object';

    return (
      <div className={style['block-body']}>
        {renderFieldList(block.list, block.id)}
        {supportsItemBlocks ? renderItemBlocks(block, depth) : null}
        {supportsBlocks ? renderNestedBlocks(block.blocks, depth, `block:${block.id}`) : null}
      </div>
    );
  };

  const renderBlockSection = (block, blockIndex, siblings, depth = 0, parentKey = 'root') => {
    const total = siblings.length;
    const locked = blockHasLockedField(block);
    const definition = getBlockDefinition(block.kind);
    const canAddField = block.kind !== 'steps' && block.kind !== 'multiField' && block.kind !== 'matrixScale' && block.kind !== 'choice';
    const supportsItemBlocks = kindSupportsItemBlocks(block.kind);
    const supportsBlocks = block.kind === 'formInfo' || block.kind === 'object';
    const supportsChildModules = supportsItemBlocks || supportsBlocks;
    const nestCount = supportsItemBlocks ? block.itemBlocks?.length || 0 : block.blocks?.length || 0;
    const matrixLayout = block.layout === 'columns' || block.layout === 'field' ? block.layout : 'options';
    const summary =
      block.kind === 'steps'
        ? formatMessage({ id: 'stepCount' }, { count: block.items?.length || 0 })
        : block.kind === 'multiField'
          ? formatMessage(
              { id: 'multiFieldSummary' },
              {
                type: (
                  <span key="type" className={style['block-summary-type']}>
                    {createElement(getFieldTypeIcon(block.fieldType || 'Input'))}
                    {resolveFieldTypeLabel(block.fieldType, formatMessage)}
                  </span>
                )
              }
            )
          : block.kind === 'matrixScale'
            ? formatMessage(
                { id: 'matrixScaleSummary' },
                {
                  type: (
                    <span key="type" className={style['block-summary-type']}>
                      {createElement(getFieldTypeIcon(block.fieldType || 'RadioGroup'))}
                      {resolveFieldTypeLabel(block.fieldType || 'RadioGroup', formatMessage)}
                    </span>
                  ),
                  layout: formatMessage({ id: `matrixScaleLayout_${matrixLayout}` }),
                  rows: block.rows?.length || 0
                }
              )
            : block.kind === 'choice'
              ? formatMessage({ id: 'choiceOptionCount' }, { count: block.options?.length || 0 })
              : supportsChildModules && nestCount > 0
                ? formatMessage({ id: 'fieldAndItemBlockCount' }, { fields: block.list?.length || 0, nests: nestCount })
                : formatMessage({ id: 'fieldCount' }, { count: block.list?.length || 0 });

    const collapsed = collapsedIds.has(block.id);
    const canDragBlock = total > 1 && !locked;
    const blockTitle = text(block.title) || text(block.label) || block.name || formatMessage({ id: 'untitledBlock' });

    return (
      <section key={block.id} className={`${style['block-section']} ${style[`block-kind-${block.kind}`] || ''} ${depth > 0 ? style['block-section-nested'] : ''} ${collapsed ? style['is-collapsed'] : ''}`.trim()}>
        <header className={style['block-section-header']}>
          <div className={style['block-header-meta']}>
            <button
              type="button"
              className={`${style['block-collapse-btn']} ${collapsed ? '' : style['is-expanded']}`.trim()}
              title={formatMessage({ id: collapsed ? 'expandBlock' : 'collapseBlock' })}
              aria-expanded={!collapsed}
              onClick={() => toggleCollapsed(block.id)}
            >
              <RightOutlined />
            </button>
            {isMobile && canDragBlock ? renderDragHandle(getBlockScope(parentKey), true) : null}
            <Tag bordered={false} color={definition?.color || 'default'} icon={BLOCK_KIND_ICONS[block.kind]}>
              {formatMessage({ id: `blockKind_${block.kind}` })}
            </Tag>
            <span className={style['block-summary']}>{summary}</span>
            <Space size={4} className={style['block-header-actions']}>
              <RowActions
                isMobile={isMobile}
                moreTitle={formatMessage({ id: 'moreActions' })}
                prefix={!isMobile && canDragBlock ? renderDragHandle(getBlockScope(parentKey)) : null}
                actions={orderActions(isMobile, [
                  { key: 'up', label: formatMessage({ id: 'moveUp' }), icon: <ArrowUpOutlined />, disabled: blockIndex === 0 || locked || blockHasLockedField(siblings[blockIndex - 1]), onClick: () => onMoveBlock(block.id, 'up') },
                  {
                    key: 'down',
                    label: formatMessage({ id: 'moveDown' }),
                    icon: <ArrowDownOutlined />,
                    disabled: blockIndex === total - 1 || locked || blockHasLockedField(siblings[blockIndex + 1]),
                    onClick: () => onMoveBlock(block.id, 'down')
                  },
                  { key: 'setting', label: formatMessage({ id: 'editBlock' }), icon: <SettingOutlined />, onClick: () => onEditBlock(block) },
                  locked ? null : { key: 'delete', label: formatMessage({ id: 'deleteBlock' }), icon: <DeleteOutlined />, danger: true, onClick: () => onDeleteBlock(block.id) }
                ])}
              />
              {canAddField
                ? renderAddFieldButton({
                    menuKey: block.id,
                    depth,
                    onAddFieldClick: () => onAddField(block.id),
                    onAddChildBlock: supportsChildModules ? kind => onAddBlock(kind, { parentBlockId: block.id }) : undefined
                  })
                : null}
            </Space>
          </div>
          <div className={style['block-title']} title={blockTitle}>
            {blockTitle}
          </div>
        </header>
        {collapsed ? null : renderBlockChildren(block, depth)}
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
        {extraToolbar ? <div className={style['panel-toolbar-extra']}>{extraToolbar}</div> : null}
      </Flex>
      {!blocks.length ? (
        <Empty className={style['field-empty']} image={Empty.PRESENTED_IMAGE_SIMPLE} description={formatMessage({ id: 'emptyBlockList' })} />
      ) : (
        <SortableList className={style['block-list']} scope={getBlockScope('root')} list={blocks} isFixed={blockHasLockedField} onMove={onMoveBlock}>
          {blocks.map((block, blockIndex) => renderBlockSection(block, blockIndex, blocks, 0))}
        </SortableList>
      )}
    </div>
  );
};

export default BlockListPanel;
