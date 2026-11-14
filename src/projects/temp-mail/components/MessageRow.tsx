import React, { useEffect, useState } from 'react';
import { FiPaperclip, FiTrash2 } from 'react-icons/fi';
import { EmailSummary } from '../types';

function formatMessageDate(rawDate: string): string {
  if (!rawDate) return '';
  const date = new Date(rawDate);
  if (Number.isNaN(date.getTime())) {
    return rawDate.length <= 24 ? rawDate : '';
  }
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export interface MessageRowProps {
  message: EmailSummary;
  index?: number;
  supportsDelete?: boolean;
  onOpen: (id: string) => void;
  onDelete?: (id: string, e: React.MouseEvent) => void;
}

export const MessageRow: React.FC<MessageRowProps> = ({
  message,
  index = 0,
  supportsDelete = true,
  onOpen,
  onDelete,
}) => {
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  useEffect(() => {
    if (!confirmingDelete) return;
    const timer = window.setTimeout(() => setConfirmingDelete(false), 3000);
    return () => window.clearTimeout(timer);
  }, [confirmingDelete]);

  const senderDisplay = message.fromName || message.fromAddress || 'Unknown';
  const initial = (senderDisplay.charAt(0) || 'U').toUpperCase();

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen(message.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpen(message.id);
        }
      }}
      data-accent="slate"
      className="message-row animate-enter"
      style={{ ['--stagger-index' as string]: Math.min(index, 8) }}
    >
      <div className="avatar-circle">{initial}</div>

      <div className="ui-stack ui-stack--xs ui-flex-1">
        <div className="message-row__sender ui-truncate">{senderDisplay}</div>
        <div className="message-row__subject ui-truncate">
          {message.subject || '(No subject)'}
        </div>
        <div className="message-row__preview ui-truncate">
          {message.preview || 'Click to open message'}
        </div>
      </div>

      <div className="message-row__meta">
        <span className="mono ui-meta-label">{formatMessageDate(message.receivedAt)}</span>
        <div className="ui-row">
          {message.hasAttachments && (
            <FiPaperclip size={13} strokeWidth={1.6} color="var(--text-secondary)" />
          )}
          {supportsDelete && onDelete && (
            confirmingDelete ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setConfirmingDelete(false);
                  onDelete(message.id, e);
                }}
                aria-label="Confirm Delete Email"
                className="ui-btn ui-btn--danger ui-btn--sm message-row__confirm-btn"
              >
                Confirm?
              </button>
            ) : (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setConfirmingDelete(true);
                }}
                aria-label="Delete Email"
                className="icon-btn icon-btn--ghost-danger"
              >
                <FiTrash2 size={14} strokeWidth={1.6} />
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
};
