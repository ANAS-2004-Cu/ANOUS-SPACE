import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { WorkspaceLayout } from '../../shared/ui/WorkspaceLayout';
import { useAlert } from '../../shared/context/AlertContext';
import { EmailSummary, normalizeProviderId } from './types';
import { PROVIDER_ADAPTERS, PROVIDERS_META } from './providers';
import { InboxView } from './components/InboxView';

export interface TempMailInboxPageProps {
  onOpenCommandPalette: () => void;
}

export const TempMailInboxPage: React.FC<TempMailInboxPageProps> = ({ onOpenCommandPalette }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const activeProvider = normalizeProviderId(searchParams.get('provider'));
  const adapter = PROVIDER_ADAPTERS[activeProvider];
  const meta = PROVIDERS_META[activeProvider];

  const { showToast } = useAlert();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [emails, setEmails] = useState<EmailSummary[]>([]);
  const [address, setAddress] = useState<string | null>(null);

  const fetchEmails = useCallback(async () => {
    try {
      setLoading(true);
      const messages = await adapter.fetchMessages();
      setEmails(messages);
    } catch (err) {
      const msg =
        err instanceof Error && err.message
          ? err.message
          : 'Failed to load emails. Please try again.';
      showToast({
        title: 'Inbox Sync Failed',
        message: msg,
        type: 'error',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [adapter, showToast]);

  useEffect(() => {
    if (activeProvider === 'guerrillamail') {
      navigate('/temp-mail/guerrilla-inbox', { replace: true });
      return;
    }

    const init = async () => {
      try {
        const stored = await adapter.getStoredAccount();
        if (!stored?.address) {
          showToast({
            title: 'No Active Inbox',
            message: `No active ${meta.label} email found. Create one first.`,
            type: 'warning',
          });
          navigate('/temp-mail', { replace: true });
          return;
        }
        setAddress(stored.address);
        await fetchEmails();
      } catch {
        showToast({
          title: 'Session Error',
          message: 'Failed to load inbox session. Please try again.',
          type: 'error',
        });
        setLoading(false);
      }
    };

    init();
  }, [activeProvider, adapter, meta.label, fetchEmails, navigate, showToast]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchEmails();
  }, [fetchEmails]);

  const handleDeleteEmail = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await adapter.deleteMessage(id);
      setEmails((prev) => prev.filter((item) => item.id !== id));
      showToast({
        title: 'Message Deleted',
        message: 'Removed from inbox.',
        type: 'info',
      });
    } catch {
      showToast({
        title: 'Delete Failed',
        message: 'Failed to delete email. Please try again.',
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
      accent="violet"
      width="medium"
    >
      <InboxView
        providerLabel={meta.label}
        address={address}
        emails={emails}
        loading={loading}
        refreshing={refreshing}
        onBack={() => navigate('/temp-mail')}
        onRefresh={handleRefresh}
        onOpenEmail={openDetail}
        onDeleteEmail={handleDeleteEmail}
      />
    </WorkspaceLayout>
  );
};
