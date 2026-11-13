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
import { EmailDetail, normalizeProviderId } from './types';
import { PROVIDER_ADAPTERS } from './providers';
import { getAvatarStyle } from './components/MessageRow';

export interface EmailDetailPageProps {
  onOpenCommandPalette: () => void;
}

export const EmailDetailPage: React.FC<EmailDetailPageProps> = ({ onOpenCommandPalette }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const id = searchParams.get('id');
  const provider = normalizeProviderId(searchParams.get('provider'));
  const adapter = PROVIDER_ADAPTERS[provider];

  const { showToast } = useAlert();
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [email, setEmail] = useState<EmailDetail | null>(null);
  const [showHtml, setShowHtml] = useState(true);

  const fetchEmailDetails = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const detail = await adapter.fetchMessageDetail(id);
      setEmail(detail);
    } catch {
      showToast({
        title: 'Load Failed',
        message: 'Failed to load email details. Please try again.',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  }, [id, adapter, showToast]);

  useEffect(() => {
    if (!id) {
      showToast({
        title: 'Invalid Email',
        message: 'Missing email identifier.',
        type: 'error',
      });
      navigate('/temp-mail', { replace: true });
      return;
    }

    fetchEmailDetails();
  }, [id, fetchEmailDetails, navigate, showToast]);

  useEffect(() => {
    if (!confirmDelete) return;
    const timer = window.setTimeout(() => setConfirmDelete(false), 3000);
    return () => window.clearTimeout(timer);
  }, [confirmDelete]);

  const handleBack = () => {
    if (provider === 'guerrillamail') {
      navigate('/temp-mail/guerrilla-inbox');
    } else {
      navigate(`/temp-mail/inbox?provider=${encodeURIComponent(provider)}`);
    }
  };

  const handleDeleteEmail = async () => {
    if (!email) return;
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setConfirmDelete(false);
    try {
      await adapter.deleteMessage(email.id);
      showToast({
        title: 'Email Deleted',
        message: 'Message removed from inbox.',
        type: 'info',
      });
      handleBack();
    } catch {
      showToast({
        title: 'Delete Failed',
        message: 'Failed to delete email. Please try again.',
        type: 'error',
      });
    }
  };

  const formatDate = (rawString: string) => {
    if (!rawString) return '';
    const date = new Date(rawString);
    if (Number.isNaN(date.getTime())) {
      return rawString.length <= 24 ? rawString : '';
    }
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
      showToast({
        title: 'Copied',
        message: 'Content copied to clipboard.',
        type: 'success',
      });
    } catch {
      showToast({
        title: 'Copy Failed',
        message: 'Failed to copy text to clipboard.',
        type: 'error',
      });
    }
  };

  const canvasBg = isLight ? '#F8F7F4' : '#141311';
  const cardBg = isLight ? '#FFFFFF' : '#1C1A17';
  const cardBorder = isLight ? '#E5E1D8' : '#2E2A25';
  const wellBg = isLight ? '#EFECE6' : '#100F0D';
  const textPrimary = isLight ? '#18191C' : '#F2F3F5';
  const textSecondary = isLight ? '#52555E' : '#A1A6B3';
  const textMuted = isLight ? '#7C808B' : '#6E7482';

  const iframeText = isLight ? '#18191C' : '#F2F3F5';
  const iframeBg = isLight ? '#FFFFFF' : '#100F0D';
  const iframeBorder = isLight ? '#E5E1D8' : '#2E2A25';

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
        padding: 18px;
        margin: 0;
        font-size: 14px;
        line-height: 1.6;
        word-break: break-word;
      }
      a { color: #5278A8; }
      img { max-width: 100%; height: auto; }
      table { width: 100%; border-collapse: collapse; }
      th, td { border: 1px solid ${iframeBorder}; padding: 8px; }
      pre, code { font-family: 'JetBrains Mono', monospace; color: inherit; }
    </style>
  </head>
  <body>
    ${email?.html || ''}
  </body>
</html>`;

  const senderInitial = ((email?.fromName || email?.fromAddress || '?').charAt(0) || '?').toUpperCase();
  const avatar = getAvatarStyle(senderInitial);

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
          subtitle={email?.subject || 'Message Detail'}
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
                  onClick={() => copyToClipboard(email.text)}
                >
                  <FiCopy size={13} />
                  <span>Copy Content</span>
                </Button>
                <Button variant="danger" size="sm" onClick={handleDeleteEmail}>
                  <FiTrash2 size={13} />
                  <span>{confirmDelete ? 'Confirm Delete?' : 'Delete'}</span>
                </Button>
              </div>
            )}
          </div>

          {loading ? (
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
              <span style={{ fontSize: 13, color: textSecondary }}>Loading email content...</span>
            </div>
          ) : !email ? (
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
              <FiAlertCircle size={32} strokeWidth={1.5} color="#BA5E4E" />
              <div style={{ fontSize: 15, fontWeight: 600, color: textPrimary }}>
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
                  backgroundColor: cardBg,
                  border: `1px solid ${cardBorder}`,
                  borderRadius: 12,
                  padding: 20,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                  boxShadow: isLight
                    ? 'var(--card-top-highlight), 0 8px 22px rgba(24, 25, 28, 0.04)'
                    : 'var(--card-top-highlight), 0 14px 30px rgba(0, 0, 0, 0.3)',
                }}
              >
                <h1 style={{ fontSize: 16, fontWeight: 600, color: textPrimary }}>
                  {email.subject || '(No subject)'}
                </h1>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                    flexWrap: 'wrap',
                    paddingTop: 12,
                    borderTop: `1px solid ${cardBorder}`,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
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
                      {senderInitial}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: textPrimary }}>
                        {email.fromName || 'Unknown'}
                      </div>
                      <div
                        className="mono"
                        style={{ fontSize: 12, color: textSecondary, wordBreak: 'break-all' }}
                      >
                        {email.fromAddress}
                      </div>
                    </div>
                  </div>

                  <span className="mono" style={{ fontSize: 11, color: textMuted }}>
                    {formatDate(email.receivedAt)}
                  </span>
                </div>

                {email.toAddresses.length > 0 && (
                  <div style={{ fontSize: 12, color: textSecondary }}>
                    <span style={{ color: textMuted }}>To: </span>
                    <span className="mono">{email.toAddresses.join(', ')}</span>
                  </div>
                )}
              </section>

              {/* Message Body Viewer */}
              <section
                style={{
                  backgroundColor: cardBg,
                  border: `1px solid ${cardBorder}`,
                  borderRadius: 12,
                  overflow: 'hidden',
                  minHeight: 320,
                  boxShadow: isLight
                    ? 'var(--card-top-highlight), 0 8px 22px rgba(24, 25, 28, 0.04)'
                    : 'var(--card-top-highlight), 0 14px 30px rgba(0, 0, 0, 0.3)',
                }}
              >
                {showHtml ? (
                  <iframe
                    title="Email Content"
                    style={{
                      width: '100%',
                      height: 400,
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
                      copyToClipboard(email.text);
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
                      minHeight: 320,
                    }}
                  >
                    {email.text || 'No content available'}
                  </div>
                )}
              </section>

              {/* Attachments */}
              {email.attachments.length > 0 && adapter.downloadAttachment && (
                <section
                  style={{
                    backgroundColor: cardBg,
                    border: `1px solid ${cardBorder}`,
                    borderRadius: 12,
                    padding: 20,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 600, color: textPrimary }}>
                    Attachments ({email.attachments.length})
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {email.attachments.map((attachment) => (
                      <button
                        key={attachment.id}
                        type="button"
                        onClick={async () => {
                          try {
                            await adapter.downloadAttachment!(
                              attachment.downloadUrl,
                              attachment.filename
                            );
                          } catch {
                            showToast({
                              title: 'Download Failed',
                              message: 'Failed to download attachment.',
                              type: 'error',
                            });
                          }
                        }}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 12,
                          padding: '10px 14px',
                          backgroundColor: wellBg,
                          border: `1px solid ${cardBorder}`,
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
                            color="#5278A8"
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
                              {attachment.filename}
                            </div>
                            {attachment.size > 0 && (
                              <div className="mono" style={{ fontSize: 11, color: textMuted }}>
                                {(attachment.size / 1024).toFixed(0)} KB
                              </div>
                            )}
                          </div>
                        </div>
                        <FiDownload
                          size={14}
                          strokeWidth={1.5}
                          color="#5278A8"
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
