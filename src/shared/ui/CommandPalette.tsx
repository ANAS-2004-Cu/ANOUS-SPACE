import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiArrowUpRight, FiCornerDownLeft, FiLock } from 'react-icons/fi';
import { PUBLIC_PROJECTS, ProjectItem } from '../../data/projects';
import { useVault } from '../context/VaultContext';
import { recordRecentProject } from '../utils/recentTools';
import { Modal } from './Modal';
import { Badge, BadgeTone } from './Badge';
import { ToolAccent, ToolEmblem, getToolAccent } from './ToolEmblem';

function accentToTone(accent: ToolAccent): BadgeTone {
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
      item.to ||
      (item.externalUrl && item.externalUrl.startsWith('/') ? item.externalUrl : undefined);
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

  return (
    <Modal open={open} onClose={onClose} wide alignTop showHeader={false}>
      <div onKeyDown={handleKeyDown}>
        <div className="cmd-search-bar">
          <FiSearch size={15} strokeWidth={1.6} color="var(--accent)" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tools, games, or projects... (type 'vault' for private access)"
            className="cmd-search-input"
          />
          <span className="kbd-badge">ESC</span>
        </div>

        <div className="cmd-results">
          {isVaultTrigger && (
            <button
              type="button"
              onClick={handleTriggerVault}
              className="cmd-item cmd-item--vault"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <FiLock size={14} strokeWidth={1.6} color="var(--cat-emerald-accent)" />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                    {isUnlocked ? 'Manage Private Vault' : 'Unlock Private Vault'}
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}>
                    Enter passphrase to access private tools and links
                  </div>
                </div>
              </div>
              <FiCornerDownLeft size={13} strokeWidth={1.6} color="var(--cat-emerald-accent)" />
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
              const accent = getToolAccent(item.id);
              return (
                <button
                  key={item.id}
                  type="button"
                  data-active={active}
                  data-accent={accent}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  onClick={() => handleSelectItem(item)}
                  className="cmd-item"
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 11, minWidth: 0, flex: 1 }}>
                    <span
                      className="workspace-card__icon"
                      style={{ width: 28, height: 28 }}
                    >
                      <ToolEmblem id={item.id} size={14} />
                    </span>

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
                        <Badge tone={accentToTone(accent)}>{item.category}</Badge>
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

        <div className="cmd-footer">
          <span>Navigate with Up/Down arrows</span>
          <span>Enter to open</span>
        </div>
      </div>
    </Modal>
  );
};
