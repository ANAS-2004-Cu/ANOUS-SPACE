import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  FiArrowLeft,
  FiRefreshCw,
  FiMail,
  FiAlertTriangle,
  FiPaperclip,
  FiTrash2,
  FiInbox,
} from 'react-icons/fi';
import { AppHeader } from '../../shared/ui/AppHeader';
import { Button } from '../../shared/ui/Button';
import { useAlert } from '../../shared/context/AlertContext';
import * as SecureStore from '../../shared/utils/storage';
import * as GuerrillaAPI from './tempMailService';
import { GuerrillaEmailResponse, GuerrillaAddressData } from './tempMailService';

const CACHED_EMAILS_SESSION_KEY = 'guerrilla_cached_emails';

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

  return (
    <div className="workspace-shell">
      <AppHeader onOpenCommandPalette={onOpenCommandPalette} subtitle="GuerrillaMail Inbox" />

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
            backgroundColor: '#161922',
            border: '1px solid #252A37',
            borderRadius: 10,
            padding: '12px 16px',
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
              <FiArrowLeft size={13} />
              <span>Providers</span>
            </Button>

            {emailData?.email_addr && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                <FiMail size={14} color="#3B82F6" style={{ flexShrink: 0 }} />
                <span
                  className="mono"
                  style={{
                    fontSize: 13,
                    color: '#F3F4F6',
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
                      color: '#EF4444',
                      backgroundColor: 'rgba(239, 68, 68, 0.12)',
                      border: '1px solid rgba(239, 68, 68, 0.35)',
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
              backgroundColor: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              borderRadius: 8,
              padding: '10px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              color: '#EF4444',
              fontSize: 13,
              textAlign: 'left',
            }}
          >
            <FiAlertTriangle size={15} style={{ flexShrink: 0 }} />
            <span>Session error detected. Click here to reset your GuerrillaMail session.</span>
          </button>
        )}

        {/* Email list */}
        {loading && !refreshing ? (
          <div
            style={{
              backgroundColor: '#161922',
              border: '1px solid #252A37',
              borderRadius: 10,
              padding: '60px 20px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
            }}
          >
            <div className="spinner" style={{ width: 22, height: 22 }} />
            <span style={{ fontSize: 13, color: '#9CA3AF' }}>Loading emails...</span>
          </div>
        ) : emails.length === 0 ? (
          <div
            style={{
              backgroundColor: '#161922',
              border: '1px solid #252A37',
              borderRadius: 10,
              padding: '60px 24px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
              textAlign: 'center',
            }}
          >
            <FiInbox size={32} color="#6B7280" />
            <div style={{ fontSize: 15, fontWeight: 600, color: '#F3F4F6' }}>
              {sessionError ? 'Session Error' : 'No emails yet'}
            </div>
            <div style={{ fontSize: 13, color: '#9CA3AF', maxWidth: 380 }}>
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {emails.map((item) => {
              let displayName = item.mail_from || '';
              const matches = displayName.match(/(.*)\s<(.*)>/);
              if (matches && matches.length > 1) {
                displayName = matches[1];
              }
              const firstLetter = displayName.charAt(0).toUpperCase();

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
                    backgroundColor: '#161922',
                    border: '1px solid #252A37',
                    borderRadius: 9,
                    padding: '14px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    cursor: 'pointer',
                  }}
                >
                  <div
                    className="mono"
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 8,
                      backgroundColor: 'rgba(59, 130, 246, 0.12)',
                      border: '1px solid rgba(59, 130, 246, 0.35)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 14,
                      fontWeight: 600,
                      color: '#3B82F6',
                      flexShrink: 0,
                    }}
                  >
                    {firstLetter || 'U'}
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
                        fontSize: 13,
                        fontWeight: 600,
                        color: '#F3F4F6',
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
                        color: '#3B82F6',
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
                        fontSize: 12,
                        color: '#9CA3AF',
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
                    <span className="mono" style={{ fontSize: 11, color: '#6B7280' }}>
                      {formatDate(item.mail_timestamp)}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {item.att > 0 && <FiPaperclip size={13} color="#9CA3AF" />}
                      <button
                        type="button"
                        onClick={(e) => handleDeleteEmail(item.mail_id, e)}
                        aria-label="Delete Email"
                        style={{ color: '#EF4444', padding: 4, display: 'inline-flex' }}
                      >
                        <FiTrash2 size={15} />
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
  );
};
