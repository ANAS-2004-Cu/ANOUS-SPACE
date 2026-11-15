import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAlert } from '../../shared/context/AlertContext';
import { copyToClipboard as writeClipboard } from '../../shared/utils/clipboard';
import { recordRecentProject } from '../../shared/utils/recentTools';
import { MailProviderId, TempAccount, normalizeProviderId } from './types';
import {
  CATCHMAIL_DOMAINS,
  GUERRILLA_DOMAINS,
  PROVIDER_ADAPTERS,
  PROVIDER_ORDER,
  PROVIDERS_META,
  TEMPMAIL_PLUS_DOMAINS,
  generateRandomUsername,
  getCapabilityBadges,
  resolveGuerrillaDisplayAddress,
} from './providers';
import { writeAccountStorage } from './storage';

export interface ProviderDiagnosticError {
  kind: 'domains' | 'create';
  message: string;
}

export function useTempMailHub() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { showToast } = useAlert();

  const initialProvider = searchParams.get('provider')
    ? normalizeProviderId(searchParams.get('provider'))
    : 'grabmail.io';

  const [selectedProvider, setSelectedProvider] = useState<MailProviderId>(initialProvider);
  const [username, setUsername] = useState(() => generateRandomUsername(10));
  const [preferScrambled, setPreferScrambled] = useState(false);
  const [domainsByProvider, setDomainsByProvider] = useState<
    Partial<Record<MailProviderId, string[]>>
  >({
    'catchmail.io': [...CATCHMAIL_DOMAINS],
    'tempmail.plus': [...TEMPMAIL_PLUS_DOMAINS],
    guerrillamail: [...GUERRILLA_DOMAINS],
  });
  const domainsRef = useRef(domainsByProvider);
  domainsRef.current = domainsByProvider;

  const [selectedDomain, setSelectedDomain] = useState<string>('');
  const [domainModalOpen, setDomainModalOpen] = useState(false);
  const [existingAccounts, setExistingAccounts] = useState<
    Partial<Record<MailProviderId, TempAccount | null>>
  >({});
  const [isInitializing, setIsInitializing] = useState(true);
  const [loading, setLoading] = useState(false);
  const [providerError, setProviderError] = useState<ProviderDiagnosticError | null>(null);

  useEffect(() => {
    recordRecentProject('temp-mail');
  }, []);

  const handleSelectProvider = useCallback(
    (provider: MailProviderId) => {
      setSelectedProvider(provider);
      setProviderError(null);
      setSearchParams({ provider }, { replace: true });
    },
    [setSearchParams]
  );

  const loadExistingAccounts = useCallback(async () => {
    const entries = await Promise.all(
      PROVIDER_ORDER.map(async (id) => {
        try {
          const account = await PROVIDER_ADAPTERS[id].getStoredAccount();
          return [id, account] as const;
        } catch {
          return [id, null] as const;
        }
      })
    );
    setExistingAccounts(Object.fromEntries(entries));
  }, []);

  const loadProvider = useCallback(
    async (forceRefreshDomains = false, isMounted: () => boolean = () => true) => {
      setIsInitializing(true);
      setDomainModalOpen(false);
      setSelectedDomain('');
      setProviderError(null);
      try {
        await loadExistingAccounts();

        const adapter = PROVIDER_ADAPTERS[selectedProvider];
        const caps = adapter.capabilities;

        if (caps.supportsDomainList === 'api' && adapter.getDomains) {
          const cached = forceRefreshDomains ? undefined : domainsRef.current[selectedProvider];
          const domainList = cached && cached.length > 0 ? cached : await adapter.getDomains();
          if (isMounted()) {
            if (domainList.length > 0) {
              setDomainsByProvider((prev) => ({ ...prev, [selectedProvider]: domainList }));
              setSelectedDomain(domainList[0]);
            } else {
              const emptyMsg = `${PROVIDERS_META[selectedProvider].label} returned no active domains.`;
              setProviderError({ kind: 'domains', message: emptyMsg });
            }
          }
        } else if (caps.supportsDomainList === 'fixed' && caps.fixedDomains?.length) {
          if (isMounted()) {
            setDomainsByProvider((prev) => ({
              ...prev,
              [selectedProvider]: [...(caps.fixedDomains || [])],
            }));
            setSelectedDomain(caps.fixedDomains[0]);
          }
        }

        if (isMounted()) {
          setUsername(generateRandomUsername(10));
        }
      } catch (err) {
        if (isMounted()) {
          const message =
            err instanceof Error && err.message
              ? err.message
              : `Failed to load ${PROVIDERS_META[selectedProvider].label} domains.`;
          setProviderError({ kind: 'domains', message });
          showToast({
            title: 'Provider Load Failed',
            message,
            type: 'error',
          });
        }
      } finally {
        if (isMounted()) setIsInitializing(false);
      }
    },
    [selectedProvider, loadExistingAccounts, showToast]
  );

  useEffect(() => {
    let active = true;
    void loadProvider(false, () => active);
    return () => {
      active = false;
    };
  }, [loadProvider]);

  const copyAddress = useCallback(
    async (text: string) => {
      try {
        await writeClipboard(text);
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
    },
    [showToast]
  );

  const openInboxFor = useCallback(
    (provider: MailProviderId) => {
      navigate(`/temp-mail/inbox?provider=${encodeURIComponent(provider)}`);
    },
    [navigate]
  );

  const handleToggleActiveScrambled = useCallback(
    async (next: boolean) => {
      const current = existingAccounts[selectedProvider];
      if (!current || selectedProvider !== 'guerrillamail') return;
      const updated: TempAccount = { ...current, useScrambled: next };
      await writeAccountStorage(updated);
      setExistingAccounts((prev) => ({
        ...prev,
        [selectedProvider]: updated,
      }));
    },
    [existingAccounts, selectedProvider]
  );

  const handleCreateOrActivate = useCallback(async () => {
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
    setProviderError(null);
    try {
      const adapter = PROVIDER_ADAPTERS[selectedProvider];
      let account = await adapter.createAccount(
        caps.supportsCustomUsername ? username : undefined,
        selectedDomain || undefined
      );

      if (selectedProvider === 'guerrillamail' && preferScrambled && account.alias) {
        account = { ...account, useScrambled: true };
        await writeAccountStorage(account);
      }

      setExistingAccounts((prev) => ({
        ...prev,
        [selectedProvider]: account,
      }));

      const displayAddr = resolveGuerrillaDisplayAddress(account);

      showToast({
        title: caps.mode === 'stateless' ? 'Inbox Activated' : 'Address Created',
        message: displayAddr,
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
      setProviderError({ kind: 'create', message });
      showToast({
        title: 'Setup Failed',
        message,
        type: 'error',
        durationMs: 5000,
      });
    } finally {
      setLoading(false);
    }
  }, [selectedProvider, username, selectedDomain, preferScrambled, showToast, openInboxFor]);

  const handleClearActiveAccount = useCallback(async () => {
    const adapter = PROVIDER_ADAPTERS[selectedProvider];
    if (adapter.resetSession) {
      await adapter.resetSession();
    }
    setExistingAccounts((prev) => ({ ...prev, [selectedProvider]: null }));
    showToast({
      title: 'Cleared',
      message: `Cleared saved ${PROVIDERS_META[selectedProvider].label} address.`,
      type: 'info',
    });
  }, [selectedProvider, showToast]);

  const activeMeta = PROVIDERS_META[selectedProvider];
  const caps = activeMeta.capabilities;
  const activeAccount = existingAccounts[selectedProvider] || null;
  const activeDisplayAddress = activeAccount ? resolveGuerrillaDisplayAddress(activeAccount) : null;
  const existingAddressMap: Partial<Record<MailProviderId, string | null>> = Object.fromEntries(
    PROVIDER_ORDER.map((id) => {
      const acc = existingAccounts[id];
      return [id, acc ? resolveGuerrillaDisplayAddress(acc) : null];
    })
  );

  const activeDomains = domainsByProvider[selectedProvider] || [];
  const capabilityBadges = getCapabilityBadges(selectedProvider);

  const showDomainPickerModal =
    caps.supportsDomainList === 'api' ||
    (caps.supportsDomainList === 'fixed' && (caps.fixedDomains?.length || 0) > 1);

  const singleFixedDomain =
    caps.supportsDomainList === 'fixed' && caps.fixedDomains?.length === 1
      ? caps.fixedDomains[0]
      : null;

  const catchmailCustomDomain =
    selectedProvider === 'catchmail.io' && username.includes('@')
      ? username.split('@')[1]?.trim() || 'catchmail.io'
      : null;

  const activeDomainDisplay =
    catchmailCustomDomain ||
    selectedDomain ||
    singleFixedDomain ||
    (caps.supportsDomainList === 'auto' ? 'auto-assigned' : '');

  const previewEmail = (() => {
    if (!caps.supportsCustomUsername) {
      if (caps.supportsDomainList === 'auto') {
        return '<auto-prefix>@<auto-domain>';
      }
      return `<auto-prefix>@${activeDomainDisplay || 'loading...'}`;
    }

    if (selectedProvider === 'guerrillamail' && preferScrambled) {
      return `<scrambled-alias>@${activeDomainDisplay || GUERRILLA_DOMAINS[0]}`;
    }

    const raw = username.trim() || 'random';
    const cleanPrefix =
      selectedProvider === 'catchmail.io' && raw.includes('@')
        ? raw.split('@')[0] || 'random'
        : raw;
    return activeDomainDisplay ? `${cleanPrefix}@${activeDomainDisplay}` : cleanPrefix;
  })();

  const primaryActionLabel =
    caps.mode === 'stateless'
      ? `Activate ${activeMeta.label} Inbox`
      : caps.supportsCustomUsername
        ? `Create ${activeMeta.label} Address`
        : `Generate ${activeMeta.label} Address`;

  const randomizeUsername = useCallback(() => {
    setUsername(generateRandomUsername(10));
  }, []);

  return {
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
  };
}
