import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  FiArrowLeft,
  FiRefreshCw,
  FiAlertTriangle,
  FiPaperclip,
  FiTrash2,
  FiInbox,
} from 'react-icons/fi';
import { AppHeader } from '../../shared/ui/AppHeader';
import { Button } from '../../shared/ui/Button';
import { useAlert } from '../../shared/context/AlertContext';
import { useTheme } from '../../shared/context/ThemeContext';
import * as SecureStore from '../../shared/utils/storage';
import * as GuerrillaAPI from './tempMailService';
import { GuerrillaEmailResponse, GuerrillaAddressData } from './tempMailService';

const CACHED_EMAILS_SESSION_KEY = 'guerrilla_cached_emails';

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

export interface GuerrillaInboxPageProps {
  onOpenCommandPalette: () => void;
}

export const GuerrillaInboxPage: React.FC<GuerrillaInboxPageProps> = ({
  onOpenCommandPalette,
}) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialEmailsParam = searchParams.get('initialEmails');
  const { showAlert } = useAlert();
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [emailData, setEmailData] = useState<GuerrillaAddressData | null>(null);
  const [tokenInitialized, setTokenInitialized] = useState(false);
  const [sessionError, setSessionError] = useState(false);

  const [emails, setEmails] = useState<GuerrillaEmailResponse[]>(() => {
    try {
      if (initialEmailsParam) {
        const parsed = JSON.parse(initialEmailsParam);
        if (Array.isArray(parsed)) return parsed;
      }
      const fromSession = window.sessionStorage.getItem(CACHED_EMAILS_SESSION_KEY);
      if (fromSession) {
        const parsed = JSON.parse(fromSession);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // Ignore parse errors
    }
    return [];
  });

  useEffect(() => {
    try {
      window.sessionStorage.setItem(CACHED_EMAILS_SESSION_KEY, JSON.stringify(emails));
    } catch {
      // Ignore sessionStorage errors
    }
  }, [emails]);

  const saveEmailData = async (data: { email: string; sidToken: string; emailUser: string }) => {
    try {
      const nextData: GuerrillaAddressData = {
        email_addr: data.email,
        sid_token: data.sidToken,
        email_user: data.emailUser,
      };

      setEmailData(nextData);
      await SecureStore.setItemAsync('guerrilla_data', JSON.stringify(nextData));
    } catch {
      showAlert('Error', 'Failed to save email data.');
    }
  };

  const getNewEmailAddress = async () => {
    try {
      setLoading(true);
      setTokenInitialized(false);
      setSessionError(false);

      await SecureStore.deleteItemAsync('guerrilla_data');

      const newAddress = await GuerrillaAPI.getEmailAddress();

      if (newAddress && newAddress.email && newAddress.sidToken) {
        if (!newAddress.emailUser) {
          newAddress.emailUser = newAddress.email.split('@')[0];
        }

        await saveEmailData(newAddress);

        const success = GuerrillaAPI.initializeFromStoredData({
          sid_token: newAddress.sidToken,
          email_user: newAddress.emailUser,
        });

        if (success) {
          setTokenInitialized(true);

          try {
            await new Promise((resolve) => setTimeout(resolve, 300));
            const messages = await GuerrillaAPI.checkInbox();
            setEmails(Array.isArray(messages) ? messages : []);
            setSessionError(false);
          } catch {
            // Inbox might be empty
          }

          return newAddress.email;
        } else {
          setSessionError(true);
          return null;
        }
      } else {
        setSessionError(true);
        showAlert('Error', 'Failed to create a new GuerrillaMail address. Please try again.');
        return null;
      }
    } catch {
      setSessionError(true);
      showAlert('Error', 'Failed to create a new GuerrillaMail address. Please try again.');
      return null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadUserData = async () => {
      try {
        setLoading(true);
        setSessionError(false);
        const storedGuerrilla = await SecureStore.getItemAsync('guerrilla_data');

        if (storedGuerrilla) {
          try {
            const data = JSON.parse(storedGuerrilla) as GuerrillaAddressData;
            setEmailData(data);

            if (data.sid_token) {
              if (!data.email_user) {
                data.email_user = data.email_addr.split('@')[0];
              }

              const success = GuerrillaAPI.initializeFromStoredData({
                sid_token: data.sid_token,
                email_user: data.email_user,
              });

              if (success) {
                setTokenInitialized(true);
                await new Promise((resolve) => setTimeout(resolve, 300));
                const messages = await GuerrillaAPI.checkInbox();

                if (Array.isArray(messages)) {
                  setEmails((prevEmails) => {
                    const existingIds = new Set(prevEmails.map((e) => e.mail_id));
                    const newMessages = messages.filter((m) => !existingIds.has(m.mail_id));
                    return newMessages.length > 0 ? [...newMessages, ...prevEmails] : prevEmails;
                  });
                  setSessionError(false);
                } else {
                  throw new Error('Invalid response format');
                }
              } else {
                setSessionError(true);
                await getNewEmailAddress();
              }
            } else {
              setSessionError(true);
              await getNewEmailAddress();
            }
          } catch {
            setSessionError(true);
            await getNewEmailAddress();
          }
        } else {
          await getNewEmailAddress();
        }
      } catch {
        setSessionError(true);
        showAlert(
          'Session Error',
          'Failed to load email account. Please use the Reset Session button to obtain a new address.'
        );
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, []);

  const resetEmailAddress = () => {
    showAlert('Reset Session', 'Are you sure you want to generate a new GuerrillaMail address?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset',
        onPress: async () => {
          try {
            await GuerrillaAPI.forgetMe();
            const newEmail = await getNewEmailAddress();
            if (newEmail) {
              showAlert('Session Reset', `New email address: ${newEmail}`);
            }
          } catch {
            showAlert('Error', 'Failed to reset email address.');
          }
        },
      },
    ]);
  };

  const fetchEmails = async (showLoader = true) => {
    if (showLoader) {
      setLoading(true);
    }

    try {
      if (!GuerrillaAPI.isInitialized(emailData?.sid_token || '')) {
        const storedGuerrilla = await SecureStore.getItemAsync('guerrilla_data');
        if (storedGuerrilla) {
          const data = JSON.parse(storedGuerrilla);
          const reInitialized = GuerrillaAPI.initializeFromStoredData({
            sid_token: data.sid_token,
            email_user: data.email_user || data.email_addr.split('@')[0],
          });

          if (!reInitialized) {
            setSessionError(true);
            if (showLoader) {
              showAlert(
                'Session Expired',
                'Your email session has expired. Would you like to obtain a new email address?',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'New Address', onPress: () => getNewEmailAddress() },
                ]
              );
            }
            return;
          }
        } else {
          setSessionError(true);
          if (showLoader) {
            showAlert(
              'Session Expired',
              'Your email session has expired. Would you like to obtain a new email address?',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'New Address', onPress: () => getNewEmailAddress() },
              ]
            );
          }
          return;
        }
      }

      try {
        const messages = await GuerrillaAPI.checkInbox();

        if (Array.isArray(messages)) {
          setEmails((prevEmails) => {
            const existingIds = new Set(prevEmails.map((e) => e.mail_id));
            const newMessages = messages.filter((m) => !existingIds.has(m.mail_id));
            return [...newMessages, ...prevEmails];
          });

          setSessionError(false);
          return;
        }
      } catch {
        // Fallback below
      }

      try {
        const url = `${GuerrillaAPI.GUERRILLA_BASE_URL}?f=get_email_address&sid_token=${emailData?.sid_token}`;
        const response = await fetch(url, {
          headers: { Accept: 'application/json' },
        });

        if (response.ok) {
          const messages = await GuerrillaAPI.checkInbox();
          if (Array.isArray(messages)) {
            setEmails(messages);
            setSessionError(false);
            return;
          }
        }
      } catch {
        // Alternative fetch failed
      }

      setSessionError(true);
      setEmails([]);

      if (showLoader) {
        showAlert(
          'Session Error',
          'Failed to fetch emails. Your session may have expired. Try resetting your session.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Reset Session', onPress: resetEmailAddress },
          ]
        );
      }
    } catch {
      setSessionError(true);
      if (showLoader) {
        showAlert('Error', 'Failed to load emails. Please try again or reset your session.');
      }
    } finally {
      if (showLoader) {
        setLoading(false);
      }
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchEmails(false);
  }, [tokenInitialized, emailData]);

  const handleDeleteEmail = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    showAlert('Remove Email', 'Remove this email from your inbox view?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          setEmails((prev) => prev.filter((item) => item.mail_id !== id));
        },
      },
    ]);
  };

  const viewEmailDetails = (emailId: string) => {
    navigate(`/temp-mail/detail?id=${encodeURIComponent(emailId)}&provider=guerrilla`);
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleBackToTempMail = () => {
    try {
      window.sessionStorage.setItem(CACHED_EMAILS_SESSION_KEY, JSON.stringify(emails));
    } catch {
      // Ignore sessionStorage errors
    }
    navigate('/temp-mail');
  };

  const canvasBg = isLight ? '#F6F6F4' : '#121418';
  const cardBg = isLight ? '#FFFFFF' : '#191C22';
  const cardBorder = isLight ? '#E3E4E8' : '#282C35';
  const wellBg = isLight ? '#EFEFED' : '#101216';
  const textPrimary = isLight ? '#18191C' : '#ECEEEF';
  const textSecondary = isLight ? '#525660' : '#9EA4B0';
  const textMuted = isLight ? '#787D87' : '#6C727F';
  const sageAccent = isLight ? '#3F8765' : '#51A37D';
  const terracottaDanger = isLight ? '#AA5240' : '#C26A58';

  return (
    <div
      className="route-theme-canvas"
      style={{
        backgroundColor: canvasBg,
        backgroundImage: isLight
          ? 'radial-gradient(ellipse 75% 360px at 50% -90px, rgba(63, 135, 101, 0.05), transparent 70%), radial-gradient(rgba(24, 25, 28, 0.035) 1px, transparent 1px)'
          : 'radial-gradient(ellipse 75% 360px at 50% -90px, rgba(81, 163, 125, 0.06), transparent 70%), radial-gradient(rgba(255, 255, 255, 0.025) 1px, transparent 1px)',
        backgroundSize: '100% 100%, 24px 24px',
      }}
    >
      <div className="workspace-shell">
        <AppHeader onOpenCommandPalette={onOpenCommandPalette} subtitle="GuerrillaMail Inbox" />

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
          {/* Layer 2 — Inbox Toolbar */}
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
                onClick={handleBackToTempMail}
                aria-label="Back to Temp-Mail"
              >
                <FiArrowLeft size={13} strokeWidth={1.5} />
                <span>Providers</span>
              </Button>

              <span
                className="mono"
                style={{
                  fontSize: 11,
                  color: sageAccent,
                  backgroundColor: 'rgba(81, 163, 125, 0.14)',
                  border: '1px solid rgba(81, 163, 125, 0.38)',
                  borderRadius: 999,
                  padding: '2px 9px',
                  fontWeight: 500,
                  flexShrink: 0,
                }}
              >
                GuerrillaMail
              </span>

              {emailData?.email_addr && (
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
                    {emailData.email_addr}
                  </span>
                  {sessionError && (
                    <span
                      className="mono"
                      style={{
                        fontSize: 11,
                        color: terracottaDanger,
                        backgroundColor: 'rgba(194, 106, 88, 0.14)',
                        border: '1px solid rgba(194, 106, 88, 0.36)',
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

          {/* Session Error Banner */}
          {sessionError && !loading && (
            <button
              type="button"
              onClick={resetEmailAddress}
              style={{
                width: '100%',
                backgroundColor: 'rgba(194, 106, 88, 0.14)',
                border: '1px solid rgba(194, 106, 88, 0.38)',
                borderRadius: 9,
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                color: terracottaDanger,
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
                gap: 12,
                textAlign: 'center',
              }}
            >
              <FiInbox size={30} strokeWidth={1.5} color={sageAccent} />
              <div style={{ fontSize: 15, fontWeight: 600, color: textPrimary }}>
                {sessionError ? 'Session Error' : 'Inbox is ready and listening'}
              </div>
              <div style={{ fontSize: 13, color: textSecondary, maxWidth: 380 }}>
                {sessionError
                  ? 'Your session may have expired. Reset your session to obtain a fresh inbox.'
                  : 'New emails will appear here. Click Refresh to check for incoming mail.'}
              </div>
              {sessionError && (
                <Button variant="primary" size="sm" onClick={resetEmailAddress}>
                  Reset Session
                </Button>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {emails.map((item) => {
                let displayName = item.mail_from || '';
                const matches = displayName.match(/(.*)\s<(.*)>/);
                if (matches && matches.length > 1) {
                  displayName = matches[1];
                }
                const firstLetter = (displayName.charAt(0) || 'U').toUpperCase();
                const avatar = getAvatarStyle(firstLetter);

                return (
                  <div
                    key={item.mail_id}
                    role="button"
                    tabIndex={0}
                    onClick={() => viewEmailDetails(item.mail_id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        viewEmailDetails(item.mail_id);
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
                      {firstLetter}
                    </div>

                    <div
                      style={{
                        flex: 1,
                        minWidth: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 2,
                      }}
                    >
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
                        {displayName}
                      </div>
                      <div
                        style={{
                          fontSize: 13,
                          color: sageAccent,
                          fontWeight: 500,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {item.mail_subject || '(No subject)'}
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
                        {item.mail_excerpt || '(No content)'}
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
                        {formatDate(item.mail_timestamp)}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {item.att > 0 && (
                          <FiPaperclip size={13} strokeWidth={1.5} color={textSecondary} />
                        )}
                        <button
                          type="button"
                          onClick={(e) => handleDeleteEmail(item.mail_id, e)}
                          aria-label="Delete Email"
                          style={{ color: terracottaDanger, padding: 4, display: 'inline-flex' }}
                        >
                          <FiTrash2 size={15} strokeWidth={1.5} />
                        </button>
                      </div>
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
