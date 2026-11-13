import React from 'react';
import { FiMail } from 'react-icons/fi';
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
  const textMuted = isLight ? '#7C808B' : '#6E7482';

  const activeMeta = PROVIDERS_META[selectedProvider];

  return (
    <section
      style={{
        backgroundColor: cardBg,
        border: `1px solid ${cardBorder}`,
        borderRadius: 12,
        padding: 24,
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        boxShadow: isLight
          ? 'var(--card-top-highlight), 0 8px 22px rgba(24, 25, 28, 0.04)'
          : 'var(--card-top-highlight), 0 14px 30px rgba(0, 0, 0, 0.3)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <FiMail size={15} color={activeMeta.accent} />
          <h2 style={{ fontSize: 14, fontWeight: 600, color: textPrimary }}>
            Select Disposable Provider
          </h2>
        </div>
        <span
          className="mono"
          style={{
            fontSize: 11,
            color: activeMeta.accent,
            backgroundColor: activeMeta.tint,
            border: `1px solid ${activeMeta.border}`,
            borderRadius: 999,
            padding: '2px 9px',
            fontWeight: 600,
          }}
        >
          {activeMeta.tagline}
        </span>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: 10,
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
              onClick={() => onSelect(providerId)}
              style={{
                padding: '12px 14px',
                borderRadius: 9,
                backgroundColor: isSelected ? meta.tint : wellBg,
                border: `1px solid ${isSelected ? meta.border : cardBorder}`,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                gap: 6,
                textAlign: 'left',
                transition: 'all 0.15s ease',
              }}
            >
              <div
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 6,
                }}
              >
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: isSelected ? meta.accent : textPrimary,
                  }}
                >
                  {meta.label}
                </span>
                {hasAccount && (
                  <span
                    className="live-pulse-dot"
                    title="Active inbox ready"
                    style={{ width: 7, height: 7 }}
                  />
                )}
              </div>
              <span
                className="mono"
                style={{
                  fontSize: 10,
                  color: isSelected ? meta.accent : textMuted,
                  letterSpacing: '0.04em',
                }}
              >
                {meta.tagline}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
};
