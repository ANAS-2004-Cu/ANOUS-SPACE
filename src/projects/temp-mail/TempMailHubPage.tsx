import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiRefreshCw, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { WorkspaceLayout } from '../../shared/ui/WorkspaceLayout';
import { ToolBanner } from '../../shared/ui/ToolBanner';
import { Surface } from '../../shared/ui/Surface';
import { Button } from '../../shared/ui/Button';
import { Input } from '../../shared/ui/Input';
import { Badge } from '../../shared/ui/Badge';
import { useAlert } from '../../shared/context/AlertContext';
import * as Clipboard from '../../shared/utils/clipboard';
import { recordRecentProject } from '../../shared/utils/recentTools';
import { MailProviderId } from './types';
import {
  GUERRILLA_DOMAINS,
  PROVIDER_ADAPTERS,
  PROVIDER_ORDER,
  PROVIDERS_META,
  TEMPMAIL_PLUS_DOMAINS,
  generateRandomUsername,
} from './providers';
import { ProviderSelector } from './components/ProviderSelector';
import { ActiveAddressCard } from './components/ActiveAddressCard';
import { DomainSelectModal } from './components/DomainSelectModal';

export interface TempMailHubPageProps {
  onOpenCommandPalette: () => void;
}

export const TempMailHubPage: React.FC<TempMailHubPageProps> = ({ onOpenCommandPalette }) => {
  const navigate = useNavigate();
  const { showToast } = useAlert();

  const [selectedProvider, setSelectedProvider] = useState<MailProviderId>('mail.tm');
  const [username, setUsername] = useState(() => generateRandomUsername(10));
  const [domainsByProvider, setDomainsByProvider] = useState<
    Partial<Record<MailProviderId, string[]>>
  >({
    guerrillamail: GUERRILLA_DOMAINS,
    'tempmail.plus': TEMPMAIL_PLUS_DOMAINS,
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
        if (adapter.getDomains) {
          const cached = domainsRef.current[selectedProvider];
          const domainList = cached && cached.length > 0 ? cached : await adapter.getDomains();
          if (active && domainList.length > 0) {
            setDomainsByProvider((prev) => ({ ...prev, [selectedProvider]: domainList }));
            setSelectedDomain(domainList[0]);
          }
        }

        if (active) {
          setUsername(generateRandomUsername(10));
        }
      } catch {
        if (active) {
          showToast({
            title: 'Provider Load Failed',
            message: 'Failed to load provider options. Please try again.',
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

  const handleCreateEmail = async () => {
    const meta = PROVIDERS_META[selectedProvider];
    if (selectedProvider !== 'tempmail.lol' && !username.trim()) {
      showToast({
        title: 'Username Required',
        message: 'Please enter a username or generate one.',
        type: 'warning',
      });
      return;
    }

    if (meta.supportsDomainSelect && !selectedDomain) {
      showToast({
        title: 'Domain Required',
        message: 'Please select a domain before creating an address.',
        type: 'warning',
      });
      return;
    }

    setLoading(true);
    try {
      const adapter = PROVIDER_ADAPTERS[selectedProvider];
      const account = await adapter.createAccount(username, selectedDomain || undefined);
      setExistingAddresses((prev) => ({
        ...prev,
        [selectedProvider]: account.address,
      }));

      showToast({
        title: 'Address Created',
        message: account.address,
        type: 'success',
        durationMs: 4500,
        action: {
          label: 'Copy Email',
          onClick: () => copyToClipboard(account.address),
        },
      });
    } catch (err) {
      const message =
        err instanceof Error && err.message
          ? err.message
          : `Failed to create ${meta.label} address. Please try again.`;
      showToast({
        title: 'Creation Failed',
        message,
        type: 'error',
        durationMs: 4500,
        action: {
          label: 'New Username',
          onClick: () => setUsername(generateRandomUsername(10)),
        },
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenInbox = () => {
    if (selectedProvider === 'guerrillamail') {
      navigate('/temp-mail/guerrilla-inbox');
    } else {
      navigate(`/temp-mail/inbox?provider=${encodeURIComponent(selectedProvider)}`);
    }
  };

  const getPreviewEmail = (): string => {
    const cleanUser = username.trim() || 'random';
    switch (selectedProvider) {
      case 'mail.tm':
      case 'mail.gw':
      case 'guerrillamail':
      case 'inboxes.com':
      case 'tempmail.plus':
        return selectedDomain ? `${cleanUser}@${selectedDomain}` : cleanUser;
      case 'tempmail.lol':
        return `${username.trim() || 'random'} (domain assigned automatically)`;
      case 'maildrop.cc':
        return `${cleanUser}@maildrop.cc`;
    }
  };

  const activeMeta = PROVIDERS_META[selectedProvider];
  const activeExistingEmail = existingAddresses[selectedProvider] || null;
  const activeDomains = domainsByProvider[selectedProvider] || [];

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
        eyebrow="Disposable Email · 7 Providers"
        title="Temp-Mail Client"
        description="Create temporary email addresses across Mail.TM, Mail.gw, GuerrillaMail, and more."
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
          onSelect={setSelectedProvider}
        />
      </div>

      {activeExistingEmail && (
        <ActiveAddressCard
          address={activeExistingEmail}
          providerMeta={activeMeta}
          onCopy={copyToClipboard}
          onOpenInbox={handleOpenInbox}
        />
      )}

      <Surface
        accent="slate"
        padded
        className="animate-enter"
        style={{ ['--stagger-index' as string]: 3 }}
      >
        <div className="ui-stack ui-stack--lg">
          <h2 className="ui-section-title">Create New {activeMeta.label} Address</h2>

          <div className="ui-stack ui-stack--md">
            <div className="ui-field">
              <label htmlFor="tempmail-username" className="ui-field__label">
                Username / Alias
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
                      selectedProvider === 'tempmail.lol'
                        ? 'Optional prefix (or leave random)'
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

            {activeMeta.supportsDomainSelect && (
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

            {activeMeta.fixedDomain && (
              <div className="ui-field">
                <span className="ui-field__label">Domain</span>
                <Surface
                  as="div"
                  variant="recessed"
                  padded={false}
                  className="mono fixed-domain-well"
                >
                  @{activeMeta.fixedDomain}
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

          <Button
            type="button"
            variant="primary"
            size="lg"
            fullWidth
            loading={loading}
            disabled={loading || isInitializing}
            onClick={handleCreateEmail}
          >
            Create {activeMeta.label} Address
          </Button>
        </div>
      </Surface>
    </WorkspaceLayout>
  );
};
