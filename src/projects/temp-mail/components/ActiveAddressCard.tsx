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
      accent="violet"
      padded
      className="animate-enter"
      style={{ ['--stagger-index' as string]: 2 }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="live-dot" />
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
            Active {providerMeta.label} Inbox
          </span>
        </div>

        <Surface
          as="div"
          variant="recessed"
          padded={false}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            padding: '12px 14px',
            flexWrap: 'wrap',
          }}
        >
          <span
            className="mono"
            style={{
              fontSize: 13.5,
              fontWeight: 500,
              color: 'var(--text-primary)',
              wordBreak: 'break-all',
              flex: 1,
              minWidth: 180,
            }}
          >
            {address}
          </span>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
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
