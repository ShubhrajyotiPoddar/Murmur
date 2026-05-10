/**
 * Input
 * Wraps a labelled form field with an optional leading icon and trailing slot
 * (used for the password-toggle button).
 * Matches the .field / .field-wrap / .field-icon DOM structure from the design.
 */

import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon?: React.ReactNode;
  trailing?: React.ReactNode;
  hasError?: boolean;
}

const Input: React.FC<InputProps> = ({
  label,
  icon,
  trailing,
  hasError,
  id,
  ...rest
}) => (
  <div className="field">
    <label htmlFor={id}>{label}</label>
    <div className={`field-wrap${hasError ? ' error' : ''}`}>
      {icon && <span className="field-icon">{icon}</span>}
      <input id={id} {...rest} />
      {trailing}
    </div>
  </div>
);

export default Input;
