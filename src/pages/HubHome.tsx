import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowRight, FiArrowUpRight, FiClock, FiLayers, FiExternalLink } from 'react-icons/fi';
import { PUBLIC_PROJECTS, ProjectCategory, ProjectItem } from '../data/projects';
import { WorkspaceLayout } from '../shared/ui/WorkspaceLayout';
import { SegmentedControl, SegmentedOption } from '../shared/ui/SegmentedControl';
import { Badge, BadgeTone } from '../shared/ui/Badge';
import { EmptyState } from '../shared/ui/EmptyState';
import {
  GeometricCardDecor,
  HeroGeometry,
  ToolAccent,
  ToolEmblem,
  getToolAccent,
} from '../shared/ui/ToolEmblem';
import { useVault } from '../shared/context/VaultContext';
import { getRecentProjectIds, recordRecentProject } from '../shared/utils/recentTools';

type WorkspaceFilter = 'All' | 'Tools' | 'Games' | 'Private';

export interface HubHomeProps {
  onOpenCommandPalette: () => void;
  commandPaletteOpen?: boolean;
}

function accentToBadgeTone(accent: ToolAccent): BadgeTone {
  switch (accent) {
    case 'cyan':
      return 'cyan';
    case 'violet':
      return 'violet';
    case 'amber':
      return 'amber';
    case 'emerald':
      return 'emerald';
    case 'indigo':
      return 'indigo';
    default:
      return 'accent';
  }
}

export const HubHome: React.FC<HubHomeProps> = ({
  onOpenCommandPalette,
  commandPaletteOpen = false,
}) => {
  const navigate = useNavigate();
  const { isUnlocked, privateProjects, vaultModalOpen } = useVault();
  const [activeTab, setActiveTab] = useState<WorkspaceFilter>('All');
  const [recentIds, setRecentIds] = useState<string[]>([]);

  useEffect(() => {
    setRecentIds(getRecentProjectIds());
  }, []);

  useEffect(() => {
    if (!isUnlocked && activeTab === 'Private') {
      setActiveTab('All');
    }
  }, [isUnlocked, activeTab]);

  const allProjects = useMemo<ProjectItem[]>(() => {
    return isUnlocked ? [...PUBLIC_PROJECTS, ...privateProjects] : PUBLIC_PROJECTS;
  }, [isUnlocked, privateProjects]);

  const workspaceTools = useMemo<ProjectItem[]>(() => {
    return allProjects.filter(
      (item) => item.type === 'internal' || item.category === 'Private'
    );
  }, [allProjects]);

  const externalProjects = useMemo<ProjectItem[]>(() => {
    return allProjects.filter(
      (item) => item.type === 'external' && item.category !== 'Private'
    );
  }, [allProjects]);

  const recentTools = useMemo<ProjectItem[]>(() => {
    return recentIds
      .map((id) => allProjects.find((p) => p.id === id && p.type === 'internal'))
      .filter((p): p is ProjectItem => Boolean(p));
  }, [recentIds, allProjects]);

  const filteredTools = useMemo<ProjectItem[]>(() => {
    if (activeTab === 'All') return workspaceTools;
    return workspaceTools.filter((item) => item.category === (activeTab as ProjectCategory));
  }, [workspaceTools, activeTab]);

  const visibleExternalProjects = useMemo<ProjectItem[]>(() => {
    return activeTab === 'All' ? externalProjects : [];
  }, [activeTab, externalProjects]);

  const keyboardLaunchables = useMemo<ProjectItem[]>(() => {
    return [...filteredTools, ...visibleExternalProjects];
  }, [filteredTools, visibleExternalProjects]);

  const filterOptions: SegmentedOption<WorkspaceFilter>[] = useMemo(() => {
    const base: SegmentedOption<WorkspaceFilter>[] = [
      { value: 'All', label: 'All' },
      { value: 'Tools', label: 'Tools' },
      { value: 'Games', label: 'Games' },
    ];
    if (isUnlocked) {
      base.push({ value: 'Private', label: 'Private' });
    }
    return base;
  }, [isUnlocked]);

  const handleOpenProject = useCallback(
    (item: ProjectItem) => {
      const internalTarget =
        item.to ||
        (item.externalUrl && item.externalUrl.startsWith('/') ? item.externalUrl : undefined);
      if (item.type === 'internal' || internalTarget) {
        if (item.category !== 'Private') {
          const updated = recordRecentProject(item.id);
          setRecentIds(updated);
        }
        navigate(internalTarget || '/');
      } else if (item.externalUrl) {
        window.open(item.externalUrl, '_blank', 'noopener,noreferrer');
      }
    },
    [navigate]
  );

  // Number shortcuts (1-9) to launch visible workspace & external cards
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (commandPaletteOpen || vaultModalOpen) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }

      if (e.key >= '1' && e.key <= '9') {
        const index = Number(e.key) - 1;
        const selected = keyboardLaunchables[index];
        if (selected) {
          e.preventDefault();
          handleOpenProject(selected);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [keyboardLaunchables, commandPaletteOpen, vaultModalOpen, handleOpenProject]);

  return (
    <WorkspaceLayout
      onOpenCommandPalette={onOpenCommandPalette}
      accent="cobalt"
      footer={
        <footer className="workspace-footer">
          <span>© 2026 Anas Gamal</span>
          <div className="workspace-footer__meta">
            <span className="mono hide-on-mobile">
              Press 1–{Math.min(9, keyboardLaunchables.length)} to launch · Ctrl+K to search
            </span>
            <span className="mono">ANOUS-SPACE</span>
          </div>
        </footer>
      }
    >
      {/* Elevated Workspace Hero */}
      <section className="hub-hero animate-enter" style={{ ['--stagger-index' as string]: 0 }}>
        <div className="hub-hero__glow" aria-hidden="true" />
        <div className="hub-hero__copy">
          <div className="hub-hero__eyebrow-row">
            <span className="hub-hero__eyebrow">
              <span className="live-dot" />
              <span>Personal Engineering Workspace</span>
            </span>
            <Badge tone="accent" pill>
              {allProjects.length} Modules Ready
            </Badge>
          </div>
          <h1 className="hub-hero__title">Tools, Utilities &amp; Projects</h1>
          <p className="hub-hero__subtitle">
            Keyboard-first micro-apps, disposable inbox tooling, and external builds organized in
            one fast workspace.
          </p>
          <div className="hub-hero__shortcuts hide-on-mobile">
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <span className="kbd-badge">1–{Math.min(9, keyboardLaunchables.length)}</span>
              <span>Quick Launch</span>
            </span>
            <span>·</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <span className="kbd-badge">Ctrl K</span>
              <span>Command Palette</span>
            </span>
          </div>
        </div>

        <HeroGeometry />
      </section>

      {/* Recent Tools Strip */}
      {recentTools.length > 0 && (
        <section
          className="hub-section animate-enter"
          aria-label="Recently used tools"
          style={{ ['--stagger-index' as string]: 1 }}
        >
          <div className="hub-section-label">
            <span className="hub-section-label__title">
              <FiClock size={12} />
              <span>Recent</span>
            </span>
          </div>

          <div className="recent-grid">
            {recentTools.map((tool, idx) => {
              const accent = getToolAccent(tool.id);
              return (
                <button
                  key={tool.id}
                  type="button"
                  onClick={() => handleOpenProject(tool)}
                  data-accent={accent}
                  className="recent-chip animate-enter"
                  style={{ ['--stagger-index' as string]: idx + 1 }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                    <span className="workspace-card__icon" style={{ width: 30, height: 30 }}>
                      <ToolEmblem id={tool.id} size={15} />
                    </span>
                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: 'var(--text-primary)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {tool.title}
                      </div>
                      <div className="mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {tool.to}
                      </div>
                    </div>
                  </div>
                  <FiArrowRight size={14} className="recent-chip__arrow" />
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* Workspace Mini-Apps & Utilities */}
      <section
        className="hub-section animate-enter"
        aria-label="Workspace applications"
        style={{ ['--stagger-index' as string]: 2 }}
      >
        <div className="hub-toolbar">
          <SegmentedControl
            options={filterOptions}
            value={activeTab}
            onChange={setActiveTab}
            accentActive
            ariaLabel="Filter workspace tools by category"
          />

          <span className="mono" style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {filteredTools.length} {filteredTools.length === 1 ? 'workspace' : 'workspaces'}
          </span>
        </div>

        {filteredTools.length === 0 ? (
          <EmptyState
            icon={<FiLayers size={18} />}
            title="No tools in this category"
            description="Switch filters or press Ctrl+K to search all workspace items."
          />
        ) : (
          <div key={activeTab} className="hub-grid">
            {filteredTools.map((item, idx) => {
              const isExternal = item.type === 'external';
              const shortcutKey = idx < 9 ? String(idx + 1) : null;
              const accent = getToolAccent(item.id);
              const badgeTone = accentToBadgeTone(accent);

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleOpenProject(item)}
                  data-accent={accent}
                  className="workspace-card animate-enter"
                  style={{ ['--stagger-index' as string]: idx }}
                >
                  <GeometricCardDecor />

                  <div className="workspace-card__body">
                    <div className="workspace-card__top">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span className="workspace-card__icon">
                          <ToolEmblem id={item.id} size={17} />
                        </span>
                        <Badge tone={badgeTone}>{item.badge || item.category}</Badge>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span className="mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                          {item.category}
                        </span>
                        {shortcutKey && (
                          <span
                            className="kbd-badge hide-on-mobile"
                            title={`Press ${shortcutKey} to launch`}
                          >
                            {shortcutKey}
                          </span>
                        )}
                      </div>
                    </div>

                    <h2 className="workspace-card__title">{item.title}</h2>
                    <p className="workspace-card__desc">{item.description}</p>
                  </div>

                  <div className="workspace-card__footer">
                    <span>{isExternal ? 'Open Link' : 'Open Workspace'}</span>
                    {isExternal ? (
                      <FiArrowUpRight size={15} className="workspace-card__arrow" />
                    ) : (
                      <FiArrowRight size={15} className="workspace-card__arrow" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* Extensible External Projects Section */}
      {visibleExternalProjects.length > 0 && (
        <section
          className="hub-section animate-enter"
          aria-label="External projects"
          style={{ ['--stagger-index' as string]: 4 }}
        >
          <div className="hub-section-label">
            <span className="hub-section-label__title">
              <FiExternalLink size={12} />
              <span>External Projects</span>
            </span>
            <span className="mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              {visibleExternalProjects.length}{' '}
              {visibleExternalProjects.length === 1 ? 'link' : 'links'}
            </span>
          </div>

          <div className="external-projects-list">
            {visibleExternalProjects.map((project, idx) => {
              const shortcutIndex = filteredTools.length + idx;
              const shortcutKey = shortcutIndex < 9 ? String(shortcutIndex + 1) : null;
              const accent = getToolAccent(project.id);

              return (
                <button
                  key={project.id}
                  type="button"
                  onClick={() => handleOpenProject(project)}
                  data-accent={accent}
                  className="external-project-card animate-enter"
                  style={{ ['--stagger-index' as string]: idx + 2 }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 14,
                      minWidth: 0,
                      flex: 1,
                    }}
                  >
                    <span
                      className="workspace-card__icon"
                      style={{ width: 40, height: 40, marginTop: 2 }}
                    >
                      <ToolEmblem id={project.id} size={20} />
                    </span>

                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 6,
                        minWidth: 0,
                        flex: 1,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <Badge tone="indigo">{project.badge || 'External'}</Badge>
                        {shortcutKey && (
                          <span
                            className="kbd-badge hide-on-mobile"
                            title={`Press ${shortcutKey} to launch`}
                          >
                            {shortcutKey}
                          </span>
                        )}
                      </div>
                      <h2 className="workspace-card__title">{project.title}</h2>
                      <p className="workspace-card__desc">{project.description}</p>

                      {project.stack && project.stack.length > 0 && (
                        <div className="external-project-card__stack">
                          {project.stack.map((tech) => (
                            <span key={tech} className="stack-pill">
                              {tech}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <span className="external-project-card__cta">
                    <span>Visit Repository</span>
                    <FiArrowUpRight size={14} className="external-project-card__cta-arrow" />
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      )}
    </WorkspaceLayout>
  );
};
