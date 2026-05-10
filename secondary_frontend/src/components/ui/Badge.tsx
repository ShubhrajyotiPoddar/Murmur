/**
 * Badge
 * The tiny red dot that appears on the Pending nav button
 * when there are incoming requests or accepted-friend notifications.
 * The `pulse` prop triggers the CSS keyframe animation defined in index.css.
 */

import React from 'react';

interface BadgeProps {
  pulse?: boolean;
}

const Badge: React.FC<BadgeProps> = ({ pulse }) => (
  <span className={`badge${pulse ? ' pulse' : ''}`} />
);

export default Badge;
