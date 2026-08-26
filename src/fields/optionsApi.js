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

export const createApiFromOptions = (options = []) => ({
  loader: () => ({
    pageData: options.map(mapOptionItem)
  })
});
