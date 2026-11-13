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

// Strictly Muted Organic Avatar Palette (Saturation 25%–50%, zero neon/violet/cyan)
const AVATAR_PALETTE = [
  { color: '#5B82B8', bg: 'rgba(91, 130, 184, 0.14)', border: 'rgba(91, 130, 184, 0.36)' },
  { color: '#51A37D', bg: 'rgba(81, 163, 125, 0.14)', border: 'rgba(81, 163, 125, 0.36)' },
  { color: '#C5954E', bg: 'rgba(197, 149, 78, 0.14)', border: 'rgba(197, 149, 78, 0.36)' },
  { color: '#C26A58', bg: 'rgba(194, 106, 88, 0.14)', border: 'rgba(194, 106, 88, 0.36)' },
  { color: '#9E8566', bg: 'rgba(158, 133, 102, 0.14)', border: 'rgba(158, 133, 102, 0.36)' },
  { color: '#A35C6A', bg: 'rgba(163, 92, 106, 0.14)', border: 'rgba(163, 92, 106, 0.36)' },
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
          accent: '#C5954E',
          bg: 'rgba(197, 149, 78, 0.14)',
          border: 'rgba(197, 149, 78, 0.38)',
        };
      case TempMailProvider.Maildrop:
        return {
          title: 'Maildrop.cc Inbox',
          label: 'Maildrop.cc',
          accent: '#C26A58',
          bg: 'rgba(194, 106, 88, 0.14)',
          border: 'rgba(194, 106, 88, 0.38)',
        };
      default:
        return {
          title: 'Mail.TM Inbox',
          label: 'Mail.TM',
          accent: '#5B82B8',
          bg: 'rgba(91, 130, 184, 0.14)',
          border: 'rgba(91, 130, 184, 0.38)',
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

  const canvasBg = isLight ? '#F6F6F4' : '#121418';
  const cardBg = isLight ? '#FFFFFF' : '#191C22';
  const cardBorder = isLight ? '#E3E4E8' : '#282C35';
  const wellBg = isLight ? '#EFEFED' : '#101216';
  const textPrimary = isLight ? '#18191C' : '#ECEEEF';
  const textSecondary = isLight ? '#525660' : '#9EA4B0';
  const textMuted = isLight ? '#787D87' : '#6C727F';
  const terracottaDanger = isLight ? '#AA5240' : '#C26A58';

  return (
    <div
      className="route-theme-canvas"
      style={{
        backgroundColor: canvasBg,
        backgroundImage: isLight
          ? 'radial-gradient(ellipse 75% 360px at 50% -90px, rgba(66, 102, 150, 0.05), transparent 70%), radial-gradient(rgba(24, 25, 28, 0.035) 1px, transparent 1px)'
          : 'radial-gradient(ellipse 75% 360px at 50% -90px, rgba(91, 130, 184, 0.055), transparent 70%), radial-gradient(rgba(255, 255, 255, 0.025) 1px, transparent 1px)',
        backgroundSize: '100% 100%, 24px 24px',
      }}
    >
      <div className="workspace-shell">
        <AppHeader onOpenCommandPalette={onOpenCommandPalette} subtitle={providerBadge.title} />

        <main
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            maxWidth: 760,
            width: '100%',
            margin: '0 auto',
            paddingBottom: 44,
          }}
        >
          {/* Layer 2 — Inbox Header Toolbar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              backgroundColor: cardBg,
              border: `1px solid ${cardBorder}`,
              boxShadow: 'var(--card-top-highlight), var(--card-shadow)',
              borderRadius: 12,
              padding: '14px 20px',
              flexWrap: 'wrap',
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
                  color: providerBadge.accent,
                  backgroundColor: providerBadge.bg,
                  border: `1px solid ${providerBadge.border}`,
                  borderRadius: 999,
                  padding: '2px 9px',
                  fontWeight: 500,
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
                    padding: '4px 10px',
                    borderRadius: 6,
                    backgroundColor: wellBg,
                    border: `1px solid ${cardBorder}`,
                    minWidth: 0,
                  }}
                >
                  <span className="live-pulse-dot" />
                  <span
                    className="mono"
                    style={{
                      fontSize: 12.5,
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
                strokeWidth={1.5}
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
                boxShadow: 'var(--card-top-highlight), var(--card-shadow)',
                borderRadius: 12,
                padding: '64px 24px',
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
                boxShadow: 'var(--card-top-highlight), var(--card-shadow)',
                borderRadius: 12,
                padding: '64px 24px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                textAlign: 'center',
              }}
            >
              <FiInbox size={30} strokeWidth={1.5} color={providerBadge.accent} />
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
                      boxShadow: 'var(--card-top-highlight), var(--card-shadow)',
                      borderRadius: 12,
                      padding: '16px 20px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 14,
                      cursor: 'pointer',
                      transition: 'border-color 0.16s ease, transform 0.16s ease',
                    }}
                  >
                    <div
                      className="mono"
                      style={{
                        width: 40,
                        height: 40,
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
                          fontSize: 13.5,
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
                          fontSize: 12.5,
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
                        style={{ color: terracottaDanger, padding: 4, display: 'inline-flex' }}
                      >
                        <FiTrash2 size={15} strokeWidth={1.5} />
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
