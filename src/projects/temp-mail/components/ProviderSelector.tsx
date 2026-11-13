import React from 'react';
import { MailProviderId } from '../types';
import { PROVIDER_ORDER, PROVIDERS_META } from '../providers';

export interface ProviderSelectorProps {
  selectedProvider: MailProviderId;
  existingAddresses: Partial<Record<MailProviderId, string | null>>;
  onSelect: (provider: MailProviderId) => void;
  isLight: boolean;
}

export const ProviderSelector: React.FC<ProviderSelectorProps> = ({
  selectedProvider,
  existingAddresses,
  onSelect,
  isLight,
}) => {
  const cardBg = isLight ? '#FFFFFF' : '#1C1A17';
  const cardBorder = isLight ? '#E5E1D8' : '#2E2A25';
  const wellBg = isLight ? '#EFECE6' : '#100F0D';
  const textPrimary = isLight ? '#18191C' : '#F2F3F5';
  const textSecondary = isLight ? '#52555E' : '#A1A6B3';

  return (
    <div
      role="tablist"
      aria-label="Disposable email providers"
      style={{
        backgroundColor: cardBg,
        border: `1px solid ${cardBorder}`,
        borderRadius: 12,
        padding: 6,
        display: 'flex',
        flexWrap: 'wrap',
        gap: 6,
        boxShadow: isLight
          ? 'var(--card-top-highlight), 0 8px 22px rgba(24, 25, 28, 0.04)'
          : 'var(--card-top-highlight), 0 14px 30px rgba(0, 0, 0, 0.3)',
      }}
    >
      {PROVIDER_ORDER.map((providerId) => {
        const isSelected = selectedProvider === providerId;
        const meta = PROVIDERS_META[providerId];
        const hasAccount = Boolean(existingAddresses[providerId]);

        return (
          <button
            key={providerId}
            type="button"
            role="tab"
            aria-selected={isSelected}
            onClick={() => onSelect(providerId)}
            style={{
              flex: '1 1 112px',
              padding: '9px 10px',
              borderRadius: 8,
              backgroundColor: isSelected ? meta.tint : wellBg,
              border: `1px solid ${isSelected ? meta.border : 'transparent'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 7,
              transition: 'all 0.15s ease',
            }}
          >
            <span
              style={{
                fontSize: 12.5,
                fontWeight: 600,
                whiteSpace: 'nowrap',
                color: isSelected ? meta.accent : isLight ? textPrimary : textSecondary,
              }}
            >
              {meta.label}
            </span>
            {hasAccount && (
              <span
                className="live-pulse-dot"
                title="Active inbox ready"
                style={{ width: 6, height: 6 }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
};
