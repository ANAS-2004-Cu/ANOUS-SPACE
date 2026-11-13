import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FiRefreshCw, FiCopy, FiChevronDown, FiChevronUp, FiInbox } from 'react-icons/fi';
import { AppHeader } from '../../shared/ui/AppHeader';
import { Button } from '../../shared/ui/Button';
import { useAlert } from '../../shared/context/AlertContext';
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

const PROVIDER_LABELS: Record<TempMailProvider, string> = {
  [TempMailProvider.MailTM]: 'Mail.TM',
  [TempMailProvider.GuerrillaMail]: 'GuerrillaMail',
  [TempMailProvider.TempMailLol]: 'TempMail.lol',
  [TempMailProvider.Maildrop]: 'Maildrop.cc',
};

export interface TempMailHubPageProps {
  onOpenCommandPalette: () => void;
}

export const TempMailHubPage: React.FC<TempMailHubPageProps> = ({ onOpenCommandPalette }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const cachedEmailsParam = searchParams.get('cachedEmails');
  const { showAlert } = useAlert();

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
  const activeProviderLabel = PROVIDER_LABELS[selectedProvider];

  return (
    <div className="workspace-shell">
      <AppHeader onOpenCommandPalette={onOpenCommandPalette} subtitle="Temp-Mail Client" />

      <main
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          maxWidth: 720,
          width: '100%',
          margin: '0 auto',
          paddingBottom: 40,
        }}
      >
        {/* Provider Selector */}
        <section
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 10,
            padding: 18,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>Select Provider</h2>
            <span className="mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              4 Providers Available
            </span>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: 8,
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
              return (
                <button
                  key={provider}
                  type="button"
                  onClick={() => setSelectedProvider(provider)}
                  style={{
                    padding: '10px 12px',
                    borderRadius: 7,
                    fontSize: 13,
                    fontWeight: 500,
                    backgroundColor: isSelected ? '#3B82F6' : 'var(--bg-app)',
                    color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                    border: isSelected ? '1px solid #3B82F6' : '1px solid var(--border-subtle)',
                    textAlign: 'center',
                  }}
                >
                  {PROVIDER_LABELS[provider]}
                </button>
              );
            })}
          </div>
        </section>

        {/* Active Account Banner */}
        {activeExistingEmail && (
          <section
            style={{
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 10,
              padding: 18,
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>
              Active {activeProviderLabel} Account
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                padding: '12px 14px',
                backgroundColor: 'var(--bg-app)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 8,
                flexWrap: 'wrap',
              }}
            >
              <span
                className="mono"
                style={{
                  fontSize: 13,
                  color: 'var(--text-primary)',
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
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 10,
            padding: 18,
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
            Create New {activeProviderLabel} Email
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: 12,
                  color: 'var(--text-secondary)',
                  marginBottom: 6,
                }}
              >
                Username
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
                    backgroundColor: 'var(--bg-app)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 7,
                    padding: '9px 12px',
                    fontSize: 13,
                    color: 'var(--text-primary)',
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
                    color: 'var(--text-secondary)',
                    marginBottom: 6,
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
                    padding: '9px 12px',
                    backgroundColor: 'var(--bg-app)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 7,
                    fontSize: 13,
                    color: 'var(--text-primary)',
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
                    color: 'var(--text-secondary)',
                    marginBottom: 6,
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
                    padding: '9px 12px',
                    backgroundColor: 'var(--bg-app)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 7,
                    fontSize: 13,
                    color: 'var(--text-primary)',
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
                    color: 'var(--text-secondary)',
                    marginBottom: 6,
                  }}
                >
                  Domain
                </label>
                <div
                  className="mono"
                  style={{
                    padding: '9px 12px',
                    backgroundColor: 'var(--bg-app)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 7,
                    fontSize: 13,
                    color: 'var(--text-secondary)',
                  }}
                >
                  @maildrop.cc
                </div>
              </div>
            )}

            {/* Preview */}
            <div
              style={{
                padding: '10px 12px',
                backgroundColor: 'var(--bg-app)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 7,
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
              }}
            >
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Address Preview</span>
              <span
                className="mono"
                style={{ fontSize: 13, color: 'var(--text-primary)', wordBreak: 'break-all' }}
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
            Create Email
          </Button>
        </section>

        {/* How It Works */}
        <section
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 10,
            padding: 18,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>How It Works</h3>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Temporary emails are disposable addresses that protect your primary inbox from spam and
            tracking. Use them for one-time verifications, developer testing, or sign-ups.
          </p>
          <ul
            style={{
              listStyle: 'none',
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
              fontSize: 12,
              color: 'var(--text-secondary)',
              marginTop: 4,
            }}
          >
            <li>
              <strong style={{ color: 'var(--text-primary)' }}>Mail.TM:</strong> Full Hydra REST inbox with
              authenticated attachment downloads.
            </li>
            <li>
              <strong style={{ color: 'var(--text-primary)' }}>GuerrillaMail:</strong> Multi-domain disposable
              sessions.
            </li>
            <li>
              <strong style={{ color: 'var(--text-primary)' }}>TempMail.lol:</strong> Instant token-based inbox
              cached locally in browser storage.
            </li>
            <li>
              <strong style={{ color: 'var(--text-primary)' }}>Maildrop.cc:</strong> Passwordless GraphQL inbox
              with custom usernames.
            </li>
          </ul>
        </section>
      </main>
    </div>
  );
};
