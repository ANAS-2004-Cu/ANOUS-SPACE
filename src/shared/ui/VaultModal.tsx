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
        backgroundColor: 'var(--bg-backdrop)',
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
          maxWidth: 420,
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--card-top-highlight), var(--card-shadow-hover)',
          borderRadius: 12,
          padding: 24,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 16,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <span
              style={{
                width: 28,
                height: 28,
                borderRadius: 7,
                backgroundColor: 'var(--accent-vault-subtle)',
                border: '1px solid var(--accent-vault-border)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {isUnlocked ? (
                <FiUnlock size={14} strokeWidth={1.5} color="var(--accent-vault)" />
              ) : (
                <FiLock size={14} strokeWidth={1.5} color="var(--accent-vault)" />
              )}
            </span>
            <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>
              Private Vault
            </span>
          </div>
          <button
            onClick={closeVaultModal}
            style={{ color: 'var(--text-muted)', padding: 4 }}
            aria-label="Close modal"
          >
            <FiX size={16} strokeWidth={1.5} />
          </button>
        </div>

        {isUnlocked ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.55 }}>
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
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.55 }}>
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
                backgroundColor: 'var(--bg-well)',
                border: `1px solid ${error ? 'var(--danger)' : 'var(--border-subtle)'}`,
                boxShadow: 'var(--well-inner-shadow)',
                borderRadius: 8,
                padding: '10px 12px',
                fontSize: 13,
                color: 'var(--text-primary)',
              }}
            />
            {error && (
              <div style={{ fontSize: 12, color: 'var(--danger)', lineHeight: 1.4 }}>{error}</div>
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
