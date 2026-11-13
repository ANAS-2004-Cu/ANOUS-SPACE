import React from 'react';
import { FiArrowLeft, FiRefreshCw, FiAlertTriangle, FiInbox } from 'react-icons/fi';
import { Surface } from '../../../shared/ui/Surface';
import { Button } from '../../../shared/ui/Button';
import { Badge } from '../../../shared/ui/Badge';
import { EmptyState } from '../../../shared/ui/EmptyState';
import { EmailSummary } from '../types';
import { MessageRow } from './MessageRow';

export interface InboxViewProps {
  providerLabel: string;
  address: string | null;
  emails: EmailSummary[];
  loading: boolean;
  refreshing: boolean;
  sessionError?: boolean;
  emptyDescription?: string;
  toolbarExtra?: React.ReactNode;
  onBack: () => void;
  onRefresh: () => void;
  onOpenEmail: (id: string) => void;
  onDeleteEmail: (id: string, e: React.MouseEvent) => void;
  onResetSession?: () => void;
}

export const InboxView: React.FC<InboxViewProps> = ({
  providerLabel,
  address,
  emails,
  loading,
  refreshing,
  sessionError = false,
  emptyDescription = 'Incoming messages for this disposable address will appear here. Click Refresh to check for new mail.',
  toolbarExtra,
  onBack,
  onRefresh,
  onOpenEmail,
  onDeleteEmail,
  onResetSession,
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Shared Inbox Toolbar */}
      <Surface
        accent="violet"
        padded={false}
        className="animate-enter"
        style={{ padding: '12px 16px', ['--stagger-index' as string]: 0 }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            <Button
              variant="secondary"
              size="sm"
              onClick={onBack}
              aria-label="Back to Temp-Mail"
            >
              <FiArrowLeft size={13} />
              <span>Providers</span>
            </Button>

            <Badge tone="violet" pill>
              {providerLabel}
            </Badge>

            {address && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                <span className="live-dot" />
                <span
                  className="mono"
                  style={{
                    fontSize: 13,
                    color: 'var(--text-primary)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {address}
                </span>
                {sessionError && <Badge tone="danger">Session Error</Badge>}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {toolbarExtra}
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
        </div>
      </Surface>

      {/* Optional Session Error Banner */}
      {sessionError && !loading && onResetSession && (
        <button
          type="button"
          onClick={onResetSession}
          className="animate-enter"
          style={{
            width: '100%',
            backgroundColor: 'var(--status-danger-subtle)',
            border: '1px solid var(--status-danger-border)',
            borderRadius: 'var(--radius-lg)',
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            color: 'var(--status-danger)',
            fontSize: 13,
            textAlign: 'left',
          }}
        >
          <FiAlertTriangle size={15} strokeWidth={1.6} style={{ flexShrink: 0 }} />
          <span>Session error detected. Click here to reset your session.</span>
        </button>
      )}

      {/* Message List / Loading / Empty State */}
      {loading && !refreshing ? (
        <Surface accent="violet" padded={false}>
          <div className="ui-empty-state">
            <div className="spinner" style={{ width: 22, height: 22 }} />
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Loading emails...</span>
          </div>
        </Surface>
      ) : emails.length === 0 ? (
        <EmptyState
          icon={<FiInbox size={20} strokeWidth={1.6} />}
          title={sessionError ? 'Session Error' : 'Inbox is ready and listening'}
          description={
            sessionError
              ? 'Your session may have expired. Reset your session to obtain a fresh inbox.'
              : emptyDescription
          }
          action={
            sessionError && onResetSession ? (
              <Button variant="primary" size="sm" onClick={onResetSession}>
                Reset Session
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {emails.map((item, idx) => (
            <MessageRow
              key={item.id}
              message={item}
              index={idx}
              onOpen={onOpenEmail}
              onDelete={onDeleteEmail}
            />
          ))}
        </div>
      )}
    </div>
  );
};
