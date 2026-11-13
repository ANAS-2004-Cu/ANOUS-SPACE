import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { WorkspaceLayout } from '../../shared/ui/WorkspaceLayout';
import { Button } from '../../shared/ui/Button';
import { useAlert } from '../../shared/context/AlertContext';
import { EmailSummary } from './types';
import { PROVIDERS_META } from './providers';
import {
  getCachedGuerrillaSummaries,
  guerrillaMailAdapter,
  setCachedGuerrillaSummaries,
} from './providers/guerrillaMail';
import { InboxView } from './components/InboxView';

export interface GuerrillaInboxPageProps {
  onOpenCommandPalette: () => void;
}

export const GuerrillaInboxPage: React.FC<GuerrillaInboxPageProps> = ({
  onOpenCommandPalette,
}) => {
  const navigate = useNavigate();
  const { showToast } = useAlert();
  const meta = PROVIDERS_META.guerrillamail;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [sessionError, setSessionError] = useState(false);
  const [emails, setEmails] = useState<EmailSummary[]>(() =>
    getCachedGuerrillaSummaries()
  );

  const initLockRef = useRef<Promise<void> | null>(null);

  const provisionFreshAddress = useCallback(async () => {
    setLoading(true);
    setSessionError(false);
    try {
      if (guerrillaMailAdapter.resetSession) {
        await guerrillaMailAdapter.resetSession();
      }
      const account = await guerrillaMailAdapter.createAccount();
      setAddress(account.address);
      const messages = await guerrillaMailAdapter.fetchMessages();
      setEmails(messages);
      return account.address;
    } catch {
      setSessionError(true);
      showToast({
        title: 'Session Failed',
        message: 'Failed to create a new GuerrillaMail address. Please try again.',
        type: 'error',
      });
      return null;
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [showToast]);

  const fetchEmails = useCallback(
    async (showLoader = true) => {
      if (showLoader) setLoading(true);
      try {
        const messages = await guerrillaMailAdapter.fetchMessages();
        setEmails(messages);
        setSessionError(false);
      } catch {
        setSessionError(true);
        if (showLoader) {
          showToast({
            title: 'Session Error',
            message: 'Failed to fetch emails. Your session may have expired.',
            type: 'error',
          });
        }
      } finally {
        if (showLoader) setLoading(false);
        setRefreshing(false);
      }
    },
    [showToast]
  );

  useEffect(() => {
    if (!confirmReset) return;
    const timer = window.setTimeout(() => setConfirmReset(false), 3000);
    return () => window.clearTimeout(timer);
  }, [confirmReset]);

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      if (!initLockRef.current) {
        initLockRef.current = (async () => {
          const stored = await guerrillaMailAdapter.getStoredAccount();
          if (!mounted) return;
          if (stored?.address) {
            setAddress(stored.address);
            await fetchEmails(true);
          } else {
            await provisionFreshAddress();
          }
        })().finally(() => {
          initLockRef.current = null;
        });
      }
      try {
        await initLockRef.current;
      } catch {
        if (mounted) {
          setSessionError(true);
          setLoading(false);
        }
      }
    };

    init();
    return () => {
      mounted = false;
    };
  }, [fetchEmails, provisionFreshAddress]);

  const handleResetSession = async () => {
    if (!confirmReset) {
      setConfirmReset(true);
      return;
    }
    setConfirmReset(false);
    const newEmail = await provisionFreshAddress();
    if (newEmail) {
      showToast({
        title: 'Session Reset',
        message: newEmail,
        type: 'success',
      });
    }
  };

  const handleForceReset = async () => {
    const newEmail = await provisionFreshAddress();
    if (newEmail) {
      showToast({
        title: 'Session Reset',
        message: newEmail,
        type: 'success',
      });
    }
  };

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchEmails(false);
  }, [fetchEmails]);

  const handleDeleteEmail = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await guerrillaMailAdapter.deleteMessage(id);
    setEmails((prev) => {
      const next = prev.filter((item) => item.id !== id);
      setCachedGuerrillaSummaries(next);
      return next;
    });
    showToast({
      title: 'Message Deleted',
      message: 'Removed from GuerrillaMail inbox.',
      type: 'info',
    });
  };

  const openDetail = (emailId: string) => {
    navigate(
      `/temp-mail/detail?id=${encodeURIComponent(emailId)}&provider=guerrillamail`
    );
  };

  return (
    <WorkspaceLayout
      onOpenCommandPalette={onOpenCommandPalette}
      subtitle="GuerrillaMail Inbox"
      accent="slate"
      width="medium"
    >
      <InboxView
        providerLabel={meta.label}
        address={address}
        emails={emails}
        loading={loading}
        refreshing={refreshing}
        sessionError={sessionError}
        emptyDescription="New emails will appear here. Click Refresh to check for incoming mail."
        onBack={() => navigate('/temp-mail')}
        onRefresh={handleRefresh}
        onOpenEmail={openDetail}
        onDeleteEmail={handleDeleteEmail}
        onResetSession={handleForceReset}
        toolbarExtra={
          <Button
            variant={confirmReset ? 'danger' : 'secondary'}
            size="sm"
            onClick={handleResetSession}
            aria-label="Reset Session"
          >
            <span>{confirmReset ? 'Confirm Reset?' : 'New Address'}</span>
          </Button>
        }
      />
    </WorkspaceLayout>
  );
};
