/**
 * Button
 * Thin wrapper that passes all native button attributes through.
 * Used for compose send, attach, login, and any other generic button need.
 * Prefer semantic className from index.css over inline styles.
 */

import React from 'react';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>;

const Button: React.FC<ButtonProps> = ({ children, className = '', ...rest }) => (
  <button className={className} {...rest}>
    {children}
  </button>
);

export default Button;
