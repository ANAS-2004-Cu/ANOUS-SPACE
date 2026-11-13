import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FiArrowLeft, FiRefreshCw, FiMail, FiTrash2, FiInbox } from 'react-icons/fi';
import { AppHeader } from '../../shared/ui/AppHeader';
import { Button } from '../../shared/ui/Button';
import { useAlert } from '../../shared/context/AlertContext';
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

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [emails, setEmails] = useState<Email[]>([]);
  const [email, setEmail] = useState<string | null>(null);

  const getHeaderTitle = () => {
    switch (activeProvider) {
      case TempMailProvider.TempMailLol:
        return 'TempMail.lol Inbox';
      case TempMailProvider.Maildrop:
        return 'Maildrop.cc Inbox';
      default:
        return 'Mail.TM Inbox';
    }
  };

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

  return (
    <div className="workspace-shell">
      <AppHeader onOpenCommandPalette={onOpenCommandPalette} subtitle={getHeaderTitle()} />

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
              onClick={() => navigate('/temp-mail')}
              aria-label="Back to Temp-Mail"
            >
              <FiArrowLeft size={13} />
              <span>Providers</span>
            </Button>
            {email && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  minWidth: 0,
                }}
              >
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
              gap: 10,
              textAlign: 'center',
            }}
          >
            <FiInbox size={32} color="#6B7280" />
            <div style={{ fontSize: 15, fontWeight: 600, color: '#F3F4F6' }}>No emails yet</div>
            <div style={{ fontSize: 13, color: '#9CA3AF', maxWidth: 380 }}>
              Incoming messages will appear here. Click Refresh to check for new mail.
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {emails.map((item) => (
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
                  {item.from?.name
                    ? item.from.name.charAt(0).toUpperCase()
                    : item.from?.address?.charAt(0).toUpperCase() || 'U'}
                </div>

                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
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
                    {item.from?.name || item.from?.address}
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
                    {item.subject || '(No subject)'}
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
                  <span className="mono" style={{ fontSize: 11, color: '#6B7280' }}>
                    {formatDate(item.createdAt)}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => handleDeleteEmail(item.id, e)}
                    aria-label="Delete Email"
                    style={{ color: '#EF4444', padding: 4, display: 'inline-flex' }}
                  >
                    <FiTrash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};
