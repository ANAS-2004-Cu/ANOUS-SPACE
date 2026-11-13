import React from 'react';

export type BadgeTone =
  | 'neutral'
  | 'accent'
  | 'sage'
  | 'ochre'
  | 'slate'
  | 'success'
  | 'warning'
  | 'danger';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  pill?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  tone = 'neutral',
  pill = false,
  className = '',
  children,
  ...rest
}) => {
  const classes = [
    'ui-badge',
    tone !== 'neutral' ? `ui-badge--${tone}` : '',
    pill ? 'ui-badge--pill' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <span className={classes} {...rest}>
      {children}
    </span>
  );
};
