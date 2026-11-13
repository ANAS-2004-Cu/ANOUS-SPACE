import React, { useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FiSearch, FiArrowLeft, FiUnlock } from 'react-icons/fi';
import { useVault } from '../context/VaultContext';

export interface AppHeaderProps {
  onOpenCommandPalette: () => void;
  subtitle?: string;
}

export const AppHeader: React.FC<AppHeaderProps> = ({ onOpenCommandPalette, subtitle }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isUnlocked, openVaultModal } = useVault();
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
        borderBottom: '1px solid #252A37',
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
              backgroundColor: '#161922',
              border: '1px solid #252A37',
              color: '#9CA3AF',
              flexShrink: 0,
            }}
            aria-label="Back to hub"
            title="Back to hub"
          >
            <FiArrowLeft size={14} />
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
            color: pressing ? '#3B82F6' : '#F3F4F6',
            userSelect: 'none',
            WebkitUserSelect: 'none',
          }}
          title="ANAS GAMAL"
        >
          <span>ANAS GAMAL</span>
        </button>

        {subtitle && (
          <>
            <span style={{ color: '#252A37', fontSize: 14 }}>/</span>
            <span
              style={{
                fontSize: 13,
                color: '#9CA3AF',
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
              backgroundColor: 'rgba(59, 130, 246, 0.12)',
              border: '1px solid rgba(59, 130, 246, 0.35)',
              color: '#3B82F6',
              fontSize: 11,
            }}
            title="Private Vault unlocked"
          >
            <FiUnlock size={12} />
            <span>Vault</span>
          </button>
        )}

        <button
          type="button"
          onClick={onOpenCommandPalette}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10,
            padding: '6px 10px',
            borderRadius: 7,
            backgroundColor: '#161922',
            border: '1px solid #252A37',
            color: '#9CA3AF',
            fontSize: 12,
          }}
          aria-label="Search workspace"
        >
          <FiSearch size={13} color="#9CA3AF" />
          <span>Search</span>
          <span className="kbd-badge hide-on-mobile">Ctrl K</span>
        </button>
      </div>
    </header>
  );
};
