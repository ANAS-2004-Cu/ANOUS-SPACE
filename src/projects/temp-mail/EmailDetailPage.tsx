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
  const isLight = theme === 'light';

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

  const canvasBg = isLight ? '#F6F6F4' : '#121418';
  const cardBg = isLight ? '#FFFFFF' : '#191C22';
  const cardBorder = isLight ? '#E3E4E8' : '#282C35';
  const wellBg = isLight ? '#EFEFED' : '#101216';
  const textPrimary = isLight ? '#18191C' : '#ECEEEF';
  const textSecondary = isLight ? '#525660' : '#9EA4B0';
  const textMuted = isLight ? '#787D87' : '#6C727F';
  const slateAccent = isLight ? '#426696' : '#5B82B8';
  const terracottaDanger = isLight ? '#AA5240' : '#C26A58';

  const iframeText = isLight ? '#18191C' : '#ECEEEF';
  const iframeBg = isLight ? '#FAF9F6' : '#101216';
  const iframeBorder = isLight ? '#E3E4E8' : '#282C35';

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
        padding: 20px;
        margin: 0;
        font-size: 14px;
        line-height: 1.6;
        word-break: break-word;
      }
      a { color: ${slateAccent}; }
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
        <AppHeader
          onOpenCommandPalette={onOpenCommandPalette}
          subtitle={emailSubject || '(No subject)'}
        />

        <main
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            maxWidth: 780,
            width: '100%',
            margin: '0 auto',
            paddingBottom: 44,
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
              <FiArrowLeft size={13} strokeWidth={1.5} />
              <span>Back to Inbox</span>
            </Button>

            {email && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowHtml(!showHtml)}
                >
                  {showHtml ? (
                    <FiFileText size={13} strokeWidth={1.5} />
                  ) : (
                    <FiCode size={13} strokeWidth={1.5} />
                  )}
                  <span>View {showHtml ? 'Plain Text' : 'HTML'}</span>
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => copyToClipboard(plainTextContent)}
                >
                  <FiCopy size={13} strokeWidth={1.5} />
                  <span>Copy Content</span>
                </Button>
                <Button variant="danger" size="sm" onClick={handleDeleteEmail}>
                  <FiTrash2 size={13} strokeWidth={1.5} />
                  <span>Delete</span>
                </Button>
              </div>
            )}
          </div>

          {loading ? (
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
              <span style={{ fontSize: 13, color: textSecondary }}>Loading email content...</span>
            </div>
          ) : !email ? (
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
              <FiAlertCircle size={30} strokeWidth={1.5} color={terracottaDanger} />
              <div style={{ fontSize: 15, fontWeight: 600, color: textPrimary }}>
                Failed to load email
              </div>
              <Button variant="primary" size="sm" onClick={fetchEmailDetails}>
                Try Again
              </Button>
            </div>
          ) : (
            <>
              {/* Layer 2 — Metadata Panel (24px padding) */}
              <section
                style={{
                  backgroundColor: cardBg,
                  border: `1px solid ${cardBorder}`,
                  boxShadow: 'var(--card-top-highlight), var(--card-shadow)',
                  borderRadius: 12,
                  padding: 24,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 14,
                }}
              >
                <h1 style={{ fontSize: 16.5, fontWeight: 600, color: textPrimary }}>
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
                  const initial = (fromName?.charAt(0) || '?').toUpperCase();
                  const avatar = getAvatarStyle(initial);

                  return (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 12,
                        flexWrap: 'wrap',
                        paddingTop: 14,
                        borderTop: `1px solid ${cardBorder}`,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
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
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 13.5, fontWeight: 600, color: textPrimary }}>
                            {fromName || 'Unknown'}
                          </div>
                          <div
                            className="mono"
                            style={{ fontSize: 12, color: textSecondary, wordBreak: 'break-all' }}
                          >
                            {fromEmail || ''}
                          </div>
                        </div>
                      </div>

                      <span className="mono" style={{ fontSize: 11, color: textMuted }}>
                        {dateDisplay}
                      </span>
                    </div>
                  );
                })()}

                {isStandardEmailModel && email.to && (
                  <div style={{ fontSize: 12, color: textSecondary }}>
                    <span style={{ color: textMuted }}>To: </span>
                    <span className="mono">
                      {Array.isArray(email.to)
                        ? email.to.map((recipient: any) => recipient.address).join(', ')
                        : ''}
                    </span>
                  </div>
                )}
              </section>

              {/* Layer 2 + Layer 3 — Message Body Reading Pane */}
              <section
                style={{
                  backgroundColor: cardBg,
                  border: `1px solid ${cardBorder}`,
                  boxShadow: 'var(--card-top-highlight), var(--card-shadow)',
                  borderRadius: 12,
                  padding: 12,
                  overflow: 'hidden',
                  minHeight: 340,
                }}
              >
                <div
                  style={{
                    borderRadius: 9,
                    overflow: 'hidden',
                    border: `1px solid ${cardBorder}`,
                    backgroundColor: wellBg,
                    boxShadow: 'var(--well-inner-shadow)',
                  }}
                >
                  {showHtml ? (
                    <iframe
                      title="Email Content"
                      style={{
                        width: '100%',
                        height: 410,
                        border: 'none',
                        backgroundColor: wellBg,
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
                        padding: 20,
                        color: textPrimary,
                        fontSize: 13,
                        lineHeight: 1.65,
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        userSelect: 'text',
                        backgroundColor: wellBg,
                        minHeight: 340,
                      }}
                    >
                      {plainTextContent || 'No content available'}
                    </div>
                  )}
                </div>
              </section>

              {/* Attachments */}
              {isMailTm &&
                email.hasAttachments &&
                Array.isArray(email.attachments) &&
                email.attachments.length > 0 && (
                  <section
                    style={{
                      backgroundColor: cardBg,
                      border: `1px solid ${cardBorder}`,
                      boxShadow: 'var(--card-top-highlight), var(--card-shadow)',
                      borderRadius: 12,
                      padding: 24,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 12,
                    }}
                  >
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: textPrimary }}>
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
                            padding: '11px 14px',
                            backgroundColor: wellBg,
                            border: `1px solid ${cardBorder}`,
                            boxShadow: 'var(--well-inner-shadow)',
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
                            <FiPaperclip
                              size={14}
                              strokeWidth={1.5}
                              color={slateAccent}
                              style={{ flexShrink: 0 }}
                            />
                            <div style={{ minWidth: 0 }}>
                              <div
                                style={{
                                  fontSize: 13,
                                  color: textPrimary,
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                }}
                              >
                                {attachment.filename || 'Attachment'}
                              </div>
                              <div className="mono" style={{ fontSize: 11, color: textMuted }}>
                                {attachment.size
                                  ? `${(attachment.size / 1024).toFixed(0)} KB`
                                  : ''}
                              </div>
                            </div>
                          </div>
                          <FiDownload
                            size={14}
                            strokeWidth={1.5}
                            color={slateAccent}
                            style={{ flexShrink: 0 }}
                          />
                        </button>
                      ))}
                    </div>
                  </section>
                )}
            </>
          )}
        </main>
      </div>
    </div>
  );
};
