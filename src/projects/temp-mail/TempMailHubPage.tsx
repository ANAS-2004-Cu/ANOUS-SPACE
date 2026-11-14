import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FiRefreshCw, FiChevronDown, FiChevronUp, FiZap } from 'react-icons/fi';
import { WorkspaceLayout } from '../../shared/ui/WorkspaceLayout';
import { ToolBanner } from '../../shared/ui/ToolBanner';
import { Surface } from '../../shared/ui/Surface';
import { Button } from '../../shared/ui/Button';
import { Input } from '../../shared/ui/Input';
import { Badge } from '../../shared/ui/Badge';
import { useAlert } from '../../shared/context/AlertContext';
import * as Clipboard from '../../shared/utils/clipboard';
import { recordRecentProject } from '../../shared/utils/recentTools';
import { MailProviderId, normalizeProviderId } from './types';
import {
  PROVIDER_ADAPTERS,
  PROVIDER_ORDER,
  PROVIDERS_META,
  TEMPMAIL_PLUS_DOMAINS,
  generateRandomUsername,
  getCapabilityBadges,
} from './providers';
import { ProviderSelector } from './components/ProviderSelector';
import { ActiveAddressCard } from './components/ActiveAddressCard';
import { DomainSelectModal } from './components/DomainSelectModal';

export interface TempMailHubPageProps {
  onOpenCommandPalette: () => void;
}

export const TempMailHubPage: React.FC<TempMailHubPageProps> = ({ onOpenCommandPalette }) => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { showToast } = useAlert();

  const initialProvider = searchParams.get('provider')
    ? normalizeProviderId(searchParams.get('provider'))
    : 'mail.tm';

  const [selectedProvider, setSelectedProvider] = useState<MailProviderId>(initialProvider);
  const [username, setUsername] = useState(() => generateRandomUsername(10));
  const [domainsByProvider, setDomainsByProvider] = useState<
    Partial<Record<MailProviderId, string[]>>
  >({
    'catchmail.io': ['catchmail.io'],
    'maildrop.cc': ['maildrop.cc'],
    'tempmail.plus': [...TEMPMAIL_PLUS_DOMAINS],
  });
  const domainsRef = useRef(domainsByProvider);
  domainsRef.current = domainsByProvider;

  const [selectedDomain, setSelectedDomain] = useState<string>('');
  const [domainModalOpen, setDomainModalOpen] = useState(false);
  const [existingAddresses, setExistingAddresses] = useState<
    Partial<Record<MailProviderId, string | null>>
  >({});
  const [isInitializing, setIsInitializing] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    recordRecentProject('temp-mail');
  }, []);

  const handleSelectProvider = (provider: MailProviderId) => {
    setSelectedProvider(provider);
    setSearchParams({ provider }, { replace: true });
  };

  const loadExistingAccounts = useCallback(async () => {
    const entries = await Promise.all(
      PROVIDER_ORDER.map(async (id) => {
        try {
          const account = await PROVIDER_ADAPTERS[id].getStoredAccount();
          return [id, account?.address || null] as const;
        } catch {
          return [id, null] as const;
        }
      })
    );
    setExistingAddresses(Object.fromEntries(entries));
  }, []);

  useEffect(() => {
    let active = true;

    const initProvider = async () => {
      setIsInitializing(true);
      setDomainModalOpen(false);
      setSelectedDomain('');
      try {
        await loadExistingAccounts();

        const adapter = PROVIDER_ADAPTERS[selectedProvider];
        const caps = adapter.capabilities;

        if (caps.supportsDomainList === 'api' && adapter.getDomains) {
          const cached = domainsRef.current[selectedProvider];
          const domainList = cached && cached.length > 0 ? cached : await adapter.getDomains();
          if (active && domainList.length > 0) {
            setDomainsByProvider((prev) => ({ ...prev, [selectedProvider]: domainList }));
            setSelectedDomain(domainList[0]);
          }
        } else if (caps.supportsDomainList === 'fixed' && caps.fixedDomains?.length) {
          if (active) {
            setSelectedDomain(caps.fixedDomains[0]);
          }
        }

        if (active) {
          setUsername(generateRandomUsername(10));
        }
      } catch {
        if (active) {
          showToast({
            title: 'Provider Load Failed',
            message: 'Failed to load provider domains. You can retry or pick another provider.',
            type: 'error',
          });
        }
      } finally {
        if (active) setIsInitializing(false);
      }
    };

    initProvider();
    return () => {
      active = false;
    };
  }, [selectedProvider, loadExistingAccounts, showToast]);

  const copyToClipboard = async (text: string) => {
    try {
      await Clipboard.setStringAsync(text);
      showToast({
        title: 'Copied',
        message: 'Email address copied to clipboard.',
        type: 'success',
      });
    } catch {
      showToast({
        title: 'Copy Failed',
        message: 'Failed to copy to clipboard.',
        type: 'error',
      });
    }
  };

  const openInboxFor = useCallback(
    (provider: MailProviderId) => {
      navigate(`/temp-mail/inbox?provider=${encodeURIComponent(provider)}`);
    },
    [navigate]
  );

  const handleCreateOrActivate = async () => {
    const meta = PROVIDERS_META[selectedProvider];
    const caps = meta.capabilities;

    if (caps.supportsCustomUsername && !username.trim()) {
      showToast({
        title: 'Username Required',
        message: 'Please enter a username or generate a random alias.',
        type: 'warning',
      });
      return;
    }

    if (caps.supportsDomainList === 'api' && !selectedDomain) {
      showToast({
        title: 'Domain Required',
        message: 'Please select an available domain before creating an address.',
        type: 'warning',
      });
      return;
    }

    setLoading(true);
    try {
      const adapter = PROVIDER_ADAPTERS[selectedProvider];
      const account = await adapter.createAccount(
        caps.supportsCustomUsername ? username : undefined,
        selectedDomain || undefined
      );
      setExistingAddresses((prev) => ({
        ...prev,
        [selectedProvider]: account.address,
      }));

      showToast({
        title: caps.mode === 'stateless' ? 'Inbox Activated' : 'Address Created',
        message: account.address,
        type: 'success',
        durationMs: 4500,
        action: {
          label: 'Open Inbox',
          onClick: () => openInboxFor(selectedProvider),
        },
      });
    } catch (err) {
      const message =
        err instanceof Error && err.message
          ? err.message
          : `Failed to initialize ${meta.label} address. Please try again.`;
      showToast({
        title: 'Setup Failed',
        message,
        type: 'error',
        durationMs: 4500,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClearActiveAccount = async () => {
    const adapter = PROVIDER_ADAPTERS[selectedProvider];
    if (adapter.resetSession) {
      await adapter.resetSession();
    }
    setExistingAddresses((prev) => ({ ...prev, [selectedProvider]: null }));
    showToast({
      title: 'Cleared',
      message: `Cleared saved ${PROVIDERS_META[selectedProvider].label} address.`,
      type: 'info',
    });
  };

  const activeMeta = PROVIDERS_META[selectedProvider];
  const caps = activeMeta.capabilities;
  const activeExistingEmail = existingAddresses[selectedProvider] || null;
  const activeDomains = domainsByProvider[selectedProvider] || [];
  const capabilityBadges = getCapabilityBadges(selectedProvider);

  const showDomainPickerModal =
    caps.supportsDomainList === 'api' ||
    (caps.supportsDomainList === 'fixed' && (caps.fixedDomains?.length || 0) > 1);

  const singleFixedDomain =
    caps.supportsDomainList === 'fixed' && caps.fixedDomains?.length === 1
      ? caps.fixedDomains[0]
      : null;

  const getPreviewEmail = (): string => {
    if (!caps.supportsCustomUsername) {
      return 'Generated automatically on server';
    }
    const clean = username.trim() || 'random';
    if (selectedProvider === 'catchmail.io' && clean.includes('@')) {
      return clean;
    }
    const domain = selectedDomain || singleFixedDomain || '';
    return domain ? `${clean}@${domain}` : clean;
  };

  const primaryActionLabel =
    caps.mode === 'stateless'
      ? `Activate ${activeMeta.label} Inbox`
      : caps.supportsCustomUsername
        ? `Create ${activeMeta.label} Address`
        : `Generate ${activeMeta.label} Address`;

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
          existingAddresses={existingAddresses}
          onSelect={handleSelectProvider}
        />
      </div>

      {activeExistingEmail && (
        <ActiveAddressCard
          address={activeExistingEmail}
          providerMeta={activeMeta}
          onCopy={copyToClipboard}
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

          {!caps.supportsCustomUsername ? (
            <Surface
              as="div"
              variant="recessed"
              padded={false}
              className="provider-auto-notice"
            >
              <FiZap size={16} className="provider-auto-notice__icon" />
              <div className="ui-stack ui-stack--xs">
                <span>
                  {activeMeta.label} allocates a randomized address and temporary domain
                  automatically when creating a session.
                </span>
                {caps.inlineMessageBody && (
                  <span className="ui-meta-label">
                    Message bodies arrive inline during inbox sync and are cached locally for reading.
                  </span>
                )}
              </div>
            </Surface>
          ) : (
            <div className="ui-stack ui-stack--md">
              <div className="ui-field">
                <label htmlFor="tempmail-username" className="ui-field__label">
                  {selectedProvider === 'catchmail.io' ? 'Username or Custom Address' : 'Username / Alias'}
                </label>
                <div className="ui-row">
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
                    onClick={() => setUsername(generateRandomUsername(10))}
                    aria-label="Generate Random Username"
                    title="Generate Random Username"
                  >
                    <FiRefreshCw size={14} />
                  </Button>
                </div>
              </div>

              {showDomainPickerModal && (
                <div className="ui-field">
                  <span className="ui-field__label">Select Domain</span>
                  <button
                    type="button"
                    onClick={() => setDomainModalOpen(!domainModalOpen)}
                    className="ui-input ui-input--mono domain-select-trigger"
                  >
                    <span>{selectedDomain ? `@${selectedDomain}` : 'Loading domains...'}</span>
                    {domainModalOpen ? <FiChevronUp size={15} /> : <FiChevronDown size={15} />}
                  </button>

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
                </div>
              )}

              {singleFixedDomain && (
                <div className="ui-field">
                  <div className="ui-field__header">
                    <span className="ui-field__label">Domain</span>
                    {selectedProvider === 'catchmail.io' && (
                      <span className="ui-field__hint">Or type user@yourdomain.com above</span>
                    )}
                  </div>
                  <Surface
                    as="div"
                    variant="recessed"
                    padded={false}
                    className="mono fixed-domain-well"
                  >
                    @{singleFixedDomain}
                  </Surface>
                </div>
              )}

              <Surface
                as="div"
                variant="recessed"
                padded={false}
                className="address-preview-well"
              >
                <span className="ui-meta-label">Address Preview</span>
                <span className="mono address-preview-value">{getPreviewEmail()}</span>
              </Surface>
            </div>
          )}

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

            {activeExistingEmail && (
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
