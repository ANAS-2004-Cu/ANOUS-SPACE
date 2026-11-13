import React, { useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FiSearch, FiArrowLeft, FiUnlock, FiSun, FiMoon } from 'react-icons/fi';
import { useVault } from '../context/VaultContext';
import { useTheme } from '../context/ThemeContext';

export interface AppHeaderProps {
  onOpenCommandPalette: () => void;
  subtitle?: string;
}

export const AppHeader: React.FC<AppHeaderProps> = ({ onOpenCommandPalette, subtitle }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isUnlocked, openVaultModal } = useVault();
  const { theme, toggleTheme } = useTheme();
  const pressTimerRef = useRef<number | null>(null);
  const longPressTriggeredRef = useRef(false);
  const [pressing, setPressing] = useState(false);

  const isRoot = location.pathname === '/';

  const startPress = () => {
    longPressTriggeredRef.current = false;
    setPressing(true);
    if (pressTimerRef.current) {
      window.clearTimeout(pressTimerRef.current);
    }
    pressTimerRef.current = window.setTimeout(() => {
      longPressTriggeredRef.current = true;
      setPressing(false);
      openVaultModal();
    }, 2000);
  };

  const cancelPress = () => {
    setPressing(false);
    if (pressTimerRef.current) {
      window.clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
  };

  const handleTitleClick = () => {
    if (longPressTriggeredRef.current) {
      longPressTriggeredRef.current = false;
      return;
    }
    if (!isRoot) {
      navigate('/');
    }
  };

  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '18px 0',
        borderBottom: '1px solid var(--border-subtle)',
        marginBottom: 24,
        gap: 12,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
        {!isRoot && (
          <button
            onClick={() => navigate('/')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 30,
              height: 30,
              borderRadius: 6,
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-secondary)',
              flexShrink: 0,
            }}
            aria-label="Back to hub"
            title="Back to hub"
          >
            <FiArrowLeft size={14} strokeWidth={1.5} />
          </button>
        )}

        <button
          type="button"
          onPointerDown={startPress}
          onPointerUp={cancelPress}
          onPointerLeave={cancelPress}
          onPointerCancel={cancelPress}
          onContextMenu={(e) => e.preventDefault()}
          onClick={handleTitleClick}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 14,
            fontWeight: 600,
            letterSpacing: '0.06em',
            color: pressing ? 'var(--accent)' : 'var(--text-primary)',
            userSelect: 'none',
            WebkitUserSelect: 'none',
          }}
          title="ANAS GAMAL (Hold 2s for Vault)"
        >
          <span>ANAS GAMAL</span>
        </button>

        {subtitle && (
          <>
            <span style={{ color: 'var(--border-subtle)', fontSize: 14 }}>/</span>
            <span
              style={{
                fontSize: 13,
                color: 'var(--text-secondary)',
                fontWeight: 500,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {subtitle}
            </span>
          </>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        {isUnlocked && (
          <button
            type="button"
            onClick={openVaultModal}
            className="mono"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 10px',
              borderRadius: 7,
              backgroundColor: 'var(--accent-vault-subtle)',
              border: '1px solid rgba(186, 94, 78, 0.36)',
              color: 'var(--accent-vault)',
              fontSize: 11,
            }}
            title="Private Vault unlocked"
          >
            <FiUnlock size={12} strokeWidth={1.5} />
            <span>Vault</span>
          </button>
        )}

        <button
          type="button"
          onClick={toggleTheme}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 32,
            height: 32,
            borderRadius: 7,
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            boxShadow: 'var(--card-top-highlight)',
            color: 'var(--text-secondary)',
          }}
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? <FiSun size={14} strokeWidth={1.5} /> : <FiMoon size={14} strokeWidth={1.5} />}
        </button>

        <button
          type="button"
          onClick={onOpenCommandPalette}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10,
            padding: '6px 10px',
            borderRadius: 7,
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            boxShadow: 'var(--card-top-highlight)',
            color: 'var(--text-secondary)',
            fontSize: 12,
          }}
          aria-label="Search workspace"
        >
          <FiSearch size={13} strokeWidth={1.5} />
          <span>Search</span>
          <span className="kbd-badge hide-on-mobile">Ctrl K</span>
        </button>
      </div>
    </header>
  );
};
