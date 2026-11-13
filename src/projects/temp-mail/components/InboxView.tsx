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
    <div className="ui-stack ui-stack--md">
      {/* Shared Inbox Toolbar */}
      <Surface
        accent="slate"
        padded={false}
        className="inbox-toolbar animate-enter"
        style={{ ['--stagger-index' as string]: 0 }}
      >
        <div className="ui-row--between">
          <div className="ui-row ui-row--md ui-flex-1">
            <Button
              variant="secondary"
              size="sm"
              onClick={onBack}
              aria-label="Back to Temp-Mail"
            >
              <FiArrowLeft size={13} />
              <span>Providers</span>
            </Button>

            <Badge tone="slate" pill>
              {providerLabel}
            </Badge>

            {address && (
              <div className="ui-row ui-flex-1">
                <span className="live-dot" />
                <span className="mono inbox-address-text ui-truncate">{address}</span>
                {sessionError && <Badge tone="danger">Session Error</Badge>}
              </div>
            )}
          </div>

          <div className="ui-row">
            {toolbarExtra}
            <Button
              variant="secondary"
              size="sm"
              onClick={onRefresh}
              disabled={refreshing}
              aria-label="Refresh Inbox"
            >
              <FiRefreshCw size={13} className={refreshing ? 'icon-spin' : undefined} />
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
          className="inbox-session-error-btn animate-enter"
        >
          <FiAlertTriangle size={15} strokeWidth={1.6} className="inbox-error-icon" />
          <span>Session error detected. Click here to reset your session.</span>
        </button>
      )}

      {/* Message List / Loading / Empty State */}
      {loading && !refreshing ? (
        <Surface accent="slate" padded={false}>
          <div className="inbox-loading-well">
            <div className="spinner" />
            <span className="ui-section-subtitle">Loading emails...</span>
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
        <div className="ui-stack ui-stack--sm">
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
