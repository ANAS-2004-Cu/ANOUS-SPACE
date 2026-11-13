import React from 'react';
import { FiCopy, FiInbox } from 'react-icons/fi';
import { Button } from '../../../shared/ui/Button';
import { Surface } from '../../../shared/ui/Surface';
import { ProviderMeta } from '../types';

export interface ActiveAddressCardProps {
  address: string;
  providerMeta: ProviderMeta;
  onCopy: (address: string) => void;
  onOpenInbox: () => void;
}

export const ActiveAddressCard: React.FC<ActiveAddressCardProps> = ({
  address,
  providerMeta,
  onCopy,
  onOpenInbox,
}) => {
  return (
    <Surface
      variant="accent"
      accent="slate"
      padded
      className="animate-enter"
      style={{ ['--stagger-index' as string]: 2 }}
    >
      <div className="ui-stack ui-stack--md">
        <div className="ui-row">
          <span className="live-dot" />
          <span className="ui-section-title">Active {providerMeta.label} Inbox</span>
        </div>

        <Surface
          as="div"
          variant="recessed"
          padded={false}
          className="active-address-well"
        >
          <span className="mono active-address-text">{address}</span>

          <div className="ui-row">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onCopy(address)}
              title="Copy Email Address"
            >
              <FiCopy size={13} />
              <span>Copy</span>
            </Button>
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
