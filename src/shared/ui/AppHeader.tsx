import React, { useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FiSearch, FiArrowLeft, FiUnlock, FiSun, FiMoon } from 'react-icons/fi';
import { useVault } from '../context/VaultContext';
import { useTheme } from '../context/ThemeContext';
import { ToolAccent } from './ToolEmblem';

export interface AppHeaderProps {
  onOpenCommandPalette: () => void;
  subtitle?: string;
  accent?: ToolAccent;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  onOpenCommandPalette,
  subtitle,
  accent = 'cobalt',
}) => {
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
    <header className="app-header" data-accent={accent}>
      <div className="app-header__inner">
        <div className="app-header__left">
          {!isRoot && (
            <button
              type="button"
              onClick={() => navigate('/')}
              className="icon-btn"
              style={{ width: 30, height: 30 }}
              aria-label="Back to hub"
              title="Back to hub"
            >
              <FiArrowLeft size={14} strokeWidth={1.6} />
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
            data-pressing={pressing}
            className="app-header__brand"
            title="ANAS GAMAL (Hold 2s for Vault)"
          >
            <span className="app-header__brand-mark" aria-hidden="true" />
            <span>ANAS GAMAL</span>
          </button>

          {subtitle && (
            <>
              <span className="app-header__divider" aria-hidden="true">
                /
              </span>
              <span className="app-header__subtitle">{subtitle}</span>
            </>
          )}
        </div>

        <div className="app-header__actions">
          {isUnlocked && (
            <button
              type="button"
              onClick={openVaultModal}
              className="vault-status-btn"
              title="Private Vault unlocked"
            >
              <FiUnlock size={12} strokeWidth={1.6} />
              <span>Vault</span>
            </button>
          )}

          <button
            type="button"
            onClick={toggleTheme}
            className="icon-btn"
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? (
              <FiSun size={14} strokeWidth={1.6} />
            ) : (
              <FiMoon size={14} strokeWidth={1.6} />
            )}
          </button>

          <button
            type="button"
            onClick={onOpenCommandPalette}
            className="command-trigger-btn"
            aria-label="Search workspace"
          >
            <FiSearch size={13} strokeWidth={1.6} />
            <span>Search</span>
            <span className="kbd-badge hide-on-mobile">Ctrl K</span>
          </button>
        </div>
      </div>
    </header>
  );
};
