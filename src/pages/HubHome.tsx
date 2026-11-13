import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiArrowRight,
  FiArrowUpRight,
  FiClock,
  FiCode,
  FiMail,
  FiGrid,
  FiHash,
  FiLayers,
  FiLock,
} from 'react-icons/fi';
import { PUBLIC_PROJECTS, ProjectCategory, ProjectItem } from '../data/projects';
import { AppHeader } from '../shared/ui/AppHeader';
import { useVault } from '../shared/context/VaultContext';
import { getRecentProjectIds, recordRecentProject } from '../shared/utils/recentTools';

type FilterTab = 'All' | ProjectCategory;

export interface HubHomeProps {
  onOpenCommandPalette: () => void;
  commandPaletteOpen?: boolean;
}

const CATEGORY_ACCENT: Record<
  ProjectCategory,
  { color: string; subtleBg: string; borderTint: string }
> = {
  Tools: {
    color: '#3B82F6',
    subtleBg: 'rgba(59, 130, 246, 0.14)',
    borderTint: 'rgba(59, 130, 246, 0.35)',
  },
  Games: {
    color: '#10B981',
    subtleBg: 'rgba(16, 185, 129, 0.14)',
    borderTint: 'rgba(16, 185, 129, 0.35)',
  },
  Projects: {
    color: '#8B5CF6',
    subtleBg: 'rgba(139, 92, 246, 0.14)',
    borderTint: 'rgba(139, 92, 246, 0.35)',
  },
  Private: {
    color: '#F43F5E',
    subtleBg: 'rgba(244, 63, 94, 0.14)',
    borderTint: 'rgba(244, 63, 94, 0.35)',
  },
};

function renderProjectIcon(item: ProjectItem, color: string) {
  switch (item.id) {
    case 'scratchpad':
      return <FiCode size={15} color={color} />;
    case 'temp-mail':
      return <FiMail size={15} color={color} />;
    case 'tic-tac-toe':
      return <FiGrid size={15} color={color} />;
    case 'guess-game':
      return <FiHash size={15} color={color} />;
    case 'ecommerce-showcase':
      return <FiLayers size={15} color={color} />;
    default:
      return item.category === 'Private' ? (
        <FiLock size={15} color={color} />
      ) : (
        <FiLayers size={15} color={color} />
      );
  }
}

function renderCardArtwork(id: string) {
  switch (id) {
    case 'scratchpad':
      return (
        <svg
          className="card-artwork"
          viewBox="0 0 120 120"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M46 28C38 28 34 32 34 40V50C34 56 28 60 22 60C28 60 34 64 34 70V80C34 88 38 92 46 92" />
          <path d="M74 28C82 28 86 32 86 40V50C86 56 92 60 98 60C92 60 86 64 86 70V80C86 88 82 92 74 92" />
          <line x1="54" y1="60" x2="66" y2="60" />
        </svg>
      );
    case 'temp-mail':
      return (
        <svg
          className="card-artwork"
          viewBox="0 0 120 120"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="20" y="34" width="80" height="54" rx="6" />
          <path d="M22 38L60 66L98 38" />
          <line x1="22" y1="84" x2="46" y2="62" />
          <line x1="98" y1="84" x2="74" y2="62" />
        </svg>
      );
    case 'tic-tac-toe':
      return (
        <svg
          className="card-artwork"
          viewBox="0 0 120 120"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <line x1="48" y1="24" x2="48" y2="96" />
          <line x1="74" y1="24" x2="74" y2="96" />
          <line x1="24" y1="48" x2="96" y2="48" />
          <line x1="24" y1="74" x2="96" y2="74" />
          <circle cx="61" cy="61" r="6" />
          <path d="M31 31L41 41M41 31L31 41" />
        </svg>
      );
    case 'guess-game':
      return (
        <svg
          className="card-artwork"
          viewBox="0 0 120 120"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <line x1="24" y1="86" x2="96" y2="86" />
          <line x1="30" y1="86" x2="30" y2="66" />
          <line x1="45" y1="86" x2="45" y2="54" />
          <line x1="60" y1="86" x2="60" y2="36" />
          <line x1="75" y1="86" x2="75" y2="60" />
          <line x1="90" y1="86" x2="90" y2="46" />
          <circle cx="60" cy="30" r="3" />
        </svg>
      );
    default:
      return (
        <svg
          className="card-artwork"
          viewBox="0 0 120 120"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="24" y="30" width="72" height="56" rx="5" />
          <line x1="24" y1="44" x2="96" y2="44" />
          <rect x="34" y="54" width="22" height="22" rx="3" />
          <line x1="64" y1="58" x2="86" y2="58" />
          <line x1="64" y1="68" x2="80" y2="68" />
        </svg>
      );
  }
}

export const HubHome: React.FC<HubHomeProps> = ({
  onOpenCommandPalette,
  commandPaletteOpen = false,
}) => {
  const navigate = useNavigate();
  const { isUnlocked, privateProjects, vaultModalOpen } = useVault();
  const [activeTab, setActiveTab] = useState<FilterTab>('All');
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

  const recentTools = useMemo<ProjectItem[]>(() => {
    return recentIds
      .map((id) => allProjects.find((p) => p.id === id && p.type === 'internal'))
      .filter((p): p is ProjectItem => Boolean(p));
  }, [recentIds, allProjects]);

  const filteredProjects = useMemo<ProjectItem[]>(() => {
    if (activeTab === 'All') return allProjects;
    return allProjects.filter((item) => item.category === activeTab);
  }, [allProjects, activeTab]);

  const tabs: FilterTab[] = useMemo(() => {
    const base: FilterTab[] = ['All', 'Tools', 'Games', 'Projects'];
    if (isUnlocked) {
      base.push('Private');
    }
    return base;
  }, [isUnlocked]);

  const handleOpenProject = useCallback(
    (item: ProjectItem) => {
      if (item.type === 'internal' && item.to) {
        const updated = recordRecentProject(item.id);
        setRecentIds(updated);
        navigate(item.to);
      } else if (item.externalUrl) {
        window.open(item.externalUrl, '_blank', 'noopener,noreferrer');
      }
    },
    [navigate]
  );

  // Number shortcuts (1-9) to launch visible Hub cards directly on desktop
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
        const selected = filteredProjects[index];
        if (selected) {
          e.preventDefault();
          handleOpenProject(selected);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filteredProjects, commandPaletteOpen, vaultModalOpen, handleOpenProject]);

  return (
    <div className="workspace-shell">
      <AppHeader onOpenCommandPalette={onOpenCommandPalette} />

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Clean Hero Section: Bold Title + Single Punchy Subtitle */}
        <section style={{ maxWidth: 680, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <h1
            style={{
              fontSize: 'clamp(20px, 2.8vw, 26px)',
              fontWeight: 600,
              color: 'var(--text-primary)',
              letterSpacing: '-0.02em',
            }}
          >
            Personal Engineering Workspace &amp; Micro-Tools
          </h1>
          <p
            style={{
              fontSize: 14,
              color: 'var(--text-secondary)',
              lineHeight: 1.55,
            }}
          >
            Self-contained developer utilities, tactical game prototypes, and production showcases
            in one keyboard-first command deck.
          </p>
        </section>

        {/* Recent Bar (Up to 3 recently opened internal tools) */}
        {recentTools.length > 0 && (
          <section style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 11,
                fontWeight: 500,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}
            >
              <FiClock size={12} />
              <span>Recent</span>
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                gap: 10,
              }}
            >
              {recentTools.map((tool) => {
                const accent = CATEGORY_ACCENT[tool.category];
                return (
                  <button
                    key={tool.id}
                    onClick={() => handleOpenProject(tool)}
                    className="recent-chip"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 10,
                      padding: '10px 12px',
                      textAlign: 'left',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        minWidth: 0,
                      }}
                    >
                      <span
                        style={{
                          width: 26,
                          height: 26,
                          borderRadius: 6,
                          backgroundColor: accent.subtleBg,
                          border: `1px solid ${accent.borderTint}`,
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        {renderProjectIcon(tool, accent.color)}
                      </span>
                      <div style={{ minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: 500,
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
                    <FiArrowRight
                      size={13}
                      color="var(--text-secondary)"
                      style={{ flexShrink: 0 }}
                    />
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* Category Tabs */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid var(--border-subtle)',
            paddingBottom: 12,
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            {tabs.map((tab) => {
              const active = activeTab === tab;
              const tabColor =
                tab === 'Private'
                  ? '#F43F5E'
                  : tab === 'Tools'
                  ? '#3B82F6'
                  : tab === 'Games'
                  ? '#10B981'
                  : tab === 'Projects'
                  ? '#8B5CF6'
                  : 'var(--accent)';
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 6,
                    fontSize: 13,
                    fontWeight: 500,
                    backgroundColor: active ? tabColor : 'transparent',
                    color: active ? '#FFFFFF' : 'var(--text-secondary)',
                    border: active ? `1px solid ${tabColor}` : '1px solid transparent',
                  }}
                >
                  {tab}
                </button>
              );
            })}
          </div>

          <span className="mono" style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {filteredProjects.length} {filteredProjects.length === 1 ? 'item' : 'items'}
          </span>
        </div>

        {/* Bento Grid */}
        {filteredProjects.length === 0 ? (
          <div
            style={{
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 10,
              padding: '36px 20px',
              textAlign: 'center',
              color: 'var(--text-muted)',
              fontSize: 13,
            }}
          >
            No items configured in this category.
          </div>
        ) : (
          <section className="bento-grid">
            {filteredProjects.map((item, idx) => {
              const isExternal = item.type === 'external';
              const isShowcaseSpan = item.category === 'Projects' || Boolean(item.featured);
              const accent = CATEGORY_ACCENT[item.category];
              const shortcutKey = idx < 9 ? String(idx + 1) : null;

              return (
                <button
                  key={item.id}
                  onClick={() => handleOpenProject(item)}
                  className={`bento-card ${isShowcaseSpan ? 'bento-card-featured' : ''}`}
                  style={
                    {
                      '--card-accent': accent.color,
                    } as React.CSSProperties
                  }
                >
                  {renderCardArtwork(item.id)}

                  <div
                    style={{
                      position: 'relative',
                      zIndex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 10,
                      width: '100%',
                    }}
                  >
                    {isShowcaseSpan && (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '7px 10px',
                          backgroundColor: 'var(--bg-app)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: 7,
                          marginBottom: 4,
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span
                            style={{
                              width: 7,
                              height: 7,
                              borderRadius: '50%',
                              backgroundColor: 'var(--border-hover)',
                            }}
                          />
                          <span
                            style={{
                              width: 7,
                              height: 7,
                              borderRadius: '50%',
                              backgroundColor: 'var(--border-hover)',
                            }}
                          />
                          <span
                            className="mono"
                            style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 4 }}
                          >
                            production-storefront
                          </span>
                        </div>
                        <span
                          className="mono"
                          style={{ fontSize: 10, color: accent.color, fontWeight: 500 }}
                        >
                          EXTERNAL SHOWCASE
                        </span>
                      </div>
                    )}

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 8,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: 7,
                            backgroundColor: accent.subtleBg,
                            border: `1px solid ${accent.borderTint}`,
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {renderProjectIcon(item, accent.color)}
                        </span>
                        <span
                          className="mono"
                          style={{
                            fontSize: 11,
                            color: accent.color,
                            backgroundColor: accent.subtleBg,
                            border: `1px solid ${accent.borderTint}`,
                            borderRadius: 5,
                            padding: '2px 7px',
                            fontWeight: 500,
                          }}
                        >
                          {item.badge || item.category}
                        </span>
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

                    <h2
                      style={{
                        fontSize: 15,
                        fontWeight: 600,
                        color: 'var(--text-primary)',
                        marginTop: 2,
                      }}
                    >
                      {item.title}
                    </h2>

                    <p
                      style={{
                        fontSize: 13,
                        color: 'var(--text-secondary)',
                        lineHeight: 1.55,
                        maxWidth: isShowcaseSpan ? '90%' : undefined,
                      }}
                    >
                      {item.description}
                    </p>
                  </div>

                  <div
                    style={{
                      position: 'relative',
                      zIndex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      width: '100%',
                      marginTop: 18,
                      paddingTop: 12,
                      borderTop: '1px solid var(--border-subtle)',
                      fontSize: 12,
                      fontWeight: 500,
                      color: isExternal ? accent.color : 'var(--text-primary)',
                    }}
                  >
                    <span>{isExternal ? 'Live Demo' : 'Open Workspace'}</span>
                    {isExternal ? (
                      <FiArrowUpRight size={14} className="card-arrow" color={accent.color} />
                    ) : (
                      <FiArrowRight
                        size={14}
                        className="card-arrow-right"
                        color="var(--text-secondary)"
                      />
                    )}
                  </div>
                </button>
              );
            })}
          </section>
        )}
      </main>

      <footer
        style={{
          marginTop: 48,
          padding: '20px 0',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          color: 'var(--text-muted)',
          fontSize: 12,
          flexWrap: 'wrap',
          gap: 8,
        }}
      >
        <span>© 2026 Anas Gamal</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span className="mono hide-on-mobile">Press 1–5 to launch · Ctrl+K to search</span>
          <span className="mono">ANOUS-SPACE</span>
        </div>
      </footer>
    </div>
  );
};
