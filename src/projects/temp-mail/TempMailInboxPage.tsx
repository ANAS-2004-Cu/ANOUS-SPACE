import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FiArrowLeft, FiRefreshCw, FiInbox } from 'react-icons/fi';
import { AppHeader } from '../../shared/ui/AppHeader';
import { Button } from '../../shared/ui/Button';
import { useAlert } from '../../shared/context/AlertContext';
import { useTheme } from '../../shared/context/ThemeContext';
import { EmailSummary, normalizeProviderId } from './types';
import { PROVIDER_ADAPTERS, PROVIDERS_META } from './providers';
import { MessageRow } from './components/MessageRow';

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
  const { theme } = useTheme();
  const isLight = theme === 'light';

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

  const canvasBg = isLight ? '#F8F7F4' : '#141311';
  const cardBg = isLight ? '#FFFFFF' : '#1C1A17';
  const cardBorder = isLight ? '#E5E1D8' : '#2E2A25';
  const textPrimary = isLight ? '#18191C' : '#F2F3F5';
  const textSecondary = isLight ? '#52555E' : '#A1A6B3';

  return (
    <div
      className="route-theme-canvas"
      style={{
        backgroundColor: canvasBg,
        backgroundImage: isLight
          ? 'radial-gradient(ellipse 80% 45% at 50% -10%, rgba(166, 139, 96, 0.05), transparent 70%)'
          : 'radial-gradient(ellipse 80% 45% at 50% -10%, rgba(166, 139, 96, 0.045), transparent 70%)',
      }}
    >
      <div className="workspace-shell">
        <AppHeader
          onOpenCommandPalette={onOpenCommandPalette}
          subtitle={`${meta.label} Inbox`}
        />

        <main
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
            maxWidth: 760,
            width: '100%',
            margin: '0 auto',
            paddingBottom: 40,
          }}
        >
          {/* Toolbar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              backgroundColor: cardBg,
              border: `1px solid ${cardBorder}`,
              borderRadius: 12,
              padding: '12px 16px',
              flexWrap: 'wrap',
              boxShadow: isLight
                ? 'var(--card-top-highlight), 0 8px 22px rgba(24, 25, 28, 0.04)'
                : 'var(--card-top-highlight), 0 14px 30px rgba(0, 0, 0, 0.3)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => navigate('/temp-mail')}
                aria-label="Back to Temp-Mail"
              >
                <FiArrowLeft size={13} />
                <span>Providers</span>
              </Button>
              <span
                className="mono"
                style={{
                  fontSize: 11,
                  color: meta.accent,
                  backgroundColor: meta.tint,
                  border: `1px solid ${meta.border}`,
                  borderRadius: 999,
                  padding: '2px 8px',
                  fontWeight: 600,
                  flexShrink: 0,
                }}
              >
                {meta.label}
              </span>
              {address && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    minWidth: 0,
                  }}
                >
                  <span className="live-pulse-dot" />
                  <span
                    className="mono"
                    style={{
                      fontSize: 13,
                      color: textPrimary,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {address}
                  </span>
                </div>
              )}
            </div>

            <Button
              variant="secondary"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
              aria-label="Refresh Inbox"
            >
              <FiRefreshCw
                size={13}
                style={refreshing ? { animation: 'spin 0.8s linear infinite' } : undefined}
              />
              <span>Refresh</span>
            </Button>
          </div>

          {/* Message List */}
          {loading && !refreshing ? (
            <div
              style={{
                backgroundColor: cardBg,
                border: `1px solid ${cardBorder}`,
                borderRadius: 12,
                padding: '60px 20px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 12,
              }}
            >
              <div className="spinner" style={{ width: 22, height: 22 }} />
              <span style={{ fontSize: 13, color: textSecondary }}>Loading emails...</span>
            </div>
          ) : emails.length === 0 ? (
            <div
              style={{
                backgroundColor: cardBg,
                border: `1px solid ${cardBorder}`,
                borderRadius: 12,
                padding: '60px 24px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                textAlign: 'center',
              }}
            >
              <FiInbox size={32} color={meta.accent} />
              <div style={{ fontSize: 15, fontWeight: 600, color: textPrimary }}>
                Inbox is ready and listening
              </div>
              <div style={{ fontSize: 13, color: textSecondary, maxWidth: 380 }}>
                Incoming messages for this disposable address will appear here. Click Refresh to check for new mail.
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {emails.map((item) => (
                <MessageRow
                  key={item.id}
                  message={item}
                  accentColor={meta.accent}
                  isLight={isLight}
                  onOpen={openDetail}
                  onDelete={handleDeleteEmail}
                />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
