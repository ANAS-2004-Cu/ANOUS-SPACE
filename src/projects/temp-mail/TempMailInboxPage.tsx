import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { WorkspaceLayout } from '../../shared/ui/WorkspaceLayout';
import { useAlert } from '../../shared/context/AlertContext';
import * as Clipboard from '../../shared/utils/clipboard';
import { EmailSummary, normalizeProviderId } from './types';
import { PROVIDER_ADAPTERS, PROVIDERS_META, getCapabilityBadges } from './providers';
import { InboxView } from './components/InboxView';

export interface TempMailInboxPageProps {
  onOpenCommandPalette: () => void;
}

const AUTO_REFRESH_INTERVAL_MS = 10_000;

export const TempMailInboxPage: React.FC<TempMailInboxPageProps> = ({ onOpenCommandPalette }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const activeProvider = normalizeProviderId(searchParams.get('provider'));
  const adapter = PROVIDER_ADAPTERS[activeProvider];
  const meta = PROVIDERS_META[activeProvider];
  const capabilityBadges = getCapabilityBadges(activeProvider);

  const { showToast } = useAlert();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [creatingNew, setCreatingNew] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [sessionError, setSessionError] = useState(false);
  const [emails, setEmails] = useState<EmailSummary[]>([]);
  const [address, setAddress] = useState<string | null>(null);

  const isSyncingRef = useRef(false);

  const syncMessages = useCallback(
    async (silent = false) => {
      if (isSyncingRef.current) return;
      isSyncingRef.current = true;

      if (!silent) {
        setRefreshing(true);
      }

      try {
        const messages = await adapter.fetchMessages();
        setEmails(messages);
        setSessionError(false);
      } catch (err) {
        setSessionError(true);
        if (!silent) {
          const msg =
            err instanceof Error && err.message
              ? err.message
              : 'Failed to sync inbox. Please try again.';
          showToast({
            title: 'Inbox Sync Failed',
            message: msg,
            type: 'error',
          });
        }
      } finally {
        isSyncingRef.current = false;
        setLoading(false);
        setRefreshing(false);
      }
    },
    [adapter, showToast]
  );

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setSessionError(false);
    setEmails([]);

    const init = async () => {
      try {
        const stored = await adapter.getStoredAccount();
        if (!mounted) return;

        if (!stored?.address) {
          if (!adapter.capabilities.supportsCustomUsername) {
            const created = await adapter.createAccount();
            if (!mounted) return;
            setAddress(created.address);
            await syncMessages(true);
            return;
          }

          showToast({
            title: 'No Active Inbox',
            message: `No active ${meta.label} address found. Set up an address first.`,
            type: 'warning',
          });
          navigate(`/temp-mail?provider=${encodeURIComponent(activeProvider)}`, {
            replace: true,
          });
          return;
        }

        setAddress(stored.address);
        await syncMessages(false);
      } catch {
        if (!mounted) return;
        setSessionError(true);
        setLoading(false);
        showToast({
          title: 'Session Error',
          message: 'Failed to load inbox session. Please try again.',
          type: 'error',
        });
      }
    };

    init();
    return () => {
      mounted = false;
    };
  }, [activeProvider, adapter, meta.label, navigate, showToast, syncMessages]);

  useEffect(() => {
    if (!autoRefresh || !address || sessionError) return;
    const timer = window.setInterval(() => {
      void syncMessages(true);
    }, AUTO_REFRESH_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [autoRefresh, address, sessionError, syncMessages]);

  const handleCopyAddress = async (target: string) => {
    try {
      await Clipboard.setStringAsync(target);
      showToast({
        title: 'Copied',
        message: 'Email address copied to clipboard.',
        type: 'success',
      });
    } catch {
      showToast({
        title: 'Copy Failed',
        message: 'Failed to copy email address.',
        type: 'error',
      });
    }
  };

  const handleRefresh = useCallback(() => {
    void syncMessages(false);
  }, [syncMessages]);

  const handleNewAddress = async () => {
    if (adapter.capabilities.supportsCustomUsername) {
      navigate(`/temp-mail?provider=${encodeURIComponent(activeProvider)}`);
      return;
    }

    setCreatingNew(true);
    try {
      const fresh = await adapter.createAccount();
      setAddress(fresh.address);
      setEmails([]);
      setSessionError(false);
      showToast({
        title: 'New Address Ready',
        message: fresh.address,
        type: 'success',
      });
    } catch (err) {
      const msg =
        err instanceof Error && err.message
          ? err.message
          : `Failed to generate a new ${meta.label} address.`;
      showToast({
        title: 'Session Reset Failed',
        message: msg,
        type: 'error',
      });
    } finally {
      setCreatingNew(false);
    }
  };

  const handleResetSession = async () => {
    if (adapter.resetSession) {
      await adapter.resetSession();
    }
    if (!adapter.capabilities.supportsCustomUsername) {
      await handleNewAddress();
    } else {
      navigate(`/temp-mail?provider=${encodeURIComponent(activeProvider)}`);
    }
  };

  const handleDeleteEmail = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!adapter.capabilities.supportsDelete) return;
    try {
      await adapter.deleteMessage(id);
      setEmails((prev) => prev.filter((item) => item.id !== id));
      showToast({
        title: 'Message Deleted',
        message: 'Removed from inbox.',
        type: 'info',
      });
    } catch (err) {
      const msg =
        err instanceof Error && err.message
          ? err.message
          : 'Failed to delete email. Please try again.';
      showToast({
        title: 'Delete Failed',
        message: msg,
        type: 'error',
      });
    }
  };

  const openDetail = (emailId: string) => {
    navigate(
      `/temp-mail/detail?id=${encodeURIComponent(emailId)}&provider=${encodeURIComponent(activeProvider)}`
    );
  };

  return (
    <WorkspaceLayout
      onOpenCommandPalette={onOpenCommandPalette}
      subtitle={`${meta.label} Inbox`}
      accent="slate"
      width="medium"
    >
      <InboxView
        providerLabel={meta.label}
        capabilityBadges={capabilityBadges}
        supportsDelete={adapter.capabilities.supportsDelete}
        address={address}
        emails={emails}
        loading={loading}
        refreshing={refreshing}
        autoRefresh={autoRefresh}
        sessionError={sessionError}
        creatingNew={creatingNew}
        onBack={() => navigate(`/temp-mail?provider=${encodeURIComponent(activeProvider)}`)}
        onCopyAddress={handleCopyAddress}
        onToggleAutoRefresh={() => setAutoRefresh((prev) => !prev)}
        onRefresh={handleRefresh}
        onNewAddress={handleNewAddress}
        onOpenEmail={openDetail}
        onDeleteEmail={handleDeleteEmail}
        onResetSession={handleResetSession}
      />
    </WorkspaceLayout>
  );
};
