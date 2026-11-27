import FormInfo from '@kne/form-info';
import { Checkbox, Switch } from '@kne/react-form-antd';
import style from './style.module.scss';

const TOGGLE_TYPES = [Checkbox, Switch];

/**
 * 输入类在前、开关类在后。开关包进独立网格：输入项为奇数或带 display 条件时，
 * 开关仍从新的一行开始，不会补进输入框旁的空位。
 */
export const arrangeEditorItems = (list, column = 1) => {
  const items = (list || []).filter(Boolean);
  const isToggle = item => TOGGLE_TYPES.includes(item.type);
  const inputs = items.filter(item => !isToggle(item));
  const toggles = items.filter(isToggle);
  if (!inputs.length || !toggles.length) {
    return [...inputs, ...toggles];
  }
  return [...inputs, <FormInfo key="editor-toggles" block className={style['editor-toggles']} column={column} gap={12} list={toggles} />];
};

export const getEditorColumn = isMobile => (isMobile ? 1 : 2);

export const getPropertyModalProps = (isMobile, width) => ({
  className: style['property-modal'],
  width: isMobile ? 'calc(100vw - 32px)' : width
});
