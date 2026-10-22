import { Input } from 'antd';
import { hooks } from '@kne/react-form-antd';
import { useIntl } from '@kne/react-intl';
import { BASE_LANGUAGE, LOCALE_TEXT_LANGUAGES, getLocaleTextValue, setLocaleTextValue } from './localeText';
import style from './style.module.scss';

const { useOnChange } = hooks;

/** 双语文案输入：值为字符串或 { 'zh-CN', 'en-US' }，只填中文时存为字符串 */
export const LocaleTextControl = ({ value, onChange, onBlur, placeholder, multiline = false, compact = false, rows = 2, disabled, className }) => {
  const { formatMessage } = useIntl();
  const Control = multiline ? Input.TextArea : Input;
  return (
    <div className={[style['locale-text'], compact ? style['is-compact'] : null, className].filter(Boolean).join(' ')}>
      {LOCALE_TEXT_LANGUAGES.map(language => (
        <div key={language} className={style['locale-text-item']}>
          {compact ? null : <span className={style['locale-text-tag']}>{formatMessage({ id: `localeText_${language}` })}</span>}
          <Control
            value={getLocaleTextValue(value, language)}
            placeholder={language === BASE_LANGUAGE ? placeholder : formatMessage({ id: 'localeTextFallback' })}
            disabled={disabled}
            {...(multiline ? { rows } : {})}
            {...(compact && !multiline ? { prefix: <span className={style['locale-text-prefix']}>{formatMessage({ id: `localeTextShort_${language}` })}</span> } : {})}
            onChange={e => onChange?.(setLocaleTextValue(value, language, e.target.value))}
            onBlur={onBlur}
          />
        </div>
      ))}
    </div>
  );
};

export const LocaleInput = props => {
  const render = useOnChange(props);
  return render(LocaleTextControl);
};
LocaleInput.field = LocaleTextControl;

const LocaleTextAreaControl = props => <LocaleTextControl {...props} multiline />;

export const LocaleTextArea = props => {
  const render = useOnChange(props);
  return render(LocaleTextAreaControl);
};
LocaleTextArea.field = LocaleTextAreaControl;
