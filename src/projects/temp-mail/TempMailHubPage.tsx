import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiRefreshCw, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { AppHeader } from '../../shared/ui/AppHeader';
import { Button } from '../../shared/ui/Button';
import { useAlert } from '../../shared/context/AlertContext';
import { useTheme } from '../../shared/context/ThemeContext';
import * as Clipboard from '../../shared/utils/clipboard';
import { recordRecentProject } from '../../shared/utils/recentTools';
import { MailProviderId } from './types';
import {
  GUERRILLA_DOMAINS,
  PROVIDER_ADAPTERS,
  PROVIDER_ORDER,
  PROVIDERS_META,
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
  const { showAlert } = useAlert();
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const [selectedProvider, setSelectedProvider] = useState<MailProviderId>('mail.tm');
  const [username, setUsername] = useState(() => generateRandomUsername(10));
  const [domainsByProvider, setDomainsByProvider] = useState<
    Partial<Record<MailProviderId, string[]>>
  >({
    guerrillamail: GUERRILLA_DOMAINS,
  });
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
      try {
        await loadExistingAccounts();

        const adapter = PROVIDER_ADAPTERS[selectedProvider];
        if (adapter.getDomains) {
          const cached = domainsByProvider[selectedProvider];
          const domainList = cached && cached.length > 0 ? cached : await adapter.getDomains();
          if (active && domainList.length > 0) {
            setDomainsByProvider((prev) => ({ ...prev, [selectedProvider]: domainList }));
            setSelectedDomain(domainList[0]);
          }
        } else {
          if (active) setSelectedDomain('');
        }

        if (active) {
          setUsername(generateRandomUsername(10));
        }
      } catch {
        if (active) {
          showAlert('Error', 'Failed to load provider options. Please try again.');
        }
      } finally {
        if (active) setIsInitializing(false);
      }
    };

    initProvider();
    return () => {
      active = false;
    };
  }, [selectedProvider, loadExistingAccounts, showAlert]);

  const copyToClipboard = async (text: string) => {
    try {
      await Clipboard.setStringAsync(text);
      showAlert('Copied', 'Email address copied to clipboard.');
    } catch {
      showAlert('Error', 'Failed to copy to clipboard.');
    }
  };

  const handleCreateEmail = async () => {
    const meta = PROVIDERS_META[selectedProvider];
    if (selectedProvider !== 'tempmail.lol' && !username.trim()) {
      showAlert('Validation Error', 'Please enter a username.');
      return;
    }

    if (meta.supportsDomainSelect && !selectedDomain) {
      showAlert('Validation Error', 'Please select a domain.');
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

      showAlert('Account Created', `Email ${account.address} created.`, [
        {
          text: 'Copy Email',
          onPress: () => copyToClipboard(account.address),
        },
        {
          text: 'OK',
          style: 'cancel',
        },
      ]);
    } catch (err) {
      const message =
        err instanceof Error && err.message
          ? err.message
          : `Failed to create ${meta.label} address. Please try again.`;
      showAlert('Creation Failed', message, [
        { text: 'New Username', onPress: () => setUsername(generateRandomUsername(10)) },
        { text: 'OK', style: 'cancel' },
      ]);
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
      case 'guerrillamail':
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

  const canvasBg = isLight ? '#F8F7F4' : '#141311';
  const cardBg = isLight ? '#FFFFFF' : '#1C1A17';
  const cardBorder = isLight ? '#E5E1D8' : '#2E2A25';
  const wellBg = isLight ? '#EFECE6' : '#100F0D';
  const textPrimary = isLight ? '#18191C' : '#F2F3F5';
  const textSecondary = isLight ? '#52555E' : '#A1A6B3';
  const textMuted = isLight ? '#7C808B' : '#6E7482';

  return (
    <div
      className="route-theme-canvas"
      style={{
        backgroundColor: canvasBg,
        backgroundImage: isLight
          ? 'radial-gradient(ellipse 80% 45% at 50% -10%, rgba(166, 139, 96, 0.05), transparent 70%)'
          : 'radial-gradient(ellipse 80% 45% at 50% -10%, rgba(166, 139, 96, 0.045), transparent 70%)',
      }}
    >
      <div className="workspace-shell">
        <AppHeader onOpenCommandPalette={onOpenCommandPalette} subtitle="Temp-Mail Client" />

        <main
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: 18,
            maxWidth: 740,
            width: '100%',
            margin: '0 auto',
            paddingBottom: 40,
          }}
        >
          <ProviderSelector
            selectedProvider={selectedProvider}
            existingAddresses={existingAddresses}
            onSelect={setSelectedProvider}
            isLight={isLight}
          />

          {activeExistingEmail && (
            <ActiveAddressCard
              address={activeExistingEmail}
              providerMeta={activeMeta}
              onCopy={copyToClipboard}
              onOpenInbox={handleOpenInbox}
              isLight={isLight}
            />
          )}

          {/* Create New Email Card */}
          <section
            style={{
              backgroundColor: cardBg,
              border: `1px solid ${cardBorder}`,
              borderRadius: 12,
              padding: 20,
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
              boxShadow: isLight
                ? 'var(--card-top-highlight), 0 8px 22px rgba(24, 25, 28, 0.04)'
                : 'var(--card-top-highlight), 0 14px 30px rgba(0, 0, 0, 0.3)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 style={{ fontSize: 14, fontWeight: 600, color: textPrimary }}>
                Create New {activeMeta.label} Address
              </h2>
              <span className="mono" style={{ fontSize: 11, color: textMuted }}>
                Instant Mailbox
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: 12,
                    color: textSecondary,
                    marginBottom: 6,
                    fontWeight: 500,
                  }}
                >
                  Username / Alias
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="text"
                    className="mono"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder={
                      selectedProvider === 'tempmail.lol'
                        ? 'Optional prefix (or leave random)'
                        : 'Username'
                    }
                    autoCapitalize="none"
                    autoCorrect="off"
                    style={{
                      flex: 1,
                      backgroundColor: wellBg,
                      border: `1px solid ${cardBorder}`,
                      borderRadius: 8,
                      padding: '10px 12px',
                      fontSize: 13,
                      color: textPrimary,
                    }}
                  />
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
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: 12,
                      color: textSecondary,
                      marginBottom: 6,
                      fontWeight: 500,
                    }}
                  >
                    Select Domain
                  </label>
                  <button
                    type="button"
                    onClick={() => setDomainModalOpen(!domainModalOpen)}
                    className="mono"
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 12px',
                      backgroundColor: wellBg,
                      border: `1px solid ${cardBorder}`,
                      borderRadius: 8,
                      fontSize: 13,
                      color: textPrimary,
                    }}
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
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: 12,
                      color: textSecondary,
                      marginBottom: 6,
                      fontWeight: 500,
                    }}
                  >
                    Domain
                  </label>
                  <div
                    className="mono"
                    style={{
                      padding: '10px 12px',
                      backgroundColor: wellBg,
                      border: `1px solid ${cardBorder}`,
                      borderRadius: 8,
                      fontSize: 13,
                      color: textSecondary,
                    }}
                  >
                    @{activeMeta.fixedDomain}
                  </div>
                </div>
              )}

              {/* Preview */}
              <div
                style={{
                  padding: '12px 14px',
                  backgroundColor: wellBg,
                  border: `1px solid ${cardBorder}`,
                  borderRadius: 8,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                }}
              >
                <span style={{ fontSize: 11, color: textMuted, fontWeight: 500 }}>
                  Target Address Preview
                </span>
                <span
                  className="mono"
                  style={{ fontSize: 13, color: activeMeta.accent, wordBreak: 'break-all' }}
                >
                  {getPreviewEmail()}
                </span>
              </div>
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
          </section>

          {/* Provider Guide */}
          <section
            style={{
              backgroundColor: cardBg,
              border: `1px solid ${cardBorder}`,
              borderRadius: 12,
              padding: 20,
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            <h3 style={{ fontSize: 13, fontWeight: 600, color: textPrimary }}>
              Provider Overview
            </h3>
            <p style={{ fontSize: 13, color: textSecondary, lineHeight: 1.6 }}>
              Switch between four independent disposable email services so you always have a
              working inbox for sign-up confirmations, one-time codes, or quick testing.
            </p>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: 10,
                marginTop: 4,
              }}
            >
              {PROVIDER_ORDER.map((providerId) => {
                const meta = PROVIDERS_META[providerId];
                return (
                  <div
                    key={providerId}
                    style={{
                      padding: '10px 12px',
                      borderRadius: 8,
                      backgroundColor: wellBg,
                      border: `1px solid ${cardBorder}`,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 4,
                    }}
                  >
                    <span style={{ fontSize: 12, fontWeight: 600, color: meta.accent }}>
                      {meta.label}
                    </span>
                    <span style={{ fontSize: 12, color: textSecondary, lineHeight: 1.5 }}>
                      {meta.description}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};
