import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FiRefreshCw, FiCopy, FiChevronDown, FiChevronUp, FiInbox, FiMail } from 'react-icons/fi';
import { AppHeader } from '../../shared/ui/AppHeader';
import { Button } from '../../shared/ui/Button';
import { useAlert } from '../../shared/context/AlertContext';
import { useTheme } from '../../shared/context/ThemeContext';
import * as Clipboard from '../../shared/utils/clipboard';
import * as SecureStore from '../../shared/utils/storage';
import { recordRecentProject } from '../../shared/utils/recentTools';
import {
  createAccount,
  login,
  generateRandomString,
  getDomains,
  TempMailProvider,
  GUERRILLA_DOMAINS,
  createTempMailLolInbox,
  getTempMailLolStoredData,
  createMaildropAccount,
  getMaildropStoredData,
} from './tempMailService';
import * as GuerrillaAPI from './tempMailService';
import { DomainSelectModal } from './DomainSelectModal';

const CACHED_EMAILS_SESSION_KEY = 'guerrilla_cached_emails';

const PROVIDER_META: Record<
  TempMailProvider,
  { label: string; tag: string; accent: string; tint: string; border: string }
> = {
  [TempMailProvider.MailTM]: {
    label: 'Mail.TM',
    tag: 'HYDRA REST',
    accent: '#6366F1',
    tint: 'rgba(99, 102, 241, 0.14)',
    border: 'rgba(99, 102, 241, 0.45)',
  },
  [TempMailProvider.GuerrillaMail]: {
    label: 'GuerrillaMail',
    tag: 'MULTI-DOMAIN',
    accent: '#10B981',
    tint: 'rgba(16, 185, 129, 0.14)',
    border: 'rgba(16, 185, 129, 0.45)',
  },
  [TempMailProvider.TempMailLol]: {
    label: 'TempMail.lol',
    tag: 'LOCAL CACHE',
    accent: '#F59E0B',
    tint: 'rgba(245, 158, 11, 0.14)',
    border: 'rgba(245, 158, 11, 0.45)',
  },
  [TempMailProvider.Maildrop]: {
    label: 'Maildrop.cc',
    tag: 'GRAPHQL',
    accent: '#06B6D4',
    tint: 'rgba(6, 182, 212, 0.14)',
    border: 'rgba(6, 182, 212, 0.45)',
  },
};

export interface TempMailHubPageProps {
  onOpenCommandPalette: () => void;
}

export const TempMailHubPage: React.FC<TempMailHubPageProps> = ({ onOpenCommandPalette }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const cachedEmailsParam = searchParams.get('cachedEmails');
  const { showAlert } = useAlert();
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const [guerrillaCachedEmails, setGuerrillaCachedEmails] = useState<any[]>(() => {
    try {
      const fromSession = window.sessionStorage.getItem(CACHED_EMAILS_SESSION_KEY);
      if (fromSession) {
        const parsed = JSON.parse(fromSession);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // Ignore sessionStorage errors
    }
    return [];
  });

  const [username, setUsername] = useState('');
  const [selectedDomain, setSelectedDomain] = useState('');
  const [domains, setDomains] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [domainDropdownVisible, setDomainDropdownVisible] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<TempMailProvider>(
    TempMailProvider.MailTM
  );
  const [existingMailTm, setExistingMailTm] = useState<string | null>(null);
  const [existingGuerrilla, setExistingGuerrilla] = useState<string | null>(null);
  const [existingTempMailLol, setExistingTempMailLol] = useState<string | null>(null);
  const [existingMaildrop, setExistingMaildrop] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [guerrillaDomains, setGuerrillaDomains] = useState<string[]>(GUERRILLA_DOMAINS);
  const [selectedGuerrillaDomain, setSelectedGuerrillaDomain] = useState(GUERRILLA_DOMAINS[0]);
  const [guerrillaDomainDropdownVisible, setGuerrillaDomainDropdownVisible] = useState(false);

  useEffect(() => {
    recordRecentProject('temp-mail');
  }, []);

  useEffect(() => {
    if (cachedEmailsParam) {
      try {
        const parsed = JSON.parse(cachedEmailsParam);
        if (Array.isArray(parsed)) {
          setGuerrillaCachedEmails(parsed);
          window.sessionStorage.setItem(CACHED_EMAILS_SESSION_KEY, JSON.stringify(parsed));
        }
      } catch {
        // Silent error for parsing cached emails
      }
    }
  }, [cachedEmailsParam]);

  useEffect(() => {
    const setup = async () => {
      setIsInitializing(true);
      try {
        await checkExistingAccounts();

        if (selectedProvider === TempMailProvider.MailTM) {
          await loadDomains();
        } else if (selectedProvider === TempMailProvider.GuerrillaMail) {
          let emailData;
          const existingGuerrillaRaw = await SecureStore.getItemAsync('guerrilla_data');

          if (existingGuerrillaRaw) {
            const existing = JSON.parse(existingGuerrillaRaw);
            emailData = {
              email: existing.email_addr,
              sidToken: existing.sid_token,
              emailUser: existing.email_user,
            };
          } else {
            emailData = await GuerrillaAPI.getEmailAddress();
            await SecureStore.setItemAsync(
              'guerrilla_data',
              JSON.stringify({
                email_addr: emailData.email,
                sid_token: emailData.sidToken,
                email_user: emailData.emailUser,
              })
            );
            setExistingGuerrilla(emailData.email);
          }

          const validDomains = await GuerrillaAPI.testGuerrillaDomains(
            GUERRILLA_DOMAINS,
            emailData.sidToken
          );
          const finalDomains = validDomains.length > 0 ? validDomains : GUERRILLA_DOMAINS;

          setGuerrillaDomains(finalDomains);
          setSelectedGuerrillaDomain(finalDomains[0]);
        }

        generateRandomUsername();
      } catch {
        showAlert('Error', 'Failed to initialize provider configuration. Please try again.');
      } finally {
        setIsInitializing(false);
      }
    };

    setup();
  }, [selectedProvider]);

  const checkExistingAccounts = async () => {
    try {
      const mailTmData =
        (await SecureStore.getItemAsync('mailtm_data')) ||
        (await SecureStore.getItemAsync('mailgw_data'));
      if (mailTmData) {
        const data = JSON.parse(mailTmData);
        setExistingMailTm(data.email);
      }

      const guerrillaData = await SecureStore.getItemAsync('guerrilla_data');
      if (guerrillaData) {
        const data = JSON.parse(guerrillaData);
        setExistingGuerrilla(data.email_addr);
      }

      const tempMailLolData = getTempMailLolStoredData();
      if (tempMailLolData?.address) {
        setExistingTempMailLol(tempMailLolData.address);
      }

      const maildropData = getMaildropStoredData();
      if (maildropData?.email) {
        setExistingMaildrop(maildropData.email);
      }
    } catch {
      showAlert('Error', 'Failed to read existing accounts.');
    }
  };

  const loadDomains = async () => {
    try {
      const domainsData = await getDomains();
      const rawMembers = Array.isArray(domainsData)
        ? domainsData
        : domainsData?.['hydra:member'];
      if (Array.isArray(rawMembers) && rawMembers.length > 0) {
        const domainList = rawMembers.map((domain: any) => domain.domain).filter(Boolean);
        if (domainList.length > 0) {
          setDomains(domainList);
          setSelectedDomain(domainList[0] || '');
          return;
        }
      }
      const fallbackDomains = ['dollicons.com', 'mail.tm'];
      setDomains(fallbackDomains);
      setSelectedDomain(fallbackDomains[0]);
    } catch {
      const fallbackDomains = ['dollicons.com', 'mail.tm'];
      setDomains(fallbackDomains);
      setSelectedDomain(fallbackDomains[0]);
    }
  };

  const generateRandomUsername = () => {
    setUsername(generateRandomString(10));
  };

  const copyToClipboard = async (text: string) => {
    try {
      await Clipboard.setStringAsync(text);
      showAlert('Copied', 'Email address copied to clipboard.');
    } catch {
      showAlert('Error', 'Failed to copy to clipboard.');
    }
  };

  const createMailTmEmail = async () => {
    try {
      if (!username || !selectedDomain) {
        showAlert('Validation Error', 'Please enter a username and select a domain.');
        return;
      }

      setLoading(true);
      const email = `${username}@${selectedDomain}`;
      const password = generateRandomString(12);

      await createAccount(email, password);
      const authData = await login(email, password);

      await SecureStore.setItemAsync(
        'mailtm_data',
        JSON.stringify({
          email,
          password,
          token: authData.token,
          id: authData.id,
        })
      );

      setExistingMailTm(email);

      showAlert('Account Created', `Email ${email} created.`, [
        {
          text: 'Copy Email',
          onPress: () => copyToClipboard(email),
        },
        {
          text: 'OK',
          style: 'cancel',
        },
      ]);
    } catch {
      showAlert(
        'Creation Failed',
        'Failed to create email account. The username might be taken or the service is temporarily unavailable.',
        [
          { text: 'Generate Username', onPress: generateRandomUsername },
          { text: 'OK', style: 'cancel' },
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  const createGuerrillaEmail = async () => {
    try {
      if (!username) {
        showAlert('Validation Error', 'Please enter a username.');
        return;
      }

      setLoading(true);

      const emailData = await GuerrillaAPI.getEmailAddress();
      if (!emailData || !emailData.email) {
        throw new Error('Failed to get email address');
      }

      let finalUsername = username;
      let finalDomain = selectedGuerrillaDomain;

      try {
        const userResult = await GuerrillaAPI.setCustomEmailUser(username);
        if (userResult?.email_addr) {
          finalUsername = userResult.email_addr.split('@')[0];
        }
      } catch {
        finalUsername = emailData.emailUser;
      }

      try {
        const domainResult = await GuerrillaAPI.setEmailDomain(selectedGuerrillaDomain);
        if (domainResult?.email_addr) {
          finalDomain = domainResult.email_addr.split('@')[1];
        } else if (domainResult?.simulated) {
          finalDomain = selectedGuerrillaDomain;
        } else {
          finalDomain = emailData.email.split('@')[1];
        }
      } catch {
        finalDomain = emailData.email.split('@')[1];
      }

      const finalEmailAddr = `${finalUsername}@${finalDomain}`;

      await SecureStore.setItemAsync(
        'guerrilla_data',
        JSON.stringify({
          email_addr: finalEmailAddr,
          sid_token: emailData.sidToken,
          email_user: finalUsername,
        })
      );
      setGuerrillaCachedEmails([]);
      try {
        window.sessionStorage.removeItem(CACHED_EMAILS_SESSION_KEY);
      } catch {
        // Ignore sessionStorage error
      }

      setExistingGuerrilla(finalEmailAddr);

      showAlert('Account Created', `Email ${finalEmailAddr} created.`, [
        {
          text: 'Copy Email',
          onPress: () => copyToClipboard(finalEmailAddr),
        },
        {
          text: 'OK',
          style: 'cancel',
        },
      ]);
    } catch {
      showAlert('Creation Failed', 'Failed to create GuerrillaMail account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const createTempMailLolEmail = async () => {
    try {
      setLoading(true);
      const data = await createTempMailLolInbox(username);
      setExistingTempMailLol(data.address);

      showAlert('Account Created', `Email ${data.address} created.`, [
        {
          text: 'Copy Email',
          onPress: () => copyToClipboard(data.address),
        },
        {
          text: 'OK',
          style: 'cancel',
        },
      ]);
    } catch {
      showAlert('Creation Failed', 'Failed to create TempMail.lol inbox. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const createMaildropEmail = async () => {
    if (!username.trim()) {
      showAlert('Validation Error', 'Please enter a username.');
      return;
    }

    setLoading(true);
    try {
      const data = createMaildropAccount(username);
      setExistingMaildrop(data.email);

      showAlert('Account Created', `Email ${data.email} created.`, [
        {
          text: 'Copy Email',
          onPress: () => copyToClipboard(data.email),
        },
        {
          text: 'OK',
          style: 'cancel',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const createNewEmail = async () => {
    switch (selectedProvider) {
      case TempMailProvider.MailTM:
        await createMailTmEmail();
        break;
      case TempMailProvider.GuerrillaMail:
        await createGuerrillaEmail();
        break;
      case TempMailProvider.TempMailLol:
        await createTempMailLolEmail();
        break;
      case TempMailProvider.Maildrop:
        await createMaildropEmail();
        break;
    }
  };

  const getExistingAddressForProvider = (provider: TempMailProvider): string | null => {
    switch (provider) {
      case TempMailProvider.MailTM:
        return existingMailTm;
      case TempMailProvider.GuerrillaMail:
        return existingGuerrilla;
      case TempMailProvider.TempMailLol:
        return existingTempMailLol;
      case TempMailProvider.Maildrop:
        return existingMaildrop;
    }
  };

  const accessExistingInbox = (provider: TempMailProvider) => {
    if (provider === TempMailProvider.GuerrillaMail) {
      try {
        window.sessionStorage.setItem(
          CACHED_EMAILS_SESSION_KEY,
          JSON.stringify(guerrillaCachedEmails ?? [])
        );
      } catch {
        // Ignore sessionStorage errors
      }
      navigate('/temp-mail/guerrilla-inbox');
    } else {
      navigate(`/temp-mail/inbox?provider=${encodeURIComponent(provider)}`);
    }
  };

  const getPreviewEmail = () => {
    switch (selectedProvider) {
      case TempMailProvider.MailTM:
        return `${username}@${selectedDomain}`;
      case TempMailProvider.GuerrillaMail:
        return `${username}@${selectedGuerrillaDomain}`;
      case TempMailProvider.TempMailLol:
        return `${username || 'random'}@(auto-assigned by TempMail.lol)`;
      case TempMailProvider.Maildrop:
        return `${username}@maildrop.cc`;
    }
  };

  const activeExistingEmail = getExistingAddressForProvider(selectedProvider);
  const activeMeta = PROVIDER_META[selectedProvider];

  const canvasBg = isLight ? '#F2F4FB' : '#0F1322';
  const cardBg = isLight ? '#FFFFFF' : '#171D33';
  const cardBorder = isLight ? '#DCE2F2' : '#263052';
  const wellBg = isLight ? '#F7F9FE' : '#0B0E1A';
  const textPrimary = isLight ? '#0F172A' : '#F3F4F6';
  const textSecondary = isLight ? '#475569' : '#94A3B8';
  const textMuted = isLight ? '#64748B' : '#64748B';

  return (
    <div
      className="route-theme-canvas"
      style={{
        backgroundColor: canvasBg,
        backgroundImage: isLight
          ? 'radial-gradient(ellipse 80% 45% at 50% -10%, rgba(99, 102, 241, 0.1), transparent 70%)'
          : 'radial-gradient(ellipse 80% 45% at 50% -10%, rgba(99, 102, 241, 0.16), transparent 70%)',
      }}
    >
      <div className="workspace-shell">
        <AppHeader onOpenCommandPalette={onOpenCommandPalette} subtitle="Temp-Mail Client" />

        <main
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            maxWidth: 740,
            width: '100%',
            margin: '0 auto',
            paddingBottom: 40,
          }}
        >
          {/* Provider Selector */}
          <section
            style={{
              backgroundColor: cardBg,
              border: `1px solid ${cardBorder}`,
              borderRadius: 12,
              padding: 20,
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
              boxShadow: isLight
                ? '0 8px 24px rgba(15, 23, 42, 0.04)'
                : '0 14px 34px rgba(0, 0, 0, 0.32)',
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
                {activeMeta.tag}
              </span>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: 10,
              }}
            >
              {(
                [
                  TempMailProvider.MailTM,
                  TempMailProvider.GuerrillaMail,
                  TempMailProvider.TempMailLol,
                  TempMailProvider.Maildrop,
                ] as TempMailProvider[]
              ).map((provider) => {
                const isSelected = selectedProvider === provider;
                const meta = PROVIDER_META[provider];
                const hasAccount = Boolean(getExistingAddressForProvider(provider));
                return (
                  <button
                    key={provider}
                    type="button"
                    onClick={() => setSelectedProvider(provider)}
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
                      {meta.tag}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Active Account Banner */}
          {activeExistingEmail && (
            <section
              style={{
                backgroundColor: cardBg,
                border: `1px solid ${activeMeta.border}`,
                borderRadius: 12,
                padding: 20,
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
                boxShadow: isLight
                  ? '0 8px 24px rgba(15, 23, 42, 0.04)'
                  : '0 14px 34px rgba(0, 0, 0, 0.32)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 8,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="live-pulse-dot" />
                  <span style={{ fontSize: 13, fontWeight: 600, color: textPrimary }}>
                    Active {activeMeta.label} Inbox
                  </span>
                </div>
                <span
                  className="mono"
                  style={{
                    fontSize: 11,
                    color: '#10B981',
                    backgroundColor: 'rgba(16, 185, 129, 0.12)',
                    border: '1px solid rgba(16, 185, 129, 0.35)',
                    borderRadius: 999,
                    padding: '2px 8px',
                    fontWeight: 600,
                  }}
                >
                  LIVE
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
                  {activeExistingEmail}
                </span>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => copyToClipboard(activeExistingEmail)}
                    title="Copy Email Address"
                  >
                    <FiCopy size={13} />
                    <span>Copy</span>
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => accessExistingInbox(selectedProvider)}
                  >
                    <FiInbox size={13} />
                    <span>Open Inbox</span>
                  </Button>
                </div>
              </div>
            </section>
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
                ? '0 8px 24px rgba(15, 23, 42, 0.04)'
                : '0 14px 34px rgba(0, 0, 0, 0.32)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 style={{ fontSize: 14, fontWeight: 600, color: textPrimary }}>
                Provision New {activeMeta.label} Address
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
                      selectedProvider === TempMailProvider.TempMailLol
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
                    onClick={generateRandomUsername}
                    aria-label="Generate Random Username"
                    title="Generate Random Username"
                  >
                    <FiRefreshCw size={14} />
                  </Button>
                </div>
              </div>

              {selectedProvider === TempMailProvider.MailTM && (
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
                    onClick={() => setDomainDropdownVisible(!domainDropdownVisible)}
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
                    <span>@{selectedDomain}</span>
                    {domainDropdownVisible ? <FiChevronUp size={15} /> : <FiChevronDown size={15} />}
                  </button>

                  <DomainSelectModal
                    visible={domainDropdownVisible}
                    domains={domains}
                    selectedDomain={selectedDomain}
                    onSelect={(domain) => {
                      setSelectedDomain(domain);
                      setDomainDropdownVisible(false);
                    }}
                    onClose={() => setDomainDropdownVisible(false)}
                  />
                </div>
              )}

              {selectedProvider === TempMailProvider.GuerrillaMail && (
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
                    onClick={() =>
                      setGuerrillaDomainDropdownVisible(!guerrillaDomainDropdownVisible)
                    }
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
                    <span>@{selectedGuerrillaDomain}</span>
                    {guerrillaDomainDropdownVisible ? (
                      <FiChevronUp size={15} />
                    ) : (
                      <FiChevronDown size={15} />
                    )}
                  </button>

                  <DomainSelectModal
                    visible={guerrillaDomainDropdownVisible}
                    domains={guerrillaDomains}
                    selectedDomain={selectedGuerrillaDomain}
                    onSelect={(domain) => {
                      setSelectedGuerrillaDomain(domain);
                      setGuerrillaDomainDropdownVisible(false);
                    }}
                    onClose={() => setGuerrillaDomainDropdownVisible(false)}
                  />
                </div>
              )}

              {selectedProvider === TempMailProvider.Maildrop && (
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
                    @maildrop.cc
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
              onClick={createNewEmail}
            >
              Create {activeMeta.label} Address
            </Button>
          </section>

          {/* How It Works */}
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
              Provider Capabilities
            </h3>
            <p style={{ fontSize: 13, color: textSecondary, lineHeight: 1.6 }}>
              Each disposable provider uses a distinct delivery architecture so you always have a
              working inbox for OTP verifications, QA sign-ups, or webhook testing.
            </p>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: 10,
                marginTop: 4,
              }}
            >
              {(
                [
                  {
                    provider: TempMailProvider.MailTM,
                    desc: 'Authenticated Hydra REST mailbox with full attachment downloads.',
                  },
                  {
                    provider: TempMailProvider.GuerrillaMail,
                    desc: 'Multi-domain disposable sessions with custom alias switching.',
                  },
                  {
                    provider: TempMailProvider.TempMailLol,
                    desc: 'Token-based inbox cached persistently in browser storage.',
                  },
                  {
                    provider: TempMailProvider.Maildrop,
                    desc: 'Passwordless GraphQL inbox with instant custom usernames.',
                  },
                ] as const
              ).map(({ provider, desc }) => {
                const meta = PROVIDER_META[provider];
                return (
                  <div
                    key={provider}
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
                      {desc}
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
