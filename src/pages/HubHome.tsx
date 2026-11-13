import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowRight, FiArrowUpRight, FiClock } from 'react-icons/fi';
import { PUBLIC_PROJECTS, ProjectCategory, ProjectItem } from '../data/projects';
import { AppHeader } from '../shared/ui/AppHeader';
import { useVault } from '../shared/context/VaultContext';
import { getRecentProjectIds, recordRecentProject } from '../shared/utils/recentTools';

type FilterTab = 'All' | ProjectCategory;

export interface HubHomeProps {
  onOpenCommandPalette: () => void;
}

export const HubHome: React.FC<HubHomeProps> = ({ onOpenCommandPalette }) => {
  const navigate = useNavigate();
  const { isUnlocked, privateProjects } = useVault();
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

  const handleOpenProject = (item: ProjectItem) => {
    if (item.type === 'internal' && item.to) {
      const updated = recordRecentProject(item.id);
      setRecentIds(updated);
      navigate(item.to);
    } else if (item.externalUrl) {
      window.open(item.externalUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="workspace-shell">
      <AppHeader onOpenCommandPalette={onOpenCommandPalette} />

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 24 }}>
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
                color: '#6B7280',
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
              {recentTools.map((tool) => (
                <button
                  key={tool.id}
                  onClick={() => handleOpenProject(tool)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 10,
                    padding: '10px 12px',
                    backgroundColor: '#161922',
                    border: '1px solid #252A37',
                    borderRadius: 8,
                    textAlign: 'left',
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 500,
                        color: '#F3F4F6',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {tool.title}
                    </div>
                    <div className="mono" style={{ fontSize: 11, color: '#6B7280' }}>
                      {tool.to}
                    </div>
                  </div>
                  <FiArrowRight size={13} color="#9CA3AF" style={{ flexShrink: 0 }} />
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Category Tabs */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #252A37',
            paddingBottom: 12,
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            {tabs.map((tab) => {
              const active = activeTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 6,
                    fontSize: 13,
                    fontWeight: 500,
                    backgroundColor: active ? '#3B82F6' : 'transparent',
                    color: active ? '#F3F4F6' : '#9CA3AF',
                    border: active ? '1px solid #3B82F6' : '1px solid transparent',
                  }}
                >
                  {tab}
                </button>
              );
            })}
          </div>

          <span className="mono" style={{ fontSize: 12, color: '#6B7280' }}>
            {filteredProjects.length} {filteredProjects.length === 1 ? 'item' : 'items'}
          </span>
        </div>

        {/* Bento Grid */}
        {filteredProjects.length === 0 ? (
          <div
            style={{
              backgroundColor: '#161922',
              border: '1px solid #252A37',
              borderRadius: 10,
              padding: '36px 20px',
              textAlign: 'center',
              color: '#6B7280',
              fontSize: 13,
            }}
          >
            No items configured in this category.
          </div>
        ) : (
          <section className="bento-grid">
            {filteredProjects.map((item) => {
              const isExternal = item.type === 'external';
              return (
                <button
                  key={item.id}
                  onClick={() => handleOpenProject(item)}
                  className={`bento-card ${item.featured ? 'bento-card-featured' : ''}`}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 8,
                      }}
                    >
                      <span
                        className="mono"
                        style={{
                          fontSize: 11,
                          color: '#9CA3AF',
                          backgroundColor: '#0E1015',
                          border: '1px solid #252A37',
                          borderRadius: 4,
                          padding: '2px 7px',
                        }}
                      >
                        {item.badge || item.category}
                      </span>
                      <span className="mono" style={{ fontSize: 11, color: '#6B7280' }}>
                        {item.category}
                      </span>
                    </div>

                    <h2
                      style={{
                        fontSize: 15,
                        fontWeight: 600,
                        color: '#F3F4F6',
                        marginTop: 2,
                      }}
                    >
                      {item.title}
                    </h2>

                    <p
                      style={{
                        fontSize: 13,
                        color: '#9CA3AF',
                        lineHeight: 1.5,
                      }}
                    >
                      {item.description}
                    </p>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      width: '100%',
                      marginTop: 18,
                      paddingTop: 12,
                      borderTop: '1px solid #252A37',
                      fontSize: 12,
                      fontWeight: 500,
                      color: isExternal ? '#3B82F6' : '#F3F4F6',
                    }}
                  >
                    <span>{isExternal ? 'Live Demo' : 'Open Workspace'}</span>
                    {isExternal ? (
                      <FiArrowUpRight size={14} color="#3B82F6" />
                    ) : (
                      <FiArrowRight size={14} color="#9CA3AF" />
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
          borderTop: '1px solid #252A37',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          color: '#6B7280',
          fontSize: 12,
        }}
      >
        <span>© 2026 Anas Gamal</span>
        <span className="mono">ANOUS-SPACE</span>
      </footer>
    </div>
  );
};
