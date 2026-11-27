import { Button } from 'antd';
import ButtonGroup from '@kne/button-group';
import style from './style.module.scss';

/** 移动端菜单把「编辑 / 设置」放到第一项，桌面端保持 上移、下移、编辑、删除 的图标顺序 */
export const orderActions = (isMobile, actions) => {
  if (!isMobile) {
    return actions;
  }
  const primary = actions.filter(item => item && (item.key === 'edit' || item.key === 'setting'));
  return [...primary, ...actions.filter(item => !primary.includes(item))];
};

/**
 * 行操作：桌面端为悬停显示的图标组；移动端全部收进 ButtonGroup 的「⋯」，点击弹出底部动作面板。
 * actions: [{ key, label, icon, danger, disabled, onClick }]，falsy 项忽略
 */
const RowActions = ({ isMobile, actions, moreTitle, prefix }) => {
  const items = (actions || []).filter(Boolean);

  if (isMobile) {
    if (!items.length) {
      return null;
    }
    // 动作面板经 portal 渲染，React 事件仍会冒泡到行上的「点击编辑」，需在外层拦截
    return (
      <span className={style['more-btn']} title={moreTitle} onClick={e => e.stopPropagation()}>
        <ButtonGroup showLength={0} moreType="link" list={items.map(({ key, label, icon, danger, disabled, onClick }) => ({ key, children: label, icon, danger, disabled, onClick }))} />
      </span>
    );
  }

  return (
    <div className={style['action-group']}>
      {prefix}
      {items.map(({ key, label, icon, danger, disabled, onClick }) => (
        <Button key={key} type="text" size="small" title={label} danger={danger} disabled={disabled} icon={icon} className={style['action-btn']} onClick={onClick} />
      ))}
    </div>
  );
};

export default RowActions;
