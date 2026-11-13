import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { ProjectItem } from '../../data/projects';

const VAULT_SESSION_KEY = 'anous_vault_session';

interface RawPrivateApp {
  id?: string;
  title?: string;
  name?: string;
  description?: string;
  url?: string;
  externalUrl?: string;
  to?: string;
  badge?: string;
}

interface VaultContextValue {
  isUnlocked: boolean;
  privateProjects: ProjectItem[];
  vaultModalOpen: boolean;
  openVaultModal: () => void;
  closeVaultModal: () => void;
  unlockVault: (password: string) => Promise<{ ok: boolean; error?: string }>;
  lockVault: () => void;
}

const VaultContext = createContext<VaultContextValue | undefined>(undefined);

function normalizePrivateApps(rawApps: RawPrivateApp[]): ProjectItem[] {
  return rawApps.map((app, index) => {
    const externalUrl = app.externalUrl || app.url;
    const isInternal = Boolean(app.to && !externalUrl);
    return {
      id: app.id || `private-app-${index + 1}`,
      title: app.title || app.name || `Private Resource ${index + 1}`,
      description: app.description || 'Restricted workspace tool or private deployment.',
      category: 'Private',
      type: isInternal ? 'internal' : 'external',
      to: app.to,
      externalUrl: externalUrl || '#',
      badge: app.badge || 'Private',
      keywords: ['private', 'vault', (app.title || app.name || '').toLowerCase()],
    };
  });
}

export const VaultProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);
  const [privateProjects, setPrivateProjects] = useState<ProjectItem[]>([]);
  const [vaultModalOpen, setVaultModalOpen] = useState<boolean>(false);

  useEffect(() => {
    try {
      const saved = window.sessionStorage.getItem(VAULT_SESSION_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.unlocked) {
          setIsUnlocked(true);
          setPrivateProjects(Array.isArray(parsed.projects) ? parsed.projects : []);
        }
      }
    } catch {
      // ignore corrupted session data
    }
  }, []);

  const openVaultModal = useCallback(() => setVaultModalOpen(true), []);
  const closeVaultModal = useCallback(() => setVaultModalOpen(false), []);

  const unlockVault = useCallback(
    async (password: string): Promise<{ ok: boolean; error?: string }> => {
      try {
        const res = await axios.post('/api/vault', { password });
        if (res.data && res.data.unlocked) {
          const normalized = normalizePrivateApps(
            Array.isArray(res.data.apps) ? res.data.apps : []
          );
          setIsUnlocked(true);
          setPrivateProjects(normalized);
          window.sessionStorage.setItem(
            VAULT_SESSION_KEY,
            JSON.stringify({ unlocked: true, projects: normalized })
          );
          return { ok: true };
        }
        return { ok: false, error: 'Authentication failed.' };
      } catch (err: any) {
        const message =
          err?.response?.data?.error || 'Unable to verify credentials with /api/vault.';
        return { ok: false, error: message };
      }
    },
    []
  );

  const lockVault = useCallback(() => {
    setIsUnlocked(false);
    setPrivateProjects([]);
    try {
      window.sessionStorage.removeItem(VAULT_SESSION_KEY);
    } catch {
      // ignore
    }
  }, []);

  return (
    <VaultContext.Provider
      value={{
        isUnlocked,
        privateProjects,
        vaultModalOpen,
        openVaultModal,
        closeVaultModal,
        unlockVault,
        lockVault,
      }}
    >
      {children}
    </VaultContext.Provider>
  );
};

export function useVault(): VaultContextValue {
  const ctx = useContext(VaultContext);
  if (!ctx) {
    throw new Error('useVault must be used within a VaultProvider');
  }
  return ctx;
}
