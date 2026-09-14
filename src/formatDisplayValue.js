import { createElement } from 'react';
import { getFieldDefinition, resolveFieldValueSchema } from './fieldRegistry';
import FileFieldPreview from './FileFieldPreview';

const TEMPORAL_PATTERN = {
  date: 'YYYY-MM-DD',
  month: 'YYYY-MM',
  time: 'HH:mm:ss',
  'date-time': 'YYYY-MM-DD HH:mm:ss',
  year: 'YYYY'
};

const TYPE_TO_TEMPORAL = {
  date: 'date',
  month: 'month',
  week: 'week',
  time: 'time',
  year: 'year',
  quarter: 'quarter',
  datetime: 'date-time',
  'date-time': 'date-time'
};

const pad = n => String(n).padStart(2, '0');

export const isEmptyValue = value => {
  if (value == null || value === '') {
    return true;
  }
  if (Array.isArray(value) && value.length === 0) {
    return true;
  }
  return false;
};

const toDate = value => {
  if (value == null || value === '') {
    return null;
  }
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  if (typeof value.toDate === 'function') {
    const next = value.toDate();
    return next instanceof Date && !Number.isNaN(next.getTime()) ? next : null;
  }
  if (typeof value.format === 'function' && typeof value.valueOf === 'function') {
    const next = new Date(value.valueOf());
    return Number.isNaN(next.getTime()) ? null : next;
  }
  if (typeof value === 'string' || typeof value === 'number') {
    const next = new Date(value);
    return Number.isNaN(next.getTime()) ? null : next;
  }
  return null;
};

const isoWeek = date => {
  const tmp = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = tmp.getUTCDay() || 7;
  tmp.setUTCDate(tmp.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((tmp - yearStart) / 86400000 + 1) / 7);
  return { year: tmp.getUTCFullYear(), week };
};

const applyPattern = (date, pattern) => {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const quarter = Math.ceil(month / 3);
  return pattern
    .replace(/YYYY/g, String(year))
    .replace(/MM/g, pad(month))
    .replace(/DD/g, pad(date.getDate()))
    .replace(/HH/g, pad(date.getHours()))
    .replace(/mm/g, pad(date.getMinutes()))
    .replace(/ss/g, pad(date.getSeconds()))
    .replace(/Q/g, String(quarter));
};

export const formatTemporal = (value, formatKey, patternOverride) => {
  if (Array.isArray(value)) {
    return value
      .map(item => formatTemporal(item, formatKey, patternOverride))
      .filter(item => item !== '')
      .join(' ~ ');
  }
  const date = toDate(value);
  if (!date) {
    return value == null || value === '' ? '' : String(value);
  }
  if (formatKey === 'week') {
    const { year, week } = isoWeek(date);
    return `${year}-W${pad(week)}`;
  }
  if (formatKey === 'quarter') {
    return `${date.getFullYear()}-Q${Math.ceil((date.getMonth() + 1) / 3)}`;
  }
  const pattern = patternOverride || TEMPORAL_PATTERN[formatKey] || TEMPORAL_PATTERN.date;
  if (value && typeof value.format === 'function' && patternOverride) {
    try {
      return value.format(patternOverride);
    } catch {
      // fall through to Date formatting
    }
  }
  return applyPattern(date, pattern);
};

const isTemporalKey = key => !!(key && (TEMPORAL_PATTERN[key] || key === 'week' || key === 'quarter'));

export const pickObjectLabel = (item, labelKey = 'label', valueKey = 'value') => {
  if (item == null) {
    return '';
  }
  if (typeof item !== 'object') {
    return item;
  }
  const label = item[labelKey] ?? item.label ?? item.name;
  if (label != null && typeof label !== 'object' && label !== '') {
    return label;
  }
  const raw = item[valueKey] ?? item.value ?? item.id ?? item.code;
  if (raw != null && typeof raw !== 'object') {
    return raw;
  }
  return '';
};

const mapOptionLabel = (value, options, labelKey = 'label', valueKey = 'value') => {
  if (value && typeof value === 'object') {
    return pickObjectLabel(value, labelKey, valueKey);
  }
  if (!Array.isArray(options) || !options.length) {
    return value == null ? '' : value;
  }
  const match = options.find(item => item && (item[valueKey] === value || item.value === value));
  return match?.[labelKey] ?? match?.label ?? value;
};

const formatOption = (value, field) => {
  const props = field?.props || {};
  const labelKey = props.labelKey || 'label';
  const valueKey = props.valueKey || 'value';
  const pick = item => {
    if (item && typeof item === 'object') {
      return pickObjectLabel(item, labelKey, valueKey);
    }
    return mapOptionLabel(item, props.options, labelKey, valueKey);
  };
  if (Array.isArray(value)) {
    return value
      .map(pick)
      .filter(item => item != null && item !== '')
      .join('、');
  }
  const label = pick(value);
  return label == null ? '' : label;
};

const formatPhone = value => {
  if (value == null || value === '') {
    return '';
  }
  if (typeof value === 'string' || typeof value === 'number') {
    const trimmed = String(value).trim().replace(/\s+/g, ' ');
    return trimmed;
  }
  if (typeof value !== 'object') {
    return String(value);
  }
  const number = String(value.value ?? value.phone ?? value.number ?? '').replace(/\s+/g, '');
  const rawCode = value.code ?? value.countryCallingCode;
  const code = rawCode == null || rawCode === '' ? '' : String(rawCode).replace(/^\+/, '');
  if (!number) {
    return '';
  }
  if (!code) {
    return number;
  }
  return `+${code} ${number}`;
};

const formatFile = value => {
  if (Array.isArray(value)) {
    return value
      .map(item => formatFile(item))
      .filter(Boolean)
      .join('、');
  }
  if (typeof value === 'string') {
    return value;
  }
  if (!value || typeof value !== 'object') {
    return value == null ? '' : String(value);
  }
  return value.filename || value.name || value.originName || value.originFileObj?.name || value.id || '';
};

const formatTypedDateRange = (value, ctx) => {
  if (!value || typeof value !== 'object') {
    return value == null ? '' : String(value);
  }
  const formatKey = TYPE_TO_TEMPORAL[value.type] || 'date';
  const range = formatTemporal(value.value, formatKey, ctx.field?.props?.format);
  const typeLabel = value.type ? String(value.type) : '';
  return [typeLabel, range].filter(Boolean).join(' ');
};

const formatDateToToday = (value, itemSchema, ctx) => {
  const items = Array.isArray(value) ? value : [value];
  const formatKey = itemSchema?.format || 'date';
  const start = formatByValueSchema(items[0], itemSchema, ctx);
  if (items[1] == null || items[1] === '' || items[1] === true) {
    const until = ctx.formatMessage?.({ id: 'schemaContentUntilToday' }) || '至今';
    return [start, until].filter(Boolean).join(' ~ ');
  }
  const end = formatByValueSchema(items[1], itemSchema, ctx);
  return [start, end].filter(Boolean).join(' ~ ');
};

const formatJson = value => {
  if (typeof value === 'string') {
    try {
      return JSON.stringify(JSON.parse(value), null, 2);
    } catch {
      return value;
    }
  }
  if (value && typeof value === 'object') {
    return JSON.stringify(value, null, 2);
  }
  return value == null ? '' : String(value);
};

const formatHtml = value =>
  String(value ?? '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const formatMoney = value => {
  const num = Number(value);
  if (Number.isNaN(num)) {
    return value == null ? '' : String(value);
  }
  return num.toLocaleString();
};

const formatColor = value => {
  if (value == null) {
    return '';
  }
  if (typeof value === 'string' || typeof value === 'number') {
    return String(value);
  }
  if (typeof value === 'object') {
    if (typeof value.toHexString === 'function') {
      return value.toHexString();
    }
    return value.hex || value.metaColor || pickObjectLabel(value) || '';
  }
  return String(value);
};

const formatPassword = (value, ctx) => {
  if (isEmptyValue(value)) {
    return '';
  }
  return ctx.formatMessage?.({ id: 'schemaContentPasswordMasked' }) || '••••••';
};

const formatBoolean = (value, field, ctx) => {
  const props = field?.props || {};
  if (value) {
    return props.checkedChildren || ctx.formatMessage?.({ id: 'schemaContentYes' }) || '是';
  }
  return props.unCheckedChildren || ctx.formatMessage?.({ id: 'schemaContentNo' }) || '否';
};

const stringifyFallback = value => {
  if (value == null) {
    return '';
  }
  if (typeof value !== 'object') {
    return String(value);
  }
  if (toDate(value)) {
    return formatTemporal(value, 'date-time');
  }
  if (Array.isArray(value)) {
    return value
      .map(item => (item && typeof item === 'object' ? stringifyFallback(item) : String(item ?? '')))
      .filter(Boolean)
      .join('、');
  }
  if (value.label != null || value.name != null) {
    return pickObjectLabel(value);
  }
  if (value.filename || value.mimetype || value.storageType) {
    return formatFile(value);
  }
  if (value.code != null && value.value != null && value.label == null) {
    return formatPhone(value);
  }
  if (value.type != null && Array.isArray(value.value)) {
    return formatTypedDateRange(value, { field: {} });
  }
  try {
    return JSON.stringify(value);
  } catch {
    return '';
  }
};

export const formatByValueSchema = (value, schema, ctx = {}) => {
  if (isEmptyValue(value)) {
    return '';
  }
  const resolved = schema && typeof schema === 'object' ? schema : {};
  const type = resolved.type;
  const format = resolved.format;
  const display = resolved.display;
  const field = ctx.field;
  const patternOverride = field?.props?.format;

  if (display === 'option') {
    return formatOption(value, field);
  }
  if (display === 'phone') {
    return formatPhone(value);
  }
  if (display === 'file') {
    return createElement(FileFieldPreview, { value, field });
  }
  if (display === 'typed-date-range') {
    return formatTypedDateRange(value, ctx);
  }
  if (display === 'date-to-today') {
    return formatDateToToday(value, resolved.items || { type: 'string', format: 'date' }, ctx);
  }
  if (display === 'html' || format === 'html') {
    return formatHtml(value);
  }
  if (display === 'money') {
    return formatMoney(value);
  }
  if (format === 'password') {
    return formatPassword(value, ctx);
  }
  if (format === 'json') {
    return formatJson(value);
  }
  if (format === 'color') {
    return formatColor(value);
  }
  if (type === 'boolean') {
    return formatBoolean(value, field, ctx);
  }
  if (isTemporalKey(format)) {
    return formatTemporal(value, format, patternOverride);
  }
  if (type === 'array') {
    const items = Array.isArray(value) ? value : [value];
    const itemSchema = resolved.items || {};
    if (itemSchema.display === 'file') {
      return createElement(FileFieldPreview, { value: items, field });
    }
    const joiner = isTemporalKey(itemSchema.format) || itemSchema.display === 'date-to-today' ? ' ~ ' : '、';
    return items
      .map(item => formatByValueSchema(item, itemSchema, ctx))
      .filter(item => item != null && item !== '')
      .join(joiner);
  }
  if (Array.isArray(value)) {
    const itemSchema = resolved.items || { ...resolved, type: undefined };
    if (itemSchema.display === 'file' || resolved.display === 'file') {
      return createElement(FileFieldPreview, { value, field });
    }
    const joiner = isTemporalKey(itemSchema.format) ? ' ~ ' : '、';
    return value
      .map(item => formatByValueSchema(item, itemSchema, ctx))
      .filter(item => item != null && item !== '')
      .join(joiner);
  }
  if (Array.isArray(resolved.enum) || (Array.isArray(field?.props?.options) && field.props.options.length)) {
    const mapped = formatOption(value, field);
    if (mapped != null && mapped !== '') {
      return mapped;
    }
  }
  if (type === 'object') {
    return stringifyFallback(value);
  }
  if (typeof value === 'object') {
    return stringifyFallback(value);
  }
  return String(value);
};

export const formatFieldDisplayValue = (field, value, { formatMessage } = {}) => {
  const emptyText = formatMessage?.({ id: 'schemaContentEmptyValue' }) || '-';
  if (isEmptyValue(value)) {
    return emptyText;
  }
  const definition = getFieldDefinition(field?.type);
  if (typeof definition?.formatDisplayValue === 'function') {
    const custom = definition.formatDisplayValue(value, field, { formatMessage });
    if (custom != null && custom !== '') {
      return custom;
    }
  }
  const schema = resolveFieldValueSchema(field);
  const text = formatByValueSchema(value, schema, { field, formatMessage });
  return text == null || text === '' ? emptyText : text;
};
