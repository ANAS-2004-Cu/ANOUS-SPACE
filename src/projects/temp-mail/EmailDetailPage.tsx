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
import { WorkspaceLayout } from '../../shared/ui/WorkspaceLayout';
import { Surface } from '../../shared/ui/Surface';
import { Button } from '../../shared/ui/Button';
import { EmptyState } from '../../shared/ui/EmptyState';
import { useAlert } from '../../shared/context/AlertContext';
import { useTheme } from '../../shared/context/ThemeContext';
import * as Clipboard from '../../shared/utils/clipboard';
import { EmailDetail, normalizeProviderId } from './types';
import { PROVIDER_ADAPTERS } from './providers';

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

  const iframeText = isLight ? '#0F172A' : '#F1F5F9';
  const iframeBg = isLight ? '#FFFFFF' : '#080B11';
  const iframeBorder = isLight ? '#E2E8F0' : '#1E293B';
  const iframeLink = isLight ? '#2563EB' : '#3B82F6';

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
      a { color: ${iframeLink}; }
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

  return (
    <WorkspaceLayout
      onOpenCommandPalette={onOpenCommandPalette}
      subtitle={email?.subject || 'Message Detail'}
      accent="violet"
      width="medium"
    >
      <div
        className="animate-enter"
        style={{
          ['--stagger-index' as string]: 0,
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <Button variant="secondary" size="sm" onClick={() => setShowHtml(!showHtml)}>
              {showHtml ? <FiFileText size={13} /> : <FiCode size={13} />}
              <span>View {showHtml ? 'Plain Text' : 'HTML'}</span>
            </Button>
            <Button variant="secondary" size="sm" onClick={() => copyToClipboard(email.text)}>
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
        <Surface accent="violet" padded={false}>
          <div className="ui-empty-state">
            <div className="spinner" style={{ width: 22, height: 22 }} />
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              Loading email content...
            </span>
          </div>
        </Surface>
      ) : !email ? (
        <EmptyState
          icon={<FiAlertCircle size={20} color="var(--status-danger)" />}
          title="Failed to load email"
          description="The requested message could not be retrieved from the provider."
          action={
            <Button variant="primary" size="sm" onClick={fetchEmailDetails}>
              Try Again
            </Button>
          }
        />
      ) : (
        <>
          <Surface
            accent="violet"
            padded
            className="animate-enter"
            style={{ ['--stagger-index' as string]: 1 }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <h1 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>
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
                  borderTop: '1px solid var(--border-subtle)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                  <div className="avatar-circle">{senderInitial}</div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                      {email.fromName || 'Unknown'}
                    </div>
                    <div
                      className="mono"
                      style={{
                        fontSize: 12,
                        color: 'var(--text-secondary)',
                        wordBreak: 'break-all',
                      }}
                    >
                      {email.fromAddress}
                    </div>
                  </div>
                </div>

                <span className="mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  {formatDate(email.receivedAt)}
                </span>
              </div>

              {email.toAddresses.length > 0 && (
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>To: </span>
                  <span className="mono">{email.toAddresses.join(', ')}</span>
                </div>
              )}
            </div>
          </Surface>

          <Surface padded={false} style={{ overflow: 'hidden', minHeight: 320 }}>
            {showHtml ? (
              <iframe
                title="Email Content"
                style={{
                  width: '100%',
                  height: 400,
                  border: 'none',
                  backgroundColor: 'var(--bg-recessed)',
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
                  color: 'var(--text-primary)',
                  fontSize: 13,
                  lineHeight: 1.65,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  userSelect: 'text',
                  backgroundColor: 'var(--bg-recessed)',
                  minHeight: 320,
                }}
              >
                {email.text || 'No content available'}
              </div>
            )}
          </Surface>

          {email.attachments.length > 0 && adapter.downloadAttachment && (
            <Surface padded>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
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
                      className="ui-surface--recessed"
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 12,
                        padding: '10px 14px',
                        textAlign: 'left',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                        <FiPaperclip
                          size={14}
                          strokeWidth={1.6}
                          color="var(--accent)"
                          style={{ flexShrink: 0 }}
                        />
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
                            {attachment.filename}
                          </div>
                          {attachment.size > 0 && (
                            <div className="mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                              {(attachment.size / 1024).toFixed(0)} KB
                            </div>
                          )}
                        </div>
                      </div>
                      <FiDownload
                        size={14}
                        strokeWidth={1.6}
                        color="var(--accent)"
                        style={{ flexShrink: 0 }}
                      />
                    </button>
                  ))}
                </div>
              </div>
            </Surface>
          )}
        </>
      )}
    </WorkspaceLayout>
  );
};
