import React, { useEffect, useState } from 'react';
import { FiPaperclip, FiTrash2 } from 'react-icons/fi';
import { EmailSummary } from '../types';

const AVATAR_PALETTE = [
  { color: '#5278A8', bg: 'rgba(82, 120, 168, 0.14)', border: 'rgba(82, 120, 168, 0.36)' },
  { color: '#4D8B6E', bg: 'rgba(77, 139, 110, 0.14)', border: 'rgba(77, 139, 110, 0.36)' },
  { color: '#BA5E4E', bg: 'rgba(186, 94, 78, 0.14)', border: 'rgba(186, 94, 78, 0.36)' },
  { color: '#BD883E', bg: 'rgba(189, 136, 62, 0.14)', border: 'rgba(189, 136, 62, 0.36)' },
  { color: '#9E5262', bg: 'rgba(158, 82, 98, 0.14)', border: 'rgba(158, 82, 98, 0.36)' },
  { color: '#A68B60', bg: 'rgba(166, 139, 96, 0.14)', border: 'rgba(166, 139, 96, 0.36)' },
];

export const getAvatarStyle = (seed: string) => {
  const code = (seed || 'U').charCodeAt(0);
  return AVATAR_PALETTE[code % AVATAR_PALETTE.length];
};

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
  accentColor: string;
  isLight: boolean;
  onOpen: (id: string) => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
}

export const MessageRow: React.FC<MessageRowProps> = ({
  message,
  accentColor,
  isLight,
  onOpen,
  onDelete,
}) => {
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  useEffect(() => {
    if (!confirmingDelete) return;
    const timer = window.setTimeout(() => setConfirmingDelete(false), 3000);
    return () => window.clearTimeout(timer);
  }, [confirmingDelete]);

  const cardBg = isLight ? '#FFFFFF' : '#1C1A17';
  const cardBorder = isLight ? '#E5E1D8' : '#2E2A25';
  const textPrimary = isLight ? '#18191C' : '#F2F3F5';
  const textSecondary = isLight ? '#52555E' : '#A1A6B3';
  const textMuted = isLight ? '#7C808B' : '#6E7482';

  const senderDisplay = message.fromName || message.fromAddress || 'Unknown';
  const initial = (senderDisplay.charAt(0) || 'U').toUpperCase();
  const avatar = getAvatarStyle(initial);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen(message.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onOpen(message.id);
        }
      }}
      style={{
        backgroundColor: cardBg,
        border: `1px solid ${cardBorder}`,
        borderRadius: 11,
        padding: '14px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        cursor: 'pointer',
        transition: 'border-color 0.15s ease, transform 0.15s ease',
      }}
    >
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
        {initial}
      </div>

      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: textPrimary,
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
            color: accentColor,
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
            color: textSecondary,
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
        <span className="mono" style={{ fontSize: 11, color: textMuted }}>
          {formatMessageDate(message.receivedAt)}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {message.hasAttachments && (
            <FiPaperclip size={13} strokeWidth={1.5} color={textSecondary} />
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
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: '#BA5E4E',
                backgroundColor: 'rgba(186, 94, 78, 0.14)',
                border: '1px solid rgba(186, 94, 78, 0.38)',
                borderRadius: 6,
                padding: '2px 8px',
                lineHeight: 1.4,
              }}
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
              style={{ color: '#BA5E4E', padding: 4, display: 'inline-flex' }}
            >
              <FiTrash2 size={15} strokeWidth={1.5} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
