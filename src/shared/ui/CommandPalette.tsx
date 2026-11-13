import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiArrowUpRight, FiCornerDownLeft, FiLock } from 'react-icons/fi';
import { PUBLIC_PROJECTS, ProjectItem } from '../../data/projects';
import { useVault } from '../context/VaultContext';
import { recordRecentProject } from '../utils/recentTools';

export interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ open, onClose }) => {
  const navigate = useNavigate();
  const { isUnlocked, privateProjects, openVaultModal } = useVault();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const allItems = useMemo<ProjectItem[]>(() => {
    return isUnlocked ? [...PUBLIC_PROJECTS, ...privateProjects] : PUBLIC_PROJECTS;
  }, [isUnlocked, privateProjects]);

  const normalizedQuery = query.trim().toLowerCase();
  const isVaultTrigger = normalizedQuery === 'vault';

  const filteredItems = useMemo(() => {
    if (!normalizedQuery) return allItems;
    return allItems.filter((item) => {
      const haystack = [
        item.title,
        item.description,
        item.category,
        item.badge || '',
        ...(item.keywords || []),
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [allItems, normalizedQuery]);

  useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 30);
    }
  }, [open]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [normalizedQuery]);

  const handleSelectItem = (item: ProjectItem) => {
    onClose();
    const internalTarget =
      item.to || (item.externalUrl && item.externalUrl.startsWith('/') ? item.externalUrl : undefined);
    if (item.type === 'internal' || internalTarget) {
      if (item.category !== 'Private') {
        recordRecentProject(item.id);
      }
      navigate(internalTarget || '/');
    } else if (item.externalUrl) {
      window.open(item.externalUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleTriggerVault = () => {
    onClose();
    openVaultModal();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
      return;
    }

    if (isVaultTrigger && e.key === 'Enter') {
      e.preventDefault();
      handleTriggerVault();
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (filteredItems.length > 0) {
        setSelectedIndex((prev) => (prev + 1) % filteredItems.length);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (filteredItems.length > 0) {
        setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % filteredItems.length);
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const target = filteredItems[selectedIndex];
      if (target) {
        handleSelectItem(target);
      }
    }
  };

  if (!open) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'var(--bg-backdrop)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: '10vh 16px 16px',
        zIndex: 1100,
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 560,
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--card-top-highlight), var(--card-shadow-hover)',
          borderRadius: 10,
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '12px 14px',
            borderBottom: '1px solid var(--border-subtle)',
            backgroundColor: 'var(--bg-input)',
          }}
        >
          <FiSearch size={15} strokeWidth={1.5} color="var(--text-muted)" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tools, games, or projects..."
            style={{
              flex: 1,
              backgroundColor: 'transparent',
              border: 'none',
              fontSize: 13,
              color: 'var(--text-primary)',
            }}
          />
          <span className="kbd-badge">ESC</span>
        </div>

        <div style={{ maxHeight: 340, overflowY: 'auto', padding: 6 }}>
          {isVaultTrigger && (
            <button
              onClick={handleTriggerVault}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 12px',
                borderRadius: 7,
                backgroundColor: 'var(--accent-subtle)',
                border: '1px solid var(--accent-border)',
                marginBottom: 6,
                textAlign: 'left',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <FiLock size={14} strokeWidth={1.5} color="var(--accent)" />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>
                    {isUnlocked ? 'Manage Private Vault' : 'Unlock Private Vault'}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                    Authenticate with /api/vault to access restricted tools
                  </div>
                </div>
              </div>
              <FiCornerDownLeft size={13} strokeWidth={1.5} color="var(--accent)" />
            </button>
          )}

          {filteredItems.length === 0 && !isVaultTrigger ? (
            <div
              style={{
                padding: '28px 16px',
                textAlign: 'center',
                color: 'var(--text-muted)',
                fontSize: 13,
              }}
            >
              No matching tools or projects found.
            </div>
          ) : (
            filteredItems.map((item, idx) => {
              const active = idx === selectedIndex;
              return (
                <button
                  key={item.id}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  onClick={() => handleSelectItem(item)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                    padding: '10px 12px',
                    borderRadius: 7,
                    backgroundColor: active ? 'var(--bg-elevated)' : 'transparent',
                    textAlign: 'left',
                  }}
                >
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: 500,
                          color: 'var(--text-primary)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {item.title}
                      </span>
                      <span
                        className="mono"
                        style={{
                          fontSize: 10,
                          color: 'var(--text-secondary)',
                          backgroundColor: 'var(--bg-app)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: 4,
                          padding: '1px 6px',
                        }}
                      >
                        {item.category}
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: 'var(--text-muted)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        marginTop: 2,
                      }}
                    >
                      {item.description}
                    </div>
                  </div>
                  {item.type === 'external' ? (
                    <FiArrowUpRight size={14} color="var(--text-muted)" />
                  ) : (
                    <FiCornerDownLeft
                      size={13}
                      color={active ? 'var(--accent)' : 'var(--text-muted)'}
                    />
                  )}
                </button>
              );
            })
          )}
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 14px',
            borderTop: '1px solid var(--border-subtle)',
            backgroundColor: 'var(--bg-input)',
            fontSize: 11,
            color: 'var(--text-muted)',
          }}
        >
          <span>Navigate with Up/Down arrows</span>
          <span>Enter to open</span>
        </div>
      </div>
    </div>
  );
};
