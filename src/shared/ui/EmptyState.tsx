import React from 'react';
import { Surface } from './Surface';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
}) => {
  return (
    <Surface padded={false}>
      <div className="ui-empty-state">
        {icon && <div className="ui-empty-state__icon">{icon}</div>}
        <div className="ui-empty-state__title">{title}</div>
        {description && <div className="ui-empty-state__desc">{description}</div>}
        {action && <div style={{ marginTop: 6 }}>{action}</div>}
      </div>
    </Surface>
  );
};
