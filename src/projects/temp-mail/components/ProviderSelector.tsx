import React from 'react';
import { MailProviderId } from '../types';
import { PROVIDER_ORDER, PROVIDERS_META } from '../providers';

export interface ProviderSelectorProps {
  selectedProvider: MailProviderId;
  existingAddresses: Partial<Record<MailProviderId, string | null>>;
  onSelect: (provider: MailProviderId) => void;
}

export const ProviderSelector: React.FC<ProviderSelectorProps> = ({
  selectedProvider,
  existingAddresses,
  onSelect,
}) => {
  return (
    <div
      role="tablist"
      aria-label="Disposable email providers"
      className="provider-tabs"
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
            className={['provider-tab', isSelected ? 'provider-tab--active' : '']
              .filter(Boolean)
              .join(' ')}
          >
            <span>{meta.label}</span>
            {hasAccount && (
              <span
                className="live-dot live-dot--sm"
                title="Active inbox ready"
              />
            )}
          </button>
        );
      })}
    </div>
  );
};
