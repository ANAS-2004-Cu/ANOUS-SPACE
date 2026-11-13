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
    if (item.type === 'internal' && item.to) {
      recordRecentProject(item.id);
      navigate(item.to);
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
        backgroundColor: 'rgba(9, 10, 14, 0.78)',
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
          backgroundColor: '#161922',
          border: '1px solid #252A37',
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
            borderBottom: '1px solid #252A37',
            backgroundColor: '#11131A',
          }}
        >
          <FiSearch size={15} color="#6B7280" />
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
              color: '#F3F4F6',
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
                backgroundColor: 'rgba(59, 130, 246, 0.12)',
                border: '1px solid rgba(59, 130, 246, 0.35)',
                marginBottom: 6,
                textAlign: 'left',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <FiLock size={14} color="#3B82F6" />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: '#F3F4F6' }}>
                    {isUnlocked ? 'Manage Private Vault' : 'Unlock Private Vault'}
                  </div>
                  <div style={{ fontSize: 11, color: '#9CA3AF' }}>
                    Authenticate with /api/vault to access restricted tools
                  </div>
                </div>
              </div>
              <FiCornerDownLeft size={13} color="#3B82F6" />
            </button>
          )}

          {filteredItems.length === 0 && !isVaultTrigger ? (
            <div
              style={{
                padding: '28px 16px',
                textAlign: 'center',
                color: '#6B7280',
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
                    backgroundColor: active ? '#1C202B' : 'transparent',
                    textAlign: 'left',
                  }}
                >
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: 500,
                          color: '#F3F4F6',
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
                          color: '#9CA3AF',
                          backgroundColor: '#0E1015',
                          border: '1px solid #252A37',
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
                        color: '#6B7280',
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
                    <FiArrowUpRight size={14} color="#6B7280" />
                  ) : (
                    <FiCornerDownLeft size={13} color={active ? '#3B82F6' : '#6B7280'} />
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
            borderTop: '1px solid #252A37',
            backgroundColor: '#11131A',
            fontSize: 11,
            color: '#6B7280',
          }}
        >
          <span>Navigate with Up/Down arrows</span>
          <span>Enter to open</span>
        </div>
      </div>
    </div>
  );
};
