import React from 'react';
import { FiRefreshCw, FiChevronDown, FiChevronUp, FiZap, FiAlertTriangle } from 'react-icons/fi';
import { WorkspaceLayout } from '../../shared/ui/WorkspaceLayout';
import { ToolBanner } from '../../shared/ui/ToolBanner';
import { Surface } from '../../shared/ui/Surface';
import { Button } from '../../shared/ui/Button';
import { Input } from '../../shared/ui/Input';
import { Badge } from '../../shared/ui/Badge';
import { PROVIDER_ORDER } from './providers';
import { ProviderSelector } from './components/ProviderSelector';
import { ActiveAddressCard } from './components/ActiveAddressCard';
import { DomainSelectModal } from './components/DomainSelectModal';
import { useTempMailHub } from './useTempMailHub';

export interface TempMailHubPageProps {
  onOpenCommandPalette: () => void;
}

export const TempMailHubPage: React.FC<TempMailHubPageProps> = ({ onOpenCommandPalette }) => {
  const {
    selectedProvider,
    username,
    setUsername,
    randomizeUsername,
    preferScrambled,
    setPreferScrambled,
    selectedDomain,
    setSelectedDomain,
    domainModalOpen,
    setDomainModalOpen,
    isInitializing,
    loading,
    providerError,
    activeMeta,
    caps,
    activeAccount,
    activeDisplayAddress,
    existingAddressMap,
    activeDomains,
    capabilityBadges,
    showDomainPickerModal,
    activeDomainDisplay,
    previewEmail,
    primaryActionLabel,
    handleSelectProvider,
    loadProvider,
    copyAddress,
    openInboxFor,
    handleToggleActiveScrambled,
    handleCreateOrActivate,
    handleClearActiveAccount,
  } = useTempMailHub();

  return (
    <WorkspaceLayout
      onOpenCommandPalette={onOpenCommandPalette}
      subtitle="Temp-Mail"
      accent="slate"
      width="medium"
    >
      <ToolBanner
        toolId="temp-mail"
        accent="slate"
        eyebrow={`Disposable Email · ${PROVIDER_ORDER.length} Providers`}
        title="Temp-Mail Client"
        description="Unified disposable email workspace across REST, Query, and GraphQL providers."
        actions={
          <Badge tone="slate" pill>
            {PROVIDER_ORDER.length} Providers
          </Badge>
        }
      />

      <div className="animate-enter" style={{ ['--stagger-index' as string]: 1 }}>
        <ProviderSelector
          selectedProvider={selectedProvider}
          existingAddresses={existingAddressMap}
          onSelect={handleSelectProvider}
        />
      </div>

      {activeAccount && activeDisplayAddress && (
        <ActiveAddressCard
          address={activeDisplayAddress}
          providerMeta={activeMeta}
          hasScrambledAlias={Boolean(selectedProvider === 'guerrillamail' && activeAccount.alias)}
          scrambledEnabled={Boolean(activeAccount.useScrambled)}
          onToggleScrambled={handleToggleActiveScrambled}
          onCopy={copyAddress}
          onOpenInbox={() => openInboxFor(selectedProvider)}
          onResetSession={handleClearActiveAccount}
        />
      )}

      <Surface
        accent="slate"
        padded
        className="animate-enter"
        style={{ ['--stagger-index' as string]: 3 }}
      >
        <div className="ui-stack ui-stack--lg">
          <div className="ui-stack ui-stack--xs">
            <div className="ui-row--between">
              <h2 className="ui-section-title">
                {caps.mode === 'stateless' ? 'Activate' : 'Create'} {activeMeta.label} Address
              </h2>
              <div className="provider-cap-strip">
                {capabilityBadges.map((badge) => (
                  <Badge key={badge.label} tone={badge.tone} pill>
                    {badge.label}
                  </Badge>
                ))}
              </div>
            </div>
            <p className="ui-section-subtitle">{activeMeta.shortDescription}</p>
          </div>

          <div className="ui-stack ui-stack--md">
            <div className="ui-field">
              <div className="ui-field__header">
                <label htmlFor="tempmail-username" className="ui-field__label">
                  {caps.supportsCustomUsername
                    ? selectedProvider === 'catchmail.io'
                      ? 'Address Alias & Domain'
                      : 'Username & Target Domain'
                    : 'Server-Assigned Prefix & Target Domain'}
                </label>
                {selectedProvider === 'catchmail.io' && (
                  <span className="ui-field__hint">Or type user@custom-domain.com directly</span>
                )}
              </div>

              <div className="address-composer-row">
                <div className="address-composer-prefix">
                  {caps.supportsCustomUsername ? (
                    <>
                      <div className="ui-flex-1">
                        <Input
                          id="tempmail-username"
                          type="text"
                          mono
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          placeholder={
                            selectedProvider === 'catchmail.io'
                              ? 'alias or user@yourdomain.com'
                              : 'Username'
                          }
                          autoCapitalize="none"
                          autoCorrect="off"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={randomizeUsername}
                        aria-label="Generate Random Username"
                        title="Generate Random Username"
                      >
                        <FiRefreshCw size={14} />
                      </Button>
                    </>
                  ) : (
                    <Surface
                      as="div"
                      variant="recessed"
                      padded={false}
                      className="mono address-auto-prefix"
                    >
                      <FiZap size={14} className="provider-auto-notice__icon" />
                      <span>auto-generated prefix</span>
                    </Surface>
                  )}
                </div>

                <span className="address-at-sep" aria-hidden="true">
                  @
                </span>

                {showDomainPickerModal ? (
                  <button
                    type="button"
                    onClick={() => setDomainModalOpen(!domainModalOpen)}
                    className="mono domain-pill-btn"
                    title="Select domain"
                    aria-label={`Selected domain ${activeDomainDisplay || 'loading'}. Click to change.`}
                  >
                    <span>
                      {activeDomainDisplay
                        ? `@${activeDomainDisplay}`
                        : isInitializing
                          ? 'Loading domains...'
                          : 'Domains unavailable'}
                    </span>
                    {domainModalOpen ? <FiChevronUp size={15} /> : <FiChevronDown size={15} />}
                  </button>
                ) : (
                  <Surface
                    as="div"
                    variant="recessed"
                    padded={false}
                    className="mono domain-pill-fixed"
                    title={
                      caps.supportsDomainList === 'auto'
                        ? 'Assigned automatically by server'
                        : 'Provider fixed domain'
                    }
                  >
                    @{activeDomainDisplay || 'catchmail.io'}
                  </Surface>
                )}
              </div>

              {showDomainPickerModal && (
                <DomainSelectModal
                  visible={domainModalOpen}
                  domains={activeDomains}
                  selectedDomain={selectedDomain}
                  onSelect={(domain) => {
                    setSelectedDomain(domain);
                    setDomainModalOpen(false);
                  }}
                  onClose={() => setDomainModalOpen(false)}
                />
              )}
            </div>

            {selectedProvider === 'guerrillamail' && (
              <div className="ui-row--between">
                <label
                  className="scrambled-toggle"
                  data-enabled={preferScrambled}
                  title="Display Guerrilla Mail's scrambled alias instead of the readable username"
                >
                  <input
                    type="checkbox"
                    checked={preferScrambled}
                    onChange={(e) => setPreferScrambled(e.target.checked)}
                  />
                  <span>Scrambled Address</span>
                </label>
                <span className="ui-meta-label">
                  Routes to the same inbox session via your scrambled Guerrilla alias
                </span>
              </div>
            )}

            {!caps.supportsCustomUsername && (
              <Surface
                as="div"
                variant="recessed"
                padded={false}
                className="provider-auto-notice"
              >
                <FiZap size={16} className="provider-auto-notice__icon" />
                <div className="ui-stack ui-stack--xs">
                  <span>
                    {caps.supportsDomainList === 'auto'
                      ? `${activeMeta.label} assigns both a random username and a rotating domain server-side upon creation.`
                      : `${activeMeta.label} assigns a randomized local prefix on the server for your chosen @domain.`}
                  </span>
                  {caps.inlineMessageBody && (
                    <span className="ui-meta-label">
                      Message bodies arrive inline during inbox sync and are cached locally for reading.
                    </span>
                  )}
                </div>
              </Surface>
            )}

            <Surface
              as="div"
              variant="recessed"
              padded={false}
              className="address-preview-well"
            >
              <span className="ui-meta-label">Full Address Preview</span>
              <span className="mono address-preview-value">{previewEmail}</span>
            </Surface>

            {providerError && (
              <div className="provider-diagnostic-banner" role="alert">
                <div className="provider-diagnostic-banner__body">
                  <FiAlertTriangle size={16} strokeWidth={1.6} className="inbox-error-icon" />
                  <span>{providerError.message}</span>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={loading || isInitializing}
                  onClick={() => {
                    if (providerError.kind === 'domains') {
                      void loadProvider(true);
                    } else {
                      void handleCreateOrActivate();
                    }
                  }}
                >
                  <FiRefreshCw size={13} />
                  <span>Retry</span>
                </Button>
              </div>
            )}
          </div>

          <div className="ui-row ui-row--wrap">
            <Button
              type="button"
              variant="primary"
              size="lg"
              className="ui-flex-1"
              loading={loading}
              disabled={loading || isInitializing}
              onClick={handleCreateOrActivate}
            >
              {primaryActionLabel}
            </Button>

            {activeAccount && (
              <Button
                type="button"
                variant="secondary"
                size="lg"
                onClick={() => openInboxFor(selectedProvider)}
              >
                Open Active Inbox
              </Button>
            )}
          </div>
        </div>
      </Surface>
    </WorkspaceLayout>
  );
};
