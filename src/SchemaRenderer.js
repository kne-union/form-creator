import { createElement } from 'react';
import { Flex } from 'antd';
import { useIntl } from '@kne/react-intl';
import { useIsMobile } from '@kne/responsive-utils';
import { SubmitButton, ResetButton, CancelButton } from '@kne/react-form-antd';
import { ButtonFooter } from '@kne/button-group';
import withLocale from './withLocale';
import renderSchemaContent, { renderSchemaInner } from './renderSchema';
import { hasRenderableContent, normalizeFormActions, normalizeSchema } from './schema';
import style from './style.module.scss';
import '@kne/form-info/dist/index.css';
import '@kne/info-page/dist/index.css';
import '@kne/button-group/dist/index.css';

const joinClass = (...names) => names.filter(Boolean).join(' ');

const resolveActionNode = ({
  schema,
  formatMessage,
  actions,
  showActions = true,
  submitText,
  resetText,
  cancelText,
  submitButtonProps,
  resetButtonProps,
  cancelButtonProps,
  showSubmit,
  showReset,
  showCancel,
  actionsAlign,
  actionsGap,
  footerClassName,
  buttonFooter = false,
  buttonFooterProps
}) => {
  if (showActions === false || actions === false || actions === null) {
    return null;
  }

  const normalized = normalizeSchema(schema);
  const schemaActions = normalizeFormActions(normalized.actions);
  const resolvedShowSubmit = showSubmit ?? schemaActions.showSubmit;
  const resolvedShowReset = showReset ?? schemaActions.showReset;
  const resolvedShowCancel = showCancel ?? schemaActions.showCancel;
  const resolvedAlign = actionsAlign || schemaActions.align || 'center';
  const resolvedGap = actionsGap != null ? actionsGap : schemaActions.gap;
  const resolvedSubmitText =
    (submitText != null && String(submitText).trim() ? submitText : null) || (schemaActions.submitText && String(schemaActions.submitText).trim() ? schemaActions.submitText : null) || formatMessage({ id: 'submit' });
  const resolvedResetText = (resetText != null && String(resetText).trim() ? resetText : null) || (schemaActions.resetText && String(schemaActions.resetText).trim() ? schemaActions.resetText : null) || formatMessage({ id: 'reset' });
  const resolvedCancelText =
    (cancelText != null && String(cancelText).trim() ? cancelText : null) || (schemaActions.cancelText && String(schemaActions.cancelText).trim() ? schemaActions.cancelText : null) || formatMessage({ id: 'cancel' });
  const resolvedSubmitButtonProps = {
    ...(schemaActions.submitButtonProps || {}),
    ...(submitButtonProps || {})
  };
  const resolvedResetButtonProps = {
    ...(schemaActions.resetButtonProps || {}),
    ...(resetButtonProps || {})
  };
  const resolvedCancelButtonProps = {
    ...(schemaActions.cancelButtonProps || {}),
    ...(cancelButtonProps || {})
  };

  const flexProps = {
    className: style['schema-actions-inner'],
    justify: resolvedAlign,
    gap: resolvedGap ?? 16,
    wrap: 'wrap'
  };

  let actionsEl = null;

  if (actions !== undefined) {
    actionsEl = createElement('div', { className: joinClass(style['schema-actions'], footerClassName) }, createElement(Flex, flexProps, actions));
  } else if (resolvedShowSubmit || resolvedShowReset || resolvedShowCancel) {
    actionsEl = createElement(
      'div',
      { className: joinClass(style['schema-actions'], footerClassName) },
      createElement(
        Flex,
        flexProps,
        resolvedShowSubmit ? createElement(SubmitButton, { type: 'primary', ...resolvedSubmitButtonProps }, resolvedSubmitText) : null,
        resolvedShowReset ? createElement(ResetButton, resolvedResetButtonProps, resolvedResetText) : null,
        resolvedShowCancel ? createElement(CancelButton, resolvedCancelButtonProps, resolvedCancelText) : null
      )
    );
  }

  if (!actionsEl) {
    return null;
  }

  if (!buttonFooter) {
    return actionsEl;
  }

  const footerProps = buttonFooterProps || {};
  return createElement(ButtonFooter, footerProps, actionsEl);
};

export const SchemaRendererInner = withLocale(props => {
  const {
    schema,
    preview = false,
    className,
    children,
    showActions = true,
    actions,
    submitText,
    resetText,
    cancelText,
    submitButtonProps,
    resetButtonProps,
    cancelButtonProps,
    showSubmit,
    showReset,
    showCancel,
    actionsAlign,
    actionsGap,
    bodyClassName,
    footerClassName,
    buttonFooter = false,
    buttonFooterProps
  } = props;
  const { formatMessage } = useIntl();
  const isMobile = useIsMobile();
  const normalized = normalizeSchema(schema);

  if (!hasRenderableContent(normalized)) {
    return null;
  }

  const actionNode = resolveActionNode({
    schema: normalized,
    formatMessage,
    showActions,
    actions,
    submitText,
    resetText,
    cancelText,
    submitButtonProps,
    resetButtonProps,
    cancelButtonProps,
    showSubmit,
    showReset,
    showCancel,
    actionsAlign,
    actionsGap,
    footerClassName,
    buttonFooter,
    buttonFooterProps
  });

  return renderSchemaInner(normalized, {
    preview,
    className,
    bodyClassName,
    isMobile,
    formatMessage,
    children,
    actionNode
  });
});

const SchemaRenderer = withLocale(props => {
  const {
    schema,
    formProps = {},
    preview = false,
    className,
    children,
    showActions = true,
    actions,
    submitText,
    resetText,
    cancelText,
    submitButtonProps,
    resetButtonProps,
    cancelButtonProps,
    showSubmit,
    showReset,
    showCancel,
    actionsAlign,
    actionsGap,
    bodyClassName,
    footerClassName,
    buttonFooter = false,
    buttonFooterProps
  } = props;
  const { formatMessage } = useIntl();
  const isMobile = useIsMobile();
  const normalized = normalizeSchema(schema);

  if (!hasRenderableContent(normalized)) {
    return null;
  }

  const actionNode = resolveActionNode({
    schema: normalized,
    formatMessage,
    showActions,
    actions,
    submitText,
    resetText,
    cancelText,
    submitButtonProps,
    resetButtonProps,
    cancelButtonProps,
    showSubmit,
    showReset,
    showCancel,
    actionsAlign,
    actionsGap,
    footerClassName,
    buttonFooter,
    buttonFooterProps
  });

  return renderSchemaContent(normalized, {
    preview,
    formProps,
    className,
    bodyClassName,
    isMobile,
    formatMessage,
    children,
    actionNode
  });
});

export default SchemaRenderer;
