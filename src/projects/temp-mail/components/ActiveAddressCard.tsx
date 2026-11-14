import React from 'react';
import { FiCopy, FiInbox, FiTrash2 } from 'react-icons/fi';
import { Badge } from '../../../shared/ui/Badge';
import { Button } from '../../../shared/ui/Button';
import { Surface } from '../../../shared/ui/Surface';
import { ProviderMeta } from '../types';
import { getCapabilityBadges } from '../providers';

export interface ActiveAddressCardProps {
  address: string;
  providerMeta: ProviderMeta;
  onCopy: (address: string) => void;
  onOpenInbox: () => void;
  onResetSession?: () => void;
}

export const ActiveAddressCard: React.FC<ActiveAddressCardProps> = ({
  address,
  providerMeta,
  onCopy,
  onOpenInbox,
  onResetSession,
}) => {
  const badges = getCapabilityBadges(providerMeta.id);

  return (
    <Surface
      variant="accent"
      accent="slate"
      padded
      className="animate-enter"
      style={{ ['--stagger-index' as string]: 2 }}
    >
      <div className="ui-stack ui-stack--md">
        <div className="ui-row--between">
          <div className="ui-row">
            <span className="live-dot" />
            <span className="ui-section-title">Active {providerMeta.label} Inbox</span>
          </div>
          <div className="provider-cap-strip">
            {badges.slice(0, 3).map((b) => (
              <Badge key={b.label} tone={b.tone} pill>
                {b.label}
              </Badge>
            ))}
          </div>
        </div>

        <Surface
          as="div"
          variant="recessed"
          padded={false}
          className="active-address-well"
        >
          <span className="mono active-address-text">{address}</span>

          <div className="ui-row ui-row--wrap">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onCopy(address)}
              title="Copy Email Address"
            >
              <FiCopy size={13} />
              <span>Copy</span>
            </Button>
            {onResetSession && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onResetSession}
                title="Clear Saved Address"
                aria-label="Clear Saved Address"
              >
                <FiTrash2 size={13} />
              </Button>
            )}
            <Button variant="primary" size="sm" onClick={onOpenInbox}>
              <FiInbox size={13} />
              <span>Open Inbox</span>
            </Button>
          </div>
        </Surface>
      </div>
    </Surface>
  );
};
