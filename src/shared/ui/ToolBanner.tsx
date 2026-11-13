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

      <svg
        className="tool-banner__decor"
        viewBox="0 0 160 80"
        fill="none"
        aria-hidden="true"
      >
        <circle cx="132" cy="18" r="36" stroke="currentColor" strokeWidth="1" strokeDasharray="3 4" />
        <circle cx="132" cy="18" r="20" stroke="currentColor" strokeWidth="1" />
        <path d="M112 8H144V40" stroke="currentColor" strokeWidth="1.2" opacity="0.6" />
      </svg>
    </section>
  );
};
