import React, { useState, useEffect, useRef } from 'react';
import { FiLock, FiUnlock, FiX } from 'react-icons/fi';
import { useVault } from '../context/VaultContext';
import { Button } from './Button';

export const VaultModal: React.FC = () => {
  const { vaultModalOpen, closeVaultModal, unlockVault, isUnlocked, lockVault } = useVault();
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (vaultModalOpen) {
      setPassword('');
      setError(null);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 40);
    }
  }, [vaultModalOpen]);

  if (!vaultModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setError('Password is required.');
      return;
    }
    setLoading(true);
    setError(null);
    const result = await unlockVault(password.trim());
    setLoading(false);
    if (result.ok) {
      closeVaultModal();
    } else {
      setError(result.error || 'Invalid vault password.');
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(9, 10, 14, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        zIndex: 1150,
      }}
      onClick={closeVaultModal}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 400,
          backgroundColor: '#161922',
          border: '1px solid #252A37',
          borderRadius: 10,
          padding: 20,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 14,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {isUnlocked ? (
              <FiUnlock size={15} color="#3B82F6" />
            ) : (
              <FiLock size={15} color="#9CA3AF" />
            )}
            <span style={{ fontSize: 14, fontWeight: 600, color: '#F3F4F6' }}>Private Vault</span>
          </div>
          <button
            onClick={closeVaultModal}
            style={{ color: '#6B7280', padding: 4 }}
            aria-label="Close modal"
          >
            <FiX size={16} />
          </button>
        </div>

        {isUnlocked ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <p style={{ fontSize: 13, color: '#9CA3AF', lineHeight: 1.5 }}>
              Private Vault is currently unlocked for this browser session. Restricted tools are
              accessible under the Private tab.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <Button variant="secondary" size="sm" onClick={closeVaultModal}>
                Close
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => {
                  lockVault();
                  closeVaultModal();
                }}
              >
                Lock Vault
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <p style={{ fontSize: 13, color: '#9CA3AF', lineHeight: 1.5 }}>
              Enter administrator credentials to unlock private workspace items.
            </p>
            <input
              ref={inputRef}
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError(null);
              }}
              placeholder="Vault password"
              className="mono"
              style={{
                width: '100%',
                backgroundColor: '#11131A',
                border: `1px solid ${error ? '#EF4444' : '#252A37'}`,
                borderRadius: 7,
                padding: '9px 12px',
                fontSize: 13,
                color: '#F3F4F6',
              }}
            />
            {error && (
              <div style={{ fontSize: 12, color: '#EF4444', lineHeight: 1.4 }}>{error}</div>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
              <Button type="button" variant="secondary" size="sm" onClick={closeVaultModal}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" loading={loading}>
                Unlock
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
