/**
 * Avatar
 * Renders a circular avatar with 2-letter initials.
 * Pass `gray` for the muted (new-friend / search) variant.
 * Pass `dark` for the user-bar (own avatar) variant.
 * Pass `size` to use a different CSS class base (default: "avatar").
 */

import React from 'react';

interface AvatarProps {
  initials: string;
  gray?: boolean;
  dark?: boolean;
  /** Override the root class completely for specialised variants */
  className?: string;
  style?: React.CSSProperties;
}

const Avatar: React.FC<AvatarProps> = ({ initials, gray, dark, className, style }) => {
  let cls = 'avatar';
  if (gray) cls += ' gray';
  if (className) cls = className;

  const darkStyle: React.CSSProperties = dark
    ? { background: 'var(--warm-dark)', fontSize: '10px', width: 32, height: 32 }
    : {};

  return (
    <div className={cls} style={{ ...darkStyle, ...style }}>
      {initials}
    </div>
  );
};

export default Avatar;
