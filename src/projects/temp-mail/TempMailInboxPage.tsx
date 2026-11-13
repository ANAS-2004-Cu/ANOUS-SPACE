import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FiArrowLeft, FiRefreshCw, FiTrash2, FiInbox } from 'react-icons/fi';
import { AppHeader } from '../../shared/ui/AppHeader';
import { Button } from '../../shared/ui/Button';
import { useAlert } from '../../shared/context/AlertContext';
import { useTheme } from '../../shared/context/ThemeContext';
import * as SecureStore from '../../shared/utils/storage';
import {
  getMessages,
  Email,
  deleteMessage,
  hydrateMailTmToken,
  setAuthToken,
  TempMailProvider,
  getTempMailLolStoredData,
  fetchTempMailLolMessages,
  deleteTempMailLolMessage,
  getMaildropStoredData,
  fetchMaildropMessages,
  deleteMaildropMessage,
} from './tempMailService';

const AVATAR_PALETTE = [
  { color: '#6366F1', bg: 'rgba(99, 102, 241, 0.15)', border: 'rgba(99, 102, 241, 0.4)' },
  { color: '#10B981', bg: 'rgba(16, 185, 129, 0.15)', border: 'rgba(16, 185, 129, 0.4)' },
  { color: '#F43F5E', bg: 'rgba(244, 63, 94, 0.15)', border: 'rgba(244, 63, 94, 0.4)' },
  { color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.15)', border: 'rgba(245, 158, 11, 0.4)' },
  { color: '#0EA5E9', bg: 'rgba(14, 165, 233, 0.15)', border: 'rgba(14, 165, 233, 0.4)' },
  { color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.15)', border: 'rgba(139, 92, 246, 0.4)' },
];

const getAvatarStyle = (seed: string) => {
  const code = (seed || 'U').charCodeAt(0);
  return AVATAR_PALETTE[code % AVATAR_PALETTE.length];
};

export interface TempMailInboxPageProps {
  onOpenCommandPalette: () => void;
}

export const TempMailInboxPage: React.FC<TempMailInboxPageProps> = ({ onOpenCommandPalette }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const rawProvider = searchParams.get('provider') || TempMailProvider.MailTM;
  const activeProvider =
    rawProvider === 'mailgw' ? TempMailProvider.MailTM : rawProvider;
  const { showAlert } = useAlert();
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [emails, setEmails] = useState<Email[]>([]);
  const [email, setEmail] = useState<string | null>(null);

  const getProviderBadge = () => {
    switch (activeProvider) {
      case TempMailProvider.TempMailLol:
        return {
          title: 'TempMail.lol Inbox',
          label: 'TempMail.lol',
          accent: '#F59E0B',
          bg: 'rgba(245, 158, 11, 0.14)',
          border: 'rgba(245, 158, 11, 0.42)',
        };
      case TempMailProvider.Maildrop:
        return {
          title: 'Maildrop.cc Inbox',
          label: 'Maildrop.cc',
          accent: '#06B6D4',
          bg: 'rgba(6, 182, 212, 0.14)',
          border: 'rgba(6, 182, 212, 0.42)',
        };
      default:
        return {
          title: 'Mail.TM Inbox',
          label: 'Mail.TM',
          accent: '#6366F1',
          bg: 'rgba(99, 102, 241, 0.14)',
          border: 'rgba(99, 102, 241, 0.42)',
        };
    }
  };

  const providerBadge = getProviderBadge();

  const fetchEmails = useCallback(async () => {
    try {
      setLoading(true);
      if (activeProvider === TempMailProvider.TempMailLol) {
        const messages = await fetchTempMailLolMessages();
        setEmails(messages || []);
      } else if (activeProvider === TempMailProvider.Maildrop) {
        const messages = await fetchMaildropMessages();
        setEmails(messages || []);
      } else {
        hydrateMailTmToken();
        const messages = await getMessages();
        setEmails(messages || []);
      }
    } catch {
      showAlert('Error', 'Failed to load emails. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeProvider, showAlert]);

  useEffect(() => {
    const init = async () => {
      try {
        if (activeProvider === TempMailProvider.TempMailLol) {
          const stored = getTempMailLolStoredData();
          if (stored?.address) {
            setEmail(stored.address);
            if (Array.isArray(stored.emails) && stored.emails.length > 0) {
              setEmails(stored.emails);
            }
            await fetchEmails();
          } else {
            showAlert('No Active Inbox', 'No active TempMail.lol email found. Please create one first.');
            navigate('/temp-mail', { replace: true });
          }
          return;
        }

        if (activeProvider === TempMailProvider.Maildrop) {
          const stored = getMaildropStoredData();
          if (stored?.email) {
            setEmail(stored.email);
            await fetchEmails();
          } else {
            showAlert('No Active Inbox', 'No active Maildrop.cc email found. Please create one first.');
            navigate('/temp-mail', { replace: true });
          }
          return;
        }

        const storedMailTm =
          (await SecureStore.getItemAsync('mailtm_data')) ||
          (await SecureStore.getItemAsync('mailgw_data'));
        if (storedMailTm) {
          const data = JSON.parse(storedMailTm);
          setEmail(data.email);
          if (data.token) {
            setAuthToken(data.token);
          }
          await fetchEmails();
        } else {
          showAlert('No Active Inbox', 'No active Mail.TM email found. Please create one first.');
          navigate('/temp-mail', { replace: true });
        }
      } catch {
        showAlert('Error', 'Failed to load inbox session. Please try again.');
        setLoading(false);
      }
    };

    init();
  }, [activeProvider, fetchEmails, navigate, showAlert]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchEmails();
  }, [fetchEmails]);

  const handleDeleteEmail = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    showAlert('Delete Email', 'Are you sure you want to delete this message?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            if (activeProvider === TempMailProvider.TempMailLol) {
              const remaining = deleteTempMailLolMessage(id);
              setEmails(remaining);
            } else if (activeProvider === TempMailProvider.Maildrop) {
              await deleteMaildropMessage(id);
              setEmails((prev) => prev.filter((item) => item.id !== id));
            } else {
              await deleteMessage(id);
              setEmails((prev) => prev.filter((item) => item.id !== id));
            }
          } catch {
            showAlert('Error', 'Failed to delete email. Please try again.');
          }
        },
      },
    ]);
  };

  const viewEmailDetails = (emailId: string) => {
    navigate(
      `/temp-mail/detail?id=${encodeURIComponent(emailId)}&provider=${encodeURIComponent(activeProvider)}`
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const canvasBg = isLight ? '#F2F4FB' : '#0F1322';
  const cardBg = isLight ? '#FFFFFF' : '#171D33';
  const cardBorder = isLight ? '#DCE2F2' : '#263052';
  const textPrimary = isLight ? '#0F172A' : '#F3F4F6';
  const textSecondary = isLight ? '#475569' : '#94A3B8';
  const textMuted = isLight ? '#64748B' : '#64748B';

  return (
    <div
      className="route-theme-canvas"
      style={{
        backgroundColor: canvasBg,
        backgroundImage: isLight
          ? 'radial-gradient(ellipse 80% 45% at 50% -10%, rgba(99, 102, 241, 0.1), transparent 70%)'
          : 'radial-gradient(ellipse 80% 45% at 50% -10%, rgba(99, 102, 241, 0.16), transparent 70%)',
      }}
    >
      <div className="workspace-shell">
        <AppHeader onOpenCommandPalette={onOpenCommandPalette} subtitle={providerBadge.title} />

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
                ? '0 8px 24px rgba(15, 23, 42, 0.04)'
                : '0 14px 34px rgba(0, 0, 0, 0.32)',
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
                  color: providerBadge.accent,
                  backgroundColor: providerBadge.bg,
                  border: `1px solid ${providerBadge.border}`,
                  borderRadius: 999,
                  padding: '2px 8px',
                  fontWeight: 600,
                  flexShrink: 0,
                }}
              >
                {providerBadge.label}
              </span>
              {email && (
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
                    {email}
                  </span>
                </div>
              )}
            </div>

            <Button
              variant="secondary"
              size="sm"
              onClick={onRefresh}
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
              <FiInbox size={32} color={providerBadge.accent} />
              <div style={{ fontSize: 15, fontWeight: 600, color: textPrimary }}>
                Inbox is ready and listening
              </div>
              <div style={{ fontSize: 13, color: textSecondary, maxWidth: 380 }}>
                Incoming messages for this disposable address will appear here. Click Refresh to poll for new mail.
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {emails.map((item) => {
                const initial = (
                  item.from?.name
                    ? item.from.name.charAt(0)
                    : item.from?.address?.charAt(0) || 'U'
                ).toUpperCase();
                const avatar = getAvatarStyle(initial);

                return (
                  <div
                    key={item.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => viewEmailDetails(item.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        viewEmailDetails(item.id);
                      }
                    }}
                    style={{
                      backgroundColor: cardBg,
                      border: `1px solid ${cardBorder}`,
                      borderRadius: 11,
                      padding: '14px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 14,
                      cursor: 'pointer',
                      transition: 'border-color 0.15s ease, transform 0.15s ease',
                    }}
                  >
                    <div
                      className="mono"
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: '50%',
                        backgroundColor: avatar.bg,
                        border: `1px solid ${avatar.border}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 14,
                        fontWeight: 600,
                        color: avatar.color,
                        flexShrink: 0,
                      }}
                    >
                      {initial}
                    </div>

                    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: textPrimary,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {item.from?.name || item.from?.address}
                      </div>
                      <div
                        style={{
                          fontSize: 13,
                          color: providerBadge.accent,
                          fontWeight: 500,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {item.subject || '(No subject)'}
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          color: textSecondary,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {item.intro || '(No content)'}
                      </div>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-end',
                        gap: 8,
                        flexShrink: 0,
                      }}
                    >
                      <span className="mono" style={{ fontSize: 11, color: textMuted }}>
                        {formatDate(item.createdAt)}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteEmail(item.id, e)}
                        aria-label="Delete Email"
                        style={{ color: '#F43F5E', padding: 4, display: 'inline-flex' }}
                      >
                        <FiTrash2 size={15} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
