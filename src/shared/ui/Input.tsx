import React, { forwardRef } from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: React.ReactNode;
  hint?: React.ReactNode;
  error?: string | null;
  mono?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, hint, error, mono = false, className = '', id, ...rest }, ref) => {
    const inputClasses = [
      'ui-input',
      mono ? 'ui-input--mono' : '',
      error ? 'ui-input--error' : '',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div className="ui-field">
        {(label || hint) && (
          <div className="ui-field__header">
            {label && (
              <label htmlFor={id} className="ui-field__label">
                {label}
              </label>
            )}
            {hint && <span className="ui-field__hint">{hint}</span>}
          </div>
        )}
        <input ref={ref} id={id} className={inputClasses} {...rest} />
        {error && <span className="ui-field__error">{error}</span>}
      </div>
    );
  }
);

Input.displayName = 'Input';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: React.ReactNode;
  hint?: React.ReactNode;
  mono?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, hint, mono = false, className = '', id, children, ...rest }, ref) => {
    const selectClasses = ['ui-select', mono ? 'ui-input--mono' : '', className]
      .filter(Boolean)
      .join(' ');

    return (
      <div className="ui-field">
        {(label || hint) && (
          <div className="ui-field__header">
            {label && (
              <label htmlFor={id} className="ui-field__label">
                {label}
              </label>
            )}
            {hint && <span className="ui-field__hint">{hint}</span>}
          </div>
        )}
        <select ref={ref} id={id} className={selectClasses} {...rest}>
          {children}
        </select>
      </div>
    );
  }
);

Select.displayName = 'Select';
