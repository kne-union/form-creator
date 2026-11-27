import { useEffect, useRef, useState } from 'react';
import { Button } from 'antd';
import { ArrowLeftOutlined, ArrowRightOutlined } from '@ant-design/icons';
import FormInfo, { Steps, validateFieldsByName } from '@kne/form-info';
import { useFormContext } from '@kne/react-form-antd';
import style from './style.module.scss';

const cx = (...names) => names.filter(Boolean).join(' ');

const getStepFieldNames = item => (Array.isArray(item?.fieldNames) && item.fieldNames.length ? item.fieldNames : (item?.list || []).map(field => field?.props?.name)).filter(Boolean);

const FocusStepsHeader = ({ items, current, stepTitle, formatMessage, onJump }) => {
  const total = items.length;
  const isLast = current >= total - 1;

  return (
    <div className={style['steps-focus-header']}>
      <div className={style['steps-focus-meta']}>
        <span className={style['steps-focus-count']}>
          <span className={style['steps-focus-count-current']}>{String(current + 1).padStart(2, '0')}</span>
          <span className={style['steps-focus-count-total']}>/ {String(total).padStart(2, '0')}</span>
        </span>
        <span className={style['steps-focus-next']} title={isLast ? undefined : stepTitle(current + 1)}>
          {isLast ? formatMessage({ id: 'stepsFocusLast' }) : formatMessage({ id: 'stepsFocusNext' }, { title: stepTitle(current + 1) })}
        </span>
      </div>
      <div className={style['steps-focus-title']}>{stepTitle(current)}</div>
      <div className={style['steps-focus-track']} role="progressbar" aria-valuemin={1} aria-valuemax={total} aria-valuenow={current + 1}>
        {items.map((item, index) => (
          <button
            key={item.key || index}
            type="button"
            className={cx(style['steps-focus-segment'], index < current && style['is-done'], index === current && style['is-current'])}
            title={stepTitle(index)}
            aria-label={stepTitle(index)}
            disabled={index >= current}
            onClick={() => onJump(index)}
          />
        ))}
      </div>
    </div>
  );
};

const FocusStepsActions = ({ items, current, formatMessage, onChange }) => {
  const { openApi } = useFormContext() || {};
  const [loading, setLoading] = useState(false);
  const isFirst = current <= 0;
  const isLast = current >= items.length - 1;

  const handleNext = async () => {
    if (loading || isLast) {
      return;
    }
    setLoading(true);
    try {
      if (await validateFieldsByName(openApi, getStepFieldNames(items[current]))) {
        onChange(current + 1);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={style['steps-focus-actions']}>
      <div className={style['steps-focus-actions-side']}>
        {!isFirst ? (
          <Button className={style['steps-focus-prev']} variant="text" color="default" icon={<ArrowLeftOutlined />} onClick={() => onChange(current - 1)}>
            {formatMessage({ id: 'stepsFocusPrev' })}
          </Button>
        ) : null}
      </div>
      <div className={cx(style['steps-focus-actions-side'], style['is-end'])}>
        {isLast ? (
          <span className={style['steps-focus-done-hint']}>{formatMessage({ id: 'stepsFocusSubmitHint' })}</span>
        ) : (
          <Button className={style['steps-focus-next-btn']} variant="filled" color="primary" loading={loading} onClick={handleNext}>
            {formatMessage({ id: 'stepsFocusNextBtn' })}
            <ArrowRightOutlined className={style['steps-focus-next-btn-icon']} />
          </Button>
        )}
      </div>
    </div>
  );
};

/**
 * stepsStyle: 'focus'：受控 current，用自绘头部（序号 / 标题 / 分段进度）替换 antd 步骤条，
 * 并用自绘底部操作区替换 form-info 的链接式上一步 / 下一步；提交失败跳错步、重置仍由 form-info Steps 负责。
 */
const FocusSteps = ({ items = [], formatMessage, stepsClassName, ...props }) => {
  const [current, setCurrent] = useState(0);
  const headerRef = useRef(null);
  const mountedRef = useRef(false);
  const safeCurrent = Math.min(current, Math.max(items.length - 1, 0));
  const stepTitle = index => items[index]?.title || formatMessage({ id: 'untitledStep' }, { index: index + 1 });

  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }
    const node = headerRef.current;
    if (node && node.getBoundingClientRect().top < 0) {
      node.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [safeCurrent]);

  const focusItems = items.map((item, index) => {
    if (index !== safeCurrent) {
      return item;
    }
    return {
      ...item,
      title: (
        <div ref={headerRef}>
          <FocusStepsHeader items={items} current={safeCurrent} stepTitle={stepTitle} formatMessage={formatMessage} onJump={setCurrent} />
        </div>
      ),
      children: (
        <>
          {item.children != null ? item.children : <FormInfo column={item.column} gap={item.gap} list={item.list || []} />}
          <FocusStepsActions items={items} current={safeCurrent} formatMessage={formatMessage} onChange={setCurrent} />
        </>
      )
    };
  });

  return <Steps {...props} showActions={false} orientation="horizontal" stepsClassName={cx(stepsClassName, style['steps-focus'])} items={focusItems} current={safeCurrent} onChange={setCurrent} />;
};

export default FocusSteps;
