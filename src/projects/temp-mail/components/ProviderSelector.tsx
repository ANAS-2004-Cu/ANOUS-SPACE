import React from 'react';
import { MailProviderId } from '../types';
import { PROVIDER_ORDER, PROVIDERS_META } from '../providers';

export interface ProviderSelectorProps {
  selectedProvider: MailProviderId;
  existingAddresses: Partial<Record<MailProviderId, string | null>>;
  onSelect: (provider: MailProviderId) => void;
}

function getShortTag(providerId: MailProviderId): string {
  const cap = PROVIDERS_META[providerId].capabilities;
  if (cap.protocol === 'graphql') return 'GQL';
  if (cap.mode === 'stateless') return 'DIRECT';
  if (cap.mode === 'token') return 'TOKEN';
  return 'SESS';
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
            <span className="provider-tab__label">
              {hasAccount && (
                <span
                  className="live-dot live-dot--sm"
                  title="Active inbox ready"
                />
              )}
              <span className="ui-truncate">{meta.label}</span>
            </span>
            <span className="provider-tab__tag">{getShortTag(providerId)}</span>
          </button>
        );
      })}
    </div>
  );
};
