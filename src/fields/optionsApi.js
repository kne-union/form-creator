export const mapOptionItem = item => {
  if (!item || typeof item !== 'object') {
    return item;
  }
  const { children, ...rest } = item;
  const next = { ...rest };
  if (Array.isArray(children) && children.length) {
    next.children = children.map(mapOptionItem);
  }
  return next;
};

/**
 * 搭建器选项是 { label, value, children }；SelectCascader 默认 valueKey='id'、示例用 id/name。
 * 补齐两边的 key，避免 mapping 全部落到 undefined 导致下拉空白。
 */
export const alignOptionKeys = (options = [], { valueKey = 'value', labelKey = 'label' } = {}) => {
  if (!Array.isArray(options)) {
    return options;
  }
  return options.map(item => {
    if (!item || typeof item !== 'object') {
      return item;
    }
    const rawValue = item[valueKey] ?? item.value ?? item.id ?? item.code;
    const rawLabel = item[labelKey] ?? item.label ?? item.name;
    const next = { ...item };
    if (rawValue != null && next[valueKey] == null) {
      next[valueKey] = rawValue;
    }
    if (rawLabel != null && (next[labelKey] == null || next[labelKey] === '')) {
      next[labelKey] = rawLabel;
    }
    if (next.id == null && rawValue != null) {
      next.id = rawValue;
    }
    if ((next.name == null || next.name === '') && rawLabel != null) {
      next.name = rawLabel;
    }
    if (Array.isArray(next.children) && next.children.length) {
      next.children = alignOptionKeys(next.children, { valueKey, labelKey });
    }
    return next;
  });
};

/**
 * SelectTree 按扁平 parentId 组树，会覆盖节点上已有的 children。
 * 搭建器存的是嵌套 children，交给 SelectTree 前先拍平。
 */
export const flattenTreeOptions = (options = [], { valueKey = 'value', parentKey = 'parentId', childrenKey = 'children', parentId } = {}) => {
  const result = [];
  (Array.isArray(options) ? options : []).forEach(item => {
    if (!item || typeof item !== 'object') {
      return;
    }
    const nested = item[childrenKey];
    const node = { ...item };
    delete node[childrenKey];
    if (parentId !== undefined) {
      node[parentKey] = parentId;
    }
    result.push(node);
    if (Array.isArray(nested) && nested.length) {
      result.push(
        ...flattenTreeOptions(nested, {
          valueKey,
          parentKey,
          childrenKey,
          parentId: node[valueKey]
        })
      );
    }
  });
  return result;
};

export const createApiFromOptions = (options = []) => ({
  loader: () => ({
    pageData: options.map(mapOptionItem)
  })
});
