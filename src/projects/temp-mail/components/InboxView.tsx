import React from 'react';
import {
  FiArrowLeft,
  FiRefreshCw,
  FiAlertTriangle,
  FiInbox,
  FiCopy,
  FiPlus,
  FiClock,
} from 'react-icons/fi';
import { Surface } from '../../../shared/ui/Surface';
import { Button } from '../../../shared/ui/Button';
import { Badge, BadgeTone } from '../../../shared/ui/Badge';
import { EmptyState } from '../../../shared/ui/EmptyState';
import { EmailSummary } from '../types';
import { MessageRow } from './MessageRow';

export interface InboxViewProps {
  providerLabel: string;
  capabilityBadges?: Array<{ label: string; tone: BadgeTone }>;
  supportsDelete: boolean;
  address: string | null;
  emails: EmailSummary[];
  loading: boolean;
  refreshing: boolean;
  autoRefresh: boolean;
  sessionError?: boolean;
  creatingNew?: boolean;
  emptyDescription?: string;
  onBack: () => void;
  onCopyAddress: (address: string) => void;
  onToggleAutoRefresh: () => void;
  onRefresh: () => void;
  onNewAddress?: () => void;
  onOpenEmail: (id: string) => void;
  onDeleteEmail: (id: string, e: React.MouseEvent) => void;
  onResetSession?: () => void;
}

export const InboxView: React.FC<InboxViewProps> = ({
  providerLabel,
  capabilityBadges = [],
  supportsDelete,
  address,
  emails,
  loading,
  refreshing,
  autoRefresh,
  sessionError = false,
  creatingNew = false,
  emptyDescription = 'Incoming messages for this disposable address will appear here automatically when auto-refresh is on.',
  onBack,
  onCopyAddress,
  onToggleAutoRefresh,
  onRefresh,
  onNewAddress,
  onOpenEmail,
  onDeleteEmail,
  onResetSession,
}) => {
  return (
    <div className="ui-stack ui-stack--md">
      {/* Unified Inbox Toolbar */}
      <Surface
        accent="slate"
        padded={false}
        className="inbox-toolbar animate-enter"
        style={{ ['--stagger-index' as string]: 0 }}
      >
        <div className="ui-row--between">
          <div className="ui-row ui-row--wrap">
            <Button
              variant="secondary"
              size="sm"
              onClick={onBack}
              aria-label="Back to Providers"
            >
              <FiArrowLeft size={13} />
              <span>Providers</span>
            </Button>

            <Badge tone="slate" pill>
              {providerLabel}
            </Badge>

            {capabilityBadges.slice(0, 2).map((badge) => (
              <Badge key={badge.label} tone={badge.tone} pill>
                {badge.label}
              </Badge>
            ))}

            {sessionError && <Badge tone="danger">Session Expired</Badge>}
          </div>

          <div className="ui-row ui-row--wrap">
            <button
              type="button"
              onClick={onToggleAutoRefresh}
              data-enabled={autoRefresh}
              className="auto-refresh-toggle"
              aria-pressed={autoRefresh}
              title={autoRefresh ? 'Pause 10s auto-refresh' : 'Enable 10s auto-refresh'}
            >
              <FiClock size={12} />
              <span>{autoRefresh ? 'Auto 10s: ON' : 'Auto: OFF'}</span>
            </button>

            <Button
              variant="secondary"
              size="sm"
              onClick={onRefresh}
              disabled={refreshing || creatingNew}
              aria-label="Refresh Inbox"
            >
              <FiRefreshCw size={13} className={refreshing ? 'icon-spin' : undefined} />
              <span>Refresh</span>
            </Button>

            {onNewAddress && (
              <Button
                variant="secondary"
                size="sm"
                onClick={onNewAddress}
                loading={creatingNew}
                aria-label="Generate New Address"
              >
                <FiPlus size={13} />
                <span>New Address</span>
              </Button>
            )}
          </div>
        </div>

        {address && (
          <Surface
            as="div"
            variant="recessed"
            padded={false}
            className="inbox-address-bar"
          >
            <div className="ui-row ui-flex-1">
              <span className="live-dot" />
              <span className="mono inbox-address-text ui-truncate">{address}</span>
            </div>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => onCopyAddress(address)}
              title="Copy Email Address"
            >
              <FiCopy size={13} />
              <span>Copy</span>
            </Button>
          </Surface>
        )}
      </Surface>

      {/* Optional Session Error Banner */}
      {sessionError && !loading && onResetSession && (
        <button
          type="button"
          onClick={onResetSession}
          className="inbox-session-error-btn animate-enter"
        >
          <FiAlertTriangle size={15} strokeWidth={1.6} className="inbox-error-icon" />
          <span>Session expired or unreachable. Click here to create a fresh session.</span>
        </button>
      )}

      {/* Message List / Loading / Empty State */}
      {loading && !refreshing ? (
        <Surface accent="slate" padded={false}>
          <div className="inbox-loading-well">
            <div className="spinner" />
            <span className="ui-section-subtitle">Loading messages...</span>
          </div>
        </Surface>
      ) : emails.length === 0 ? (
        <EmptyState
          icon={<FiInbox size={20} strokeWidth={1.6} />}
          title={sessionError ? 'Session Unavailable' : 'Inbox is ready and listening'}
          description={
            sessionError
              ? 'Your temporary session may have expired. Create a new address or return to providers.'
              : emptyDescription
          }
          action={
            sessionError && onResetSession ? (
              <Button variant="primary" size="sm" onClick={onResetSession}>
                Create Fresh Session
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
              supportsDelete={supportsDelete}
              onOpen={onOpenEmail}
              onDelete={onDeleteEmail}
            />
          ))}
        </div>
      )}
    </div>
  );
};
