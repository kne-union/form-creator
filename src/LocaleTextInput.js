import { createContext, useContext } from 'react';
import { Input } from 'antd';
import { hooks } from '@kne/react-form-antd';
import { useIntl } from '@kne/react-intl';
import { getLocaleTextValue, isLocaleText, normalizeLanguages, resolveLocaleText, setLocaleTextValue } from './localeText';
import style from './style.module.scss';

const { useOnChange } = hooks;

const LocaleTextContext = createContext([]);

/** 向编辑器内的文案输入下发语言列表 [{ value, label }] */
export const LocaleTextProvider = ({ languages, children }) => <LocaleTextContext.Provider value={normalizeLanguages(languages)}>{children}</LocaleTextContext.Provider>;

/** 当前语言列表：组件 languages 优先，否则取 LocaleTextProvider */
export const useLocaleTextLanguages = languages => {
  const contextLanguages = useContext(LocaleTextContext);
  return languages ? normalizeLanguages(languages) : contextLanguages;
};

/** 文案输入：未配置多语言时为单个输入框；配置后每种语言一个输入框，只填基础语言（首项）时存为字符串 */
export const LocaleTextControl = ({ value, onChange, onBlur, placeholder, multiline = false, compact = false, rows = 2, disabled, className, languages: languagesProp }) => {
  const { formatMessage, locale } = useIntl();
  const languages = useLocaleTextLanguages(languagesProp);
  const Control = multiline ? Input.TextArea : Input;
  const controlProps = { disabled, onBlur, ...(multiline ? { rows } : {}) };

  if (languages.length < 2) {
    const baseLanguage = languages[0]?.value;
    const editLanguage = isLocaleText(value) ? baseLanguage || Object.keys(value).find(key => value[key] === resolveLocaleText(value, locale)) || Object.keys(value)[0] : null;
    return (
      <Control
        {...controlProps}
        className={className}
        value={editLanguage ? value[editLanguage] || '' : (value ?? '')}
        placeholder={placeholder}
        onChange={e => onChange?.(editLanguage ? setLocaleTextValue(value, editLanguage, e.target.value, editLanguage) : e.target.value)}
      />
    );
  }

  const baseLanguage = languages[0];
  return (
    <div className={[style['locale-text'], compact ? style['is-compact'] : null, className].filter(Boolean).join(' ')}>
      {languages.map(language => (
        <div key={language.value} className={style['locale-text-item']}>
          {compact ? null : <span className={style['locale-text-tag']}>{language.label}</span>}
          <Control
            {...controlProps}
            value={getLocaleTextValue(value, language.value, baseLanguage.value)}
            placeholder={language.value === baseLanguage.value ? placeholder : formatMessage({ id: 'localeTextFallback' }, { language: baseLanguage.label })}
            {...(compact && !multiline ? { prefix: <span className={style['locale-text-prefix']}>{language.label}</span> } : {})}
            onChange={e => onChange?.(setLocaleTextValue(value, language.value, e.target.value, baseLanguage.value))}
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
