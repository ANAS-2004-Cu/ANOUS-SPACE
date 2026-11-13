import React from 'react';
import { ToolAccent } from './ToolEmblem';

export interface SurfaceProps extends React.HTMLAttributes<HTMLElement> {
  as?: 'section' | 'div' | 'article';
  variant?: 'default' | 'elevated' | 'accent' | 'recessed';
  accent?: ToolAccent;
  padded?: boolean;
}

export const Surface: React.FC<SurfaceProps> = ({
  as: Component = 'section',
  variant = 'default',
  accent,
  padded = true,
  className = '',
  children,
  ...rest
}) => {
  const classes = [
    variant === 'recessed' ? 'ui-surface--recessed' : 'ui-surface',
    variant === 'elevated' ? 'ui-surface--elevated' : '',
    variant === 'accent' ? 'ui-surface--accent' : '',
    padded ? 'ui-surface--padded' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <Component className={classes} data-accent={accent} {...rest}>
      {children}
    </Component>
  );
};
