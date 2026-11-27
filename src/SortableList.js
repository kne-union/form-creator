import { ReactSortable } from 'react-sortablejs';
import { canMoveItemTo } from './schema';
import style from './style.module.scss';

const noop = () => {};

/** 拖柄属性：按 scope 区分，嵌套列表的拖柄不会被外层列表识别 */
export const getSortHandleProps = scope => ({ 'data-sort-handle': scope });

/**
 * 同一列表内拖拽排序：顺序以 schema 为准，setList 不接管；
 * onMove 拦截跨越固定项的位置，onEnd 通过 onMove(id, 目标下标) 写回。
 */
const SortableList = ({ scope, list, isFixed, onMove, className, children }) => {
  const getIndex = el => list.findIndex(item => String(item.id) === el?.dataset?.id);

  return (
    <ReactSortable
      tag="div"
      className={className}
      list={list}
      setList={noop}
      handle={`[data-sort-handle="${scope}"]`}
      animation={180}
      easing="cubic-bezier(0.2, 0, 0, 1)"
      forceFallback
      fallbackOnBody
      ghostClass={style['sortable-ghost']}
      chosenClass={style['sortable-chosen']}
      dragClass={style['sortable-drag']}
      onMove={evt => canMoveItemTo(list, getIndex(evt.dragged), getIndex(evt.related), isFixed)}
      onEnd={evt => {
        if (evt.oldIndex !== evt.newIndex && list[evt.oldIndex]) {
          onMove(list[evt.oldIndex].id, evt.newIndex);
        }
      }}
    >
      {children}
    </ReactSortable>
  );
};

export default SortableList;
