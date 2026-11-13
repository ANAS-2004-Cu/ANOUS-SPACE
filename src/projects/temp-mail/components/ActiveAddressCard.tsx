import React from 'react';
import { FiCopy, FiInbox } from 'react-icons/fi';
import { Button } from '../../../shared/ui/Button';
import { ProviderMeta } from '../types';

export interface ActiveAddressCardProps {
  address: string;
  providerMeta: ProviderMeta;
  onCopy: (address: string) => void;
  onOpenInbox: () => void;
  isLight: boolean;
}

export const ActiveAddressCard: React.FC<ActiveAddressCardProps> = ({
  address,
  providerMeta,
  onCopy,
  onOpenInbox,
  isLight,
}) => {
  const cardBg = isLight ? '#FFFFFF' : '#1C1A17';
  const cardBorder = isLight ? '#E5E1D8' : '#2E2A25';
  const wellBg = isLight ? '#EFECE6' : '#100F0D';
  const textPrimary = isLight ? '#18191C' : '#F2F3F5';

  return (
    <section
      style={{
        backgroundColor: cardBg,
        border: `1px solid ${providerMeta.border}`,
        borderRadius: 12,
        padding: 18,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        boxShadow: isLight
          ? 'var(--card-top-highlight), 0 8px 22px rgba(24, 25, 28, 0.04)'
          : 'var(--card-top-highlight), 0 14px 30px rgba(0, 0, 0, 0.3)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span className="live-pulse-dot" />
        <span style={{ fontSize: 13, fontWeight: 600, color: textPrimary }}>
          Active {providerMeta.label} Inbox
        </span>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          padding: '12px 14px',
          backgroundColor: wellBg,
          border: `1px solid ${cardBorder}`,
          borderRadius: 9,
          flexWrap: 'wrap',
        }}
      >
        <span
          className="mono"
          style={{
            fontSize: 13.5,
            fontWeight: 500,
            color: textPrimary,
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
      </div>
    </section>
  );
};
