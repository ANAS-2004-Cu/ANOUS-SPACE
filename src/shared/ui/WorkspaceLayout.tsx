import React from 'react';
import { AppHeader } from './AppHeader';
import { ToolAccent } from './ToolEmblem';

export type WorkspaceWidth = 'full' | 'narrow' | 'medium' | 'wide';

export interface WorkspaceLayoutProps {
  onOpenCommandPalette: () => void;
  subtitle?: string;
  accent?: ToolAccent;
  width?: WorkspaceWidth;
  dir?: 'ltr' | 'rtl';
  mainClassName?: string;
  footer?: React.ReactNode;
  children: React.ReactNode;
}

export const WorkspaceLayout: React.FC<WorkspaceLayoutProps> = ({
  onOpenCommandPalette,
  subtitle,
  accent = 'terracotta',
  width = 'full',
  dir,
  mainClassName = '',
  footer,
  children,
}) => {
  const widthClass = width !== 'full' ? `workspace-main--${width}` : '';
  const mainClasses = ['workspace-main', widthClass, mainClassName].filter(Boolean).join(' ');

  return (
    <div className="workspace-stage" data-accent={accent}>
      <AppHeader onOpenCommandPalette={onOpenCommandPalette} subtitle={subtitle} accent={accent} />
      <div className="workspace-shell">
        <main dir={dir} className={mainClasses}>
          {children}
        </main>
        {footer}
      </div>
    </div>
  );
};
