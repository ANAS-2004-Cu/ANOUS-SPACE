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
  onOpen: (id: string) => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
}

export const MessageRow: React.FC<MessageRowProps> = ({
  message,
  index = 0,
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
      className="message-row animate-enter"
      style={{ ['--stagger-index' as string]: Math.min(index, 8) }}
    >
      <div className="avatar-circle">{initial}</div>

      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: 'var(--text-primary)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {senderDisplay}
        </div>
        <div
          style={{
            fontSize: 13,
            color: 'var(--cat-violet-accent)',
            fontWeight: 500,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {message.subject || '(No subject)'}
        </div>
        <div
          style={{
            fontSize: 12,
            color: 'var(--text-secondary)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {message.preview || '(No content)'}
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
        <span className="mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>
          {formatMessageDate(message.receivedAt)}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {message.hasAttachments && (
            <FiPaperclip size={13} strokeWidth={1.6} color="var(--text-secondary)" />
          )}
          {confirmingDelete ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setConfirmingDelete(false);
                onDelete(message.id, e);
              }}
              aria-label="Confirm Delete Email"
              className="ui-btn ui-btn--danger ui-btn--sm"
              style={{ height: 24, padding: '0 8px', fontSize: 11 }}
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
              className="icon-btn"
              style={{
                width: 26,
                height: 26,
                border: 'none',
                backgroundColor: 'transparent',
                color: 'var(--status-danger)',
              }}
            >
              <FiTrash2 size={14} strokeWidth={1.6} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
