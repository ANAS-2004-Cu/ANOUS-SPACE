import React, { useState, useEffect, useRef } from 'react';
import { FiLock, FiUnlock } from 'react-icons/fi';
import { useVault } from '../context/VaultContext';
import { Button } from './Button';
import { Input } from './Input';
import { Modal } from './Modal';

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
    <Modal
      open={vaultModalOpen}
      onClose={closeVaultModal}
      title={
        <>
          {isUnlocked ? (
            <FiUnlock size={15} color="var(--cat-emerald-accent)" />
          ) : (
            <FiLock size={15} color="var(--text-secondary)" />
          )}
          <span>Private Vault</span>
        </>
      }
    >
      <div className="ui-modal-body">
        {isUnlocked ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.55 }}>
              Private Vault is currently unlocked for this browser session. Restricted tools are
              accessible under the Private filter on the workspace hub.
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
            <Input
              ref={inputRef}
              type="password"
              mono
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError(null);
              }}
              placeholder="Vault password"
              error={error}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
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
    </Modal>
  );
};
