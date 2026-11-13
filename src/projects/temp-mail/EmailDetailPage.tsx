import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  FiArrowLeft,
  FiTrash2,
  FiAlertCircle,
  FiCopy,
  FiPaperclip,
  FiDownload,
  FiCode,
  FiFileText,
} from 'react-icons/fi';
import { AppHeader } from '../../shared/ui/AppHeader';
import { Button } from '../../shared/ui/Button';
import { useAlert } from '../../shared/context/AlertContext';
import { useTheme } from '../../shared/context/ThemeContext';
import * as Clipboard from '../../shared/utils/clipboard';
import * as SecureStore from '../../shared/utils/storage';
import {
  getMessage,
  deleteMessage,
  downloadMailTmAttachment,
  hydrateMailTmToken,
  TempMailProvider,
  getTempMailLolMessage,
  deleteTempMailLolMessage,
  fetchMaildropMessageDetail,
  deleteMaildropMessage,
} from './tempMailService';
import * as GuerrillaAPI from './tempMailService';

export interface EmailDetailPageProps {
  onOpenCommandPalette: () => void;
}

export const EmailDetailPage: React.FC<EmailDetailPageProps> = ({ onOpenCommandPalette }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const id = searchParams.get('id');
  const rawProvider = searchParams.get('provider') || TempMailProvider.MailTM;
  const provider = rawProvider === 'mailgw' ? TempMailProvider.MailTM : rawProvider;
  const { showAlert } = useAlert();
  const { theme } = useTheme();

  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState<any>(null);
  const [htmlContent, setHtmlContent] = useState('');
  const [plainTextContent, setPlainTextContent] = useState('');
  const [showHtml, setShowHtml] = useState(true);

  const isGuerrilla = provider === 'guerrilla' || provider === TempMailProvider.GuerrillaMail;
  const isTempMailLol = provider === TempMailProvider.TempMailLol;
  const isMaildrop = provider === TempMailProvider.Maildrop;
  const isMailTm = !isGuerrilla && !isTempMailLol && !isMaildrop;

  const initializeGuerrillaAPI = async () => {
    try {
      const storedGuerrilla = await SecureStore.getItemAsync('guerrilla_data');
      if (storedGuerrilla) {
        const data = JSON.parse(storedGuerrilla);
        GuerrillaAPI.initializeFromStoredData({
          sid_token: data.sid_token,
          email_user: data.email_user || data.email_addr?.split('@')[0] || 'user',
        });
      } else {
        throw new Error('No stored GuerrillaMail session found');
      }
    } catch (error) {
      showAlert('Error', 'Failed to initialize email session. Please try again.');
      throw error;
    }
  };

  const fetchEmailDetails = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);

      if (isTempMailLol) {
        const emailData = getTempMailLolMessage(id);
        if (!emailData) {
          throw new Error('TempMail.lol message not found');
        }
        setEmail(emailData);
        setHtmlContent(
          emailData.html || `<div>${emailData.text || 'No content available'}</div>`
        );
        setPlainTextContent(emailData.text || 'No content available');
      } else if (isMaildrop) {
        const emailData = await fetchMaildropMessageDetail(id);
        setEmail(emailData);
        setHtmlContent(
          emailData.html || `<div>${emailData.text || 'No content available'}</div>`
        );
        setPlainTextContent(emailData.text || 'No content available');
      } else if (isMailTm) {
        hydrateMailTmToken();
        const emailData = await getMessage(id);
        setEmail(emailData);

        const rawHtml = Array.isArray(emailData.html)
          ? emailData.html.join('\n')
          : emailData.html;
        const html = rawHtml || `<div>${emailData.text || 'No content available'}</div>`;
        const text = emailData.text || 'No content available';

        setHtmlContent(html);
        setPlainTextContent(text);
      } else {
        await initializeGuerrillaAPI();
        const emailData = await GuerrillaAPI.fetchEmail(id);

        if (!emailData) {
          throw new Error('Failed to fetch email data');
        }

        setEmail(emailData);

        const html =
          emailData.mail_body ||
          `<div>${emailData.mail_excerpt || 'No content available'}</div>`;
        const text = emailData.mail_body
          ? emailData.mail_body.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
          : emailData.mail_excerpt || 'No content available';

        setHtmlContent(html);
        setPlainTextContent(text);
      }
    } catch {
      showAlert('Error', 'Failed to load email details. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [id, isMailTm, isTempMailLol, isMaildrop, showAlert]);

  useEffect(() => {
    if (!id || typeof id !== 'string') {
      showAlert('Error', 'Invalid email identifier.');
      navigate('/temp-mail', { replace: true });
      return;
    }

    fetchEmailDetails();
  }, [id, provider, fetchEmailDetails, navigate, showAlert]);

  const handleBack = () => {
    if (isGuerrilla) {
      navigate('/temp-mail/guerrilla-inbox');
    } else {
      navigate(`/temp-mail/inbox?provider=${encodeURIComponent(provider)}`);
    }
  };

  const handleDeleteEmail = () => {
    if (!email) return;

    showAlert('Delete Email', 'Are you sure you want to delete this email?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            if (isTempMailLol) {
              deleteTempMailLolMessage(email.id);
              showAlert('Deleted', 'Email deleted.');
            } else if (isMaildrop) {
              await deleteMaildropMessage(email.id);
              showAlert('Deleted', 'Email deleted.');
            } else if (isMailTm) {
              await deleteMessage(email.id);
              showAlert('Deleted', 'Email deleted.');
            } else {
              showAlert('Removed', 'Email removed from inbox.');
            }
            handleBack();
          } catch {
            showAlert('Error', 'Failed to delete email. Please try again.');
          }
        },
      },
    ]);
  };

  const formatDate = (dateValue: string | number) => {
    if (!dateValue) return '';

    const date =
      typeof dateValue === 'string'
        ? new Date(dateValue)
        : new Date(Number(dateValue) * 1000);

    return date.toLocaleString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const copyToClipboard = async (text: string) => {
    try {
      await Clipboard.setStringAsync(text);
      showAlert('Copied', 'Content copied to clipboard.');
    } catch {
      showAlert('Error', 'Failed to copy text to clipboard.');
    }
  };

  const isStandardEmailModel = !isGuerrilla;
  const emailSubject = email
    ? isStandardEmailModel
      ? email.subject
      : email.mail_subject
    : 'Message Detail';

  const iframeText = theme === 'light' ? '#0F172A' : '#F3F4F6';
  const iframeBg = theme === 'light' ? '#FFFFFF' : '#0E1015';
  const iframeBorder = theme === 'light' ? '#E2E8F0' : '#252A37';

  const htmlWrapper = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <base target="_blank" rel="noopener noreferrer" />
    <style>
      body {
        font-family: 'Inter', system-ui, -apple-system, sans-serif;
        color: ${iframeText};
        background-color: ${iframeBg};
        padding: 16px;
        margin: 0;
        font-size: 14px;
        line-height: 1.6;
        word-break: break-word;
      }
      a { color: #3B82F6; }
      img { max-width: 100%; height: auto; }
      table { width: 100%; border-collapse: collapse; }
      th, td { border: 1px solid ${iframeBorder}; padding: 8px; }
      pre, code { font-family: 'JetBrains Mono', monospace; color: inherit; }
    </style>
  </head>
  <body>
    ${htmlContent}
  </body>
</html>`;

  return (
    <div className="workspace-shell">
      <AppHeader
        onOpenCommandPalette={onOpenCommandPalette}
        subtitle={emailSubject || '(No subject)'}
      />

      <main
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
          maxWidth: 780,
          width: '100%',
          margin: '0 auto',
          paddingBottom: 40,
        }}
      >
        {/* Top Action Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10,
            flexWrap: 'wrap',
          }}
        >
          <Button variant="secondary" size="sm" onClick={handleBack}>
            <FiArrowLeft size={13} />
            <span>Back to Inbox</span>
          </Button>

          {email && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowHtml(!showHtml)}
              >
                {showHtml ? <FiFileText size={13} /> : <FiCode size={13} />}
                <span>View {showHtml ? 'Plain Text' : 'HTML'}</span>
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => copyToClipboard(plainTextContent)}
              >
                <FiCopy size={13} />
                <span>Copy Content</span>
              </Button>
              <Button variant="danger" size="sm" onClick={handleDeleteEmail}>
                <FiTrash2 size={13} />
                <span>Delete</span>
              </Button>
            </div>
          )}
        </div>

        {loading ? (
          <div
            style={{
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
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
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Loading email content...</span>
          </div>
        ) : !email ? (
          <div
            style={{
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
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
            <FiAlertCircle size={32} color="#EF4444" />
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>
              Failed to load email
            </div>
            <Button variant="primary" size="sm" onClick={fetchEmailDetails}>
              Try Again
            </Button>
          </div>
        ) : (
          <>
            {/* Metadata Panel */}
            <section
              style={{
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 10,
                padding: 18,
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
              }}
            >
              <h1 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>
                {emailSubject || '(No subject)'}
              </h1>

              {(() => {
                const fromName = isStandardEmailModel
                  ? email.from?.name || 'Unknown'
                  : email.mail_from?.match(/(.*)\s<(.*)>/)
                  ? email.mail_from.match(/(.*)\s<(.*)>/)[1]
                  : email.mail_from;
                const fromEmail = isStandardEmailModel
                  ? email.from?.address
                  : email.mail_from?.match(/(.*)\s<(.*)>/)
                  ? email.mail_from.match(/(.*)\s<(.*)>/)[2]
                  : email.mail_from;
                const dateDisplay = formatDate(
                  isStandardEmailModel ? email.createdAt : email.mail_timestamp
                );

                return (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 12,
                      flexWrap: 'wrap',
                      paddingTop: 10,
                      borderTop: '1px solid var(--border-subtle)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                      <div
                        className="mono"
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: 8,
                          backgroundColor: 'rgba(59, 130, 246, 0.12)',
                          border: '1px solid rgba(59, 130, 246, 0.35)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 13,
                          fontWeight: 600,
                          color: '#3B82F6',
                          flexShrink: 0,
                        }}
                      >
                        {(fromName?.charAt(0) || '?').toUpperCase()}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                          {fromName || 'Unknown'}
                        </div>
                        <div
                          className="mono"
                          style={{ fontSize: 12, color: 'var(--text-secondary)', wordBreak: 'break-all' }}
                        >
                          {fromEmail || ''}
                        </div>
                      </div>
                    </div>

                    <span className="mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {dateDisplay}
                    </span>
                  </div>
                );
              })()}

              {isStandardEmailModel && email.to && (
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>To: </span>
                  <span className="mono">
                    {Array.isArray(email.to)
                      ? email.to.map((recipient: any) => recipient.address).join(', ')
                      : ''}
                  </span>
                </div>
              )}
            </section>

            {/* Message Body Viewer */}
            <section
              style={{
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 10,
                overflow: 'hidden',
                minHeight: 320,
              }}
            >
              {showHtml ? (
                <iframe
                  title="Email Content"
                  style={{
                    width: '100%',
                    height: 380,
                    border: 'none',
                    backgroundColor: 'var(--bg-app)',
                    display: 'block',
                  }}
                  srcDoc={htmlWrapper}
                  sandbox="allow-popups allow-popups-to-escape-sandbox"
                />
              ) : (
                <div
                  className="mono"
                  onContextMenu={(e) => {
                    e.preventDefault();
                    copyToClipboard(plainTextContent);
                  }}
                  style={{
                    padding: 18,
                    color: 'var(--text-primary)',
                    fontSize: 13,
                    lineHeight: 1.6,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    userSelect: 'text',
                  }}
                >
                  {plainTextContent || 'No content available'}
                </div>
              )}
            </section>

            {/* Attachments */}
            {isMailTm &&
              email.hasAttachments &&
              Array.isArray(email.attachments) &&
              email.attachments.length > 0 && (
                <section
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 10,
                    padding: 18,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                    Attachments ({email.attachments.length})
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {email.attachments.map((attachment: any, index: number) => (
                      <button
                        key={attachment.id || index}
                        type="button"
                        onClick={async () => {
                          try {
                            await downloadMailTmAttachment(
                              attachment.downloadUrl,
                              attachment.filename || 'attachment'
                            );
                          } catch {
                            showAlert('Error', 'Failed to download attachment.');
                          }
                        }}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 12,
                          padding: '10px 14px',
                          backgroundColor: 'var(--bg-app)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: 8,
                          textAlign: 'left',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            minWidth: 0,
                          }}
                        >
                          <FiPaperclip size={14} color="#3B82F6" style={{ flexShrink: 0 }} />
                          <div style={{ minWidth: 0 }}>
                            <div
                              style={{
                                fontSize: 13,
                                color: 'var(--text-primary)',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}
                            >
                              {attachment.filename || 'Attachment'}
                            </div>
                            <div className="mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                              {attachment.size
                                ? `${(attachment.size / 1024).toFixed(0)} KB`
                                : ''}
                            </div>
                          </div>
                        </div>
                        <FiDownload size={14} color="#3B82F6" style={{ flexShrink: 0 }} />
                      </button>
                    ))}
                  </div>
                </section>
              )}
          </>
        )}
      </main>
    </div>
  );
};
