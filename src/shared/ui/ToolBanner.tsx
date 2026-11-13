import React from 'react';
import { ToolAccent, ToolEmblem } from './ToolEmblem';

export interface ToolBannerProps {
  toolId: string;
  accent: ToolAccent;
  eyebrow: string;
  title: string;
  description: string;
  actions?: React.ReactNode;
  dir?: 'ltr' | 'rtl';
}

export const ToolBanner: React.FC<ToolBannerProps> = ({
  toolId,
  accent,
  eyebrow,
  title,
  description,
  actions,
  dir,
}) => {
  return (
    <section
      className="tool-banner animate-enter"
      data-accent={accent}
      dir={dir}
      style={{ ['--stagger-index' as string]: 0 }}
    >
      <div className="tool-banner__left">
        <div className="tool-banner__emblem" data-accent={accent}>
          <ToolEmblem id={toolId} size={22} />
        </div>
        <div className="tool-banner__copy">
          <span className="tool-banner__eyebrow">{eyebrow}</span>
          <h1 className="tool-banner__title">{title}</h1>
          <p className="tool-banner__desc">{description}</p>
        </div>
      </div>

      {actions && <div className="tool-banner__actions">{actions}</div>}
    </section>
  );
};
