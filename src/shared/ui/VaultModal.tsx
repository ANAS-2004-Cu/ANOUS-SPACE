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
            <FiUnlock size={15} color="var(--tone-sage)" />
          ) : (
            <FiLock size={15} color="var(--text-secondary)" />
          )}
          <span>Private Vault</span>
        </>
      }
    >
      <div className="ui-modal-body">
        {isUnlocked ? (
          <div className="ui-stack ui-stack--lg">
            <p className="ui-modal-copy">
              Private Vault is currently unlocked for this browser session. Restricted tools are
              accessible under the Private filter on the workspace hub.
            </p>
            <div className="ui-row" style={{ justifyContent: 'flex-end' }}>
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
          <form onSubmit={handleSubmit} className="ui-stack ui-stack--lg">
            <p className="ui-modal-copy">
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
            <div className="ui-row" style={{ justifyContent: 'flex-end' }}>
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
