import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiArrowLeft,
  FiRefreshCw,
  FiAlertTriangle,
  FiInbox,
} from 'react-icons/fi';
import { AppHeader } from '../../shared/ui/AppHeader';
import { Button } from '../../shared/ui/Button';
import { useAlert } from '../../shared/context/AlertContext';
import { useTheme } from '../../shared/context/ThemeContext';
import { EmailSummary } from './types';
import { PROVIDERS_META } from './providers';
import {
  getCachedGuerrillaSummaries,
  guerrillaMailAdapter,
  setCachedGuerrillaSummaries,
} from './providers/guerrillaMail';
import { MessageRow } from './components/MessageRow';

export interface GuerrillaInboxPageProps {
  onOpenCommandPalette: () => void;
}

export const GuerrillaInboxPage: React.FC<GuerrillaInboxPageProps> = ({
  onOpenCommandPalette,
}) => {
  const navigate = useNavigate();
  const { showToast } = useAlert();
  const { theme } = useTheme();
  const isLight = theme === 'light';
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

  const fetchEmails = useCallback(async (showLoader = true) => {
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
  }, [showToast]);

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
          ? 'radial-gradient(ellipse 80% 45% at 50% -10%, rgba(77, 139, 110, 0.045), transparent 70%)'
          : 'radial-gradient(ellipse 80% 45% at 50% -10%, rgba(77, 139, 110, 0.045), transparent 70%)',
      }}
    >
      <div className="workspace-shell">
        <AppHeader
          onOpenCommandPalette={onOpenCommandPalette}
          subtitle="GuerrillaMail Inbox"
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
                <FiArrowLeft size={13} strokeWidth={1.5} />
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
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
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
                  {sessionError && (
                    <span
                      className="mono"
                      style={{
                        fontSize: 11,
                        color: '#BA5E4E',
                        backgroundColor: 'rgba(186, 94, 78, 0.12)',
                        border: '1px solid rgba(186, 94, 78, 0.35)',
                        borderRadius: 4,
                        padding: '2px 6px',
                      }}
                    >
                      Session Error
                    </span>
                  )}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Button
                variant={confirmReset ? 'danger' : 'secondary'}
                size="sm"
                onClick={handleResetSession}
                aria-label="Reset Session"
              >
                <span>{confirmReset ? 'Confirm Reset?' : 'New Address'}</span>
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleRefresh}
                disabled={refreshing}
                aria-label="Refresh Inbox"
              >
                <FiRefreshCw
                  size={13}
                  strokeWidth={1.5}
                  style={refreshing ? { animation: 'spin 0.8s linear infinite' } : undefined}
                />
                <span>Refresh</span>
              </Button>
            </div>
          </div>

          {/* Session Error Banner */}
          {sessionError && !loading && (
            <button
              type="button"
              onClick={async () => {
                const newEmail = await provisionFreshAddress();
                if (newEmail) {
                  showToast({
                    title: 'Session Reset',
                    message: newEmail,
                    type: 'success',
                  });
                }
              }}
              style={{
                width: '100%',
                backgroundColor: 'rgba(186, 94, 78, 0.12)',
                border: '1px solid rgba(186, 94, 78, 0.35)',
                borderRadius: 9,
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                color: '#BA5E4E',
                fontSize: 13,
                textAlign: 'left',
              }}
            >
              <FiAlertTriangle size={15} strokeWidth={1.5} style={{ flexShrink: 0 }} />
              <span>Session error detected. Click here to reset your GuerrillaMail session.</span>
            </button>
          )}

          {/* Email list */}
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
                gap: 12,
                textAlign: 'center',
              }}
            >
              <FiInbox size={32} strokeWidth={1.5} color={meta.accent} />
              <div style={{ fontSize: 15, fontWeight: 600, color: textPrimary }}>
                {sessionError ? 'Session Error' : 'Inbox is ready and listening'}
              </div>
              <div style={{ fontSize: 13, color: textSecondary, maxWidth: 380 }}>
                {sessionError
                  ? 'Your session may have expired. Reset your session to obtain a fresh inbox.'
                  : 'New emails will appear here. Click Refresh to check for incoming mail.'}
              </div>
              {sessionError && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={async () => {
                    const newEmail = await provisionFreshAddress();
                    if (newEmail) {
                      showToast({
                        title: 'Session Reset',
                        message: newEmail,
                        type: 'success',
                      });
                    }
                  }}
                >
                  Reset Session
                </Button>
              )}
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
