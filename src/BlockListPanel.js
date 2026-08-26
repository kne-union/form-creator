import { useState } from 'react';
import { Button, Dropdown, Empty, Flex, Space, Tag, Typography } from 'antd';
import { ArrowDownOutlined, ArrowUpOutlined, DeleteOutlined, EditOutlined, FormOutlined, UnorderedListOutlined, TableOutlined, AppstoreOutlined, OrderedListOutlined, PlusOutlined, SettingOutlined } from '@ant-design/icons';
import { useIntl } from '@kne/react-intl';
import { getBlockDefinition } from './blockRegistry';
import FieldRow from './FieldRow';
import style from './style.module.scss';

const { Text } = Typography;

const ActionGroup = ({ children }) => <div className={style['action-group']}>{children}</div>;

const IconBtn = ({ title, danger, ...props }) => <Button type="text" size="small" title={title} danger={danger} className={style['action-btn']} {...props} />;

const BlockListPanel = ({ blocks, onAddBlock, onEditBlock, onDeleteBlock, onMoveBlock, onAddField, onEditField, onDeleteField, onMoveField, onAddStep, onEditStep, onDeleteStep, onMoveStep, onOpenFormActions }) => {
  const { formatMessage } = useIntl();
  const [addMenuOpen, setAddMenuOpen] = useState(false);

  const addBlockOptions = [
    { key: 'formInfo', icon: <FormOutlined /> },
    { key: 'list', icon: <UnorderedListOutlined /> },
    { key: 'tableList', icon: <TableOutlined /> },
    { key: 'multiField', icon: <AppstoreOutlined /> },
    { key: 'steps', icon: <OrderedListOutlined /> }
  ];

  const renderFieldList = (fields, blockId, stepId) => {
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
            onEdit={fieldItem => onEditField(blockId, fieldItem, stepId)}
            onDelete={fieldId => onDeleteField(blockId, fieldId, stepId)}
            onMove={(fieldId, direction) => onMoveField(blockId, fieldId, direction, stepId)}
          />
        ))}
      </div>
    );
  };

  const renderBlockChildren = block => {
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
                      <Text type="secondary">{formatMessage({ id: 'fieldCount' }, { count: step.list?.length || 0 })}</Text>
                    </Space>
                    <ActionGroup>
                      <IconBtn title={formatMessage({ id: 'moveUp' })} icon={<ArrowUpOutlined />} disabled={stepIndex === 0} onClick={() => onMoveStep(block.id, step.id, 'up')} />
                      <IconBtn title={formatMessage({ id: 'moveDown' })} icon={<ArrowDownOutlined />} disabled={stepIndex === (block.items?.length || 0) - 1} onClick={() => onMoveStep(block.id, step.id, 'down')} />
                      <IconBtn title={formatMessage({ id: 'editStep' })} icon={<EditOutlined />} onClick={() => onEditStep(block.id, step)} />
                      <IconBtn title={formatMessage({ id: 'deleteStep' })} danger icon={<DeleteOutlined />} onClick={() => onDeleteStep(block.id, step.id)} />
                    </ActionGroup>
                    <Button type="text" size="small" icon={<PlusOutlined />} className={`${style['add-inline-btn']} ${style['hover-reveal']}`} onClick={() => onAddField(block.id, step.id)}>
                      {formatMessage({ id: 'addField' })}
                    </Button>
                  </div>
                  {renderFieldList(step.list, block.id, step.id)}
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

    return <div className={style['block-body']}>{renderFieldList(block.list, block.id)}</div>;
  };

  return (
    <div className={style['block-list-panel']}>
      <Flex justify="flex-end" gap={8} align="center" className={style['panel-toolbar']}>
        <Dropdown
          open={addMenuOpen}
          onOpenChange={setAddMenuOpen}
          trigger={['click']}
          dropdownRender={() => (
            <div className={style['add-block-dropdown']}>
              {addBlockOptions.map(opt => {
                const definition = getBlockDefinition(opt.key);
                return (
                  <div
                    key={opt.key}
                    role="button"
                    tabIndex={0}
                    className={style['add-block-option']}
                    onClick={() => {
                      onAddBlock(opt.key);
                      setAddMenuOpen(false);
                    }}
                    onKeyDown={e => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        onAddBlock(opt.key);
                        setAddMenuOpen(false);
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
          )}
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
        <div className={style['block-list']}>
          {blocks.map((block, blockIndex) => {
            const definition = getBlockDefinition(block.kind);
            const canAddField = block.kind !== 'steps' && block.kind !== 'multiField';
            const summary =
              block.kind === 'steps'
                ? formatMessage({ id: 'stepCount' }, { count: block.items?.length || 0 })
                : block.kind === 'multiField'
                  ? formatMessage({ id: 'multiFieldSummary' }, { type: block.fieldType })
                  : formatMessage({ id: 'fieldCount' }, { count: block.list?.length || 0 });

            return (
              <section key={block.id} className={`${style['block-section']} ${style[`block-kind-${block.kind}`] || ''}`.trim()}>
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
                      <IconBtn title={formatMessage({ id: 'moveDown' })} icon={<ArrowDownOutlined />} disabled={blockIndex === blocks.length - 1} onClick={() => onMoveBlock(block.id, 'down')} />
                      <IconBtn title={formatMessage({ id: 'editBlock' })} icon={<SettingOutlined />} onClick={() => onEditBlock(block)} />
                      <IconBtn title={formatMessage({ id: 'deleteBlock' })} danger icon={<DeleteOutlined />} onClick={() => onDeleteBlock(block.id)} />
                    </ActionGroup>
                    {canAddField ? (
                      <Button type="text" size="small" icon={<PlusOutlined />} className={`${style['add-inline-btn']} ${style['hover-reveal']}`} onClick={() => onAddField(block.id)}>
                        {formatMessage({ id: 'addField' })}
                      </Button>
                    ) : null}
                  </Space>
                </header>
                {renderBlockChildren(block)}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default BlockListPanel;
