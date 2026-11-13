import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiRotateCcw, FiCheck, FiArrowUp, FiArrowDown, FiHome, FiTarget } from 'react-icons/fi';
import { AppHeader } from '../../shared/ui/AppHeader';
import { Button } from '../../shared/ui/Button';
import { useTheme } from '../../shared/context/ThemeContext';
import { recordRecentProject } from '../../shared/utils/recentTools';

export interface GuessGamePageProps {
  onOpenCommandPalette: () => void;
}

interface GuessEntry {
  value: number;
  result: 'high' | 'low' | 'correct';
  distance: number;
}

const MAX_TRIES = 10;

export const GuessGamePage: React.FC<GuessGamePageProps> = ({ onOpenCommandPalette }) => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const [value, setValue] = useState(-1);
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const [tries, setTries] = useState(0);
  const [randomNumber, setRandomNumber] = useState(() => Math.floor(Math.random() * 100));
  const [perfect, setPerfect] = useState(false);
  const [higher, setHigher] = useState(false);
  const [lower, setLower] = useState(false);
  const [tooBig, setTooBig] = useState(false);
  const [empty, setEmpty] = useState(false);
  const [limit, setLimit] = useState(false);
  const [hit, setHit] = useState(true);
  const [soHigher, setSoHigher] = useState(false);
  const [soLower, setSoLower] = useState(false);
  const [guessHistory, setGuessHistory] = useState<GuessEntry[]>([]);

  useEffect(() => {
    recordRecentProject('guess-game');
  }, []);

  const reset = () => {
    setRandomNumber(Math.floor(Math.random() * 100));
    setValue(-1);
    setInputValue('');
    setTries(0);
    setPerfect(false);
    setHigher(false);
    setLower(false);
    setTooBig(false);
    setEmpty(false);
    setLimit(false);
    setHit(true);
    setSoHigher(false);
    setSoLower(false);
    setGuessHistory([]);
    inputRef.current?.focus();
  };

  const incrementTries = () => {
    setTries((prev) => prev + 1);
  };

  const check = () => {
    if (value === -1 || Number.isNaN(value)) {
      setEmpty(true);
      setPerfect(false);
      setHigher(false);
      setLower(false);
      setTooBig(false);
      setSoHigher(false);
      setSoLower(false);
      return;
    } else if (value > 99 || value < 0) {
      setTooBig(true);
      setEmpty(false);
      setPerfect(false);
      setHigher(false);
      setLower(false);
      setSoHigher(false);
      setSoLower(false);
      return;
    }

    const distance = Math.abs(randomNumber - value);
    const guessResult: GuessEntry = { value, result: 'low', distance };

    if (randomNumber === value) {
      if (hit) {
        incrementTries();
        setHit(false);
      }
      setTooBig(false);
      setEmpty(false);
      setPerfect(true);
      setHigher(false);
      setLower(false);
      setSoHigher(false);
      setSoLower(false);
      guessResult.result = 'correct';
    } else if (randomNumber > value) {
      incrementTries();
      if (distance <= 10) {
        setSoHigher(true);
        setHigher(false);
      } else {
        setHigher(true);
        setSoHigher(false);
      }
      setSoLower(false);
      setLower(false);
      setPerfect(false);
      setTooBig(false);
      setEmpty(false);
      guessResult.result = 'low';
    } else if (randomNumber < value) {
      incrementTries();
      if (distance <= 10) {
        setSoLower(true);
        setLower(false);
      } else {
        setLower(true);
        setSoLower(false);
      }
      setSoHigher(false);
      setPerfect(false);
      setHigher(false);
      setTooBig(false);
      setEmpty(false);
      guessResult.result = 'high';
    }

    setGuessHistory((prevHistory) => [...prevHistory, guessResult]);
  };

  const limitTries = () => {
    if (tries < MAX_TRIES && hit) {
      check();
    } else {
      setLimit(true);
    }
  };

  const handleCheckPress = () => {
    limitTries();
    if (inputRef.current) {
      inputRef.current.value = '';
    }
    setInputValue('');
    setValue(-1);
  };

  // Determine temperature state based on latest guess proximity
  const lastGuess = guessHistory.length > 0 ? guessHistory[guessHistory.length - 1] : null;
  const lastDistance = lastGuess ? lastGuess.distance : null;

  type RadarZone = 'victory' | 'limit' | 'hot' | 'warm' | 'cool';
  let radarZone: RadarZone = 'cool';
  if (perfect) {
    radarZone = 'victory';
  } else if (limit || (tries >= MAX_TRIES && hit)) {
    radarZone = 'limit';
  } else if (lastDistance !== null && lastDistance <= 10) {
    radarZone = 'hot';
  } else if (lastDistance !== null && lastDistance <= 25) {
    radarZone = 'warm';
  } else {
    radarZone = 'cool';
  }

  const ZONE_THEME: Record<
    RadarZone,
    {
      bgDark: string;
      bgLight: string;
      cardDark: string;
      cardLight: string;
      wellDark: string;
      wellLight: string;
      borderDark: string;
      borderLight: string;
      accent: string;
      badge: string;
      wash: string;
    }
  > = {
    cool: {
      bgDark: '#121418',
      bgLight: '#F5F7FA',
      cardDark: '#181B21',
      cardLight: '#FFFFFF',
      wellDark: '#0F1115',
      wellLight: '#EBEEF4',
      borderDark: '#272B35',
      borderLight: '#DDE2EC',
      accent: isLight ? '#3F6391' : '#5278A8',
      badge: lastGuess ? 'COLD SIGNAL (> 25)' : 'RADAR STANDBY',
      wash: 'rgba(82, 120, 168, 0.045)',
    },
    warm: {
      bgDark: '#161410',
      bgLight: '#F9F7F2',
      cardDark: '#1E1B16',
      cardLight: '#FFFFFF',
      wellDark: '#110F0C',
      wellLight: '#F0ECE2',
      borderDark: '#312C23',
      borderLight: '#E5DEC9',
      accent: isLight ? '#9F7131' : '#BD883E',
      badge: 'WARM PROXIMITY (≤ 25)',
      wash: 'rgba(189, 136, 62, 0.05)',
    },
    hot: {
      bgDark: '#171211',
      bgLight: '#FAF5F4',
      cardDark: '#201917',
      cardLight: '#FFFFFF',
      wellDark: '#120E0D',
      wellLight: '#F2E9E7',
      borderDark: '#362724',
      borderLight: '#E9D6D2',
      accent: isLight ? '#A64F40' : '#BA5E4E',
      badge: 'HOT — WITHIN 10 UNITS',
      wash: 'rgba(186, 94, 78, 0.055)',
    },
    victory: {
      bgDark: '#111613',
      bgLight: '#F4F8F6',
      cardDark: '#181F1B',
      cardLight: '#FFFFFF',
      wellDark: '#0E1210',
      wellLight: '#E8F0EC',
      borderDark: '#25332B',
      borderLight: '#D0E2D9',
      accent: isLight ? '#3D755A' : '#4D8B6E',
      badge: 'TARGET LOCKED',
      wash: 'rgba(77, 139, 110, 0.05)',
    },
    limit: {
      bgDark: '#161213',
      bgLight: '#F9F5F6',
      cardDark: '#1E181A',
      cardLight: '#FFFFFF',
      wellDark: '#110E0F',
      wellLight: '#F1E9EB',
      borderDark: '#34272A',
      borderLight: '#E6D4D8',
      accent: isLight ? '#8E4655' : '#9E5262',
      badge: 'ATTEMPTS EXHAUSTED',
      wash: 'rgba(158, 82, 98, 0.05)',
    },
  };

  const activeZone = ZONE_THEME[radarZone];
  const canvasBg = isLight ? activeZone.bgLight : activeZone.bgDark;
  const cardBg = isLight ? activeZone.cardLight : activeZone.cardDark;
  const cardBorder = isLight ? activeZone.borderLight : activeZone.borderDark;
  const wellBg = isLight ? activeZone.wellLight : activeZone.wellDark;
  const textPrimary = isLight ? '#18191C' : '#F2F3F5';
  const textSecondary = isLight ? '#52555E' : '#A1A6B3';
  const textMuted = isLight ? '#7C808B' : '#6E7482';

  const getMessage = (): { title: string; detail: string } => {
    if (perfect) {
      return {
        title: 'Target Matched',
        detail: `Exact match confirmed in ${tries} ${tries === 1 ? 'attempt' : 'attempts'}. The target number was ${randomNumber}.`,
      };
    }
    if (limit) {
      return {
        title: 'Attempt Limit Reached',
        detail: `All ${MAX_TRIES} attempts used. The hidden target number was ${randomNumber}.`,
      };
    }
    if (soLower) {
      return {
        title: 'Close — Too High (Within 10)',
        detail: 'Your guess is within 10 units of the target, but still too high. Dial it down slightly.',
      };
    }
    if (soHigher) {
      return {
        title: 'Close — Too Low (Within 10)',
        detail: 'Your guess is within 10 units of the target, but still too low. Push it slightly higher.',
      };
    }
    if (lower) {
      return {
        title: 'Too High',
        detail: 'Your guess exceeds the target number. Aim lower.',
      };
    }
    if (higher) {
      return {
        title: 'Too Low',
        detail: 'Your guess is below the target number. Aim higher.',
      };
    }
    if (empty) {
      return {
        title: 'Input Required',
        detail: 'Please enter a valid number between 0 and 99 before checking.',
      };
    }
    if (tooBig) {
      return {
        title: 'Out of Range',
        detail: 'Please enter a number strictly between 0 and 99.',
      };
    }
    return {
      title: 'Awaiting Coordinates',
      detail: 'Enter an integer from 0 to 99. The atmosphere shifts from ocean cool to terracotta hot as you close in.',
    };
  };

  const remaining = Math.max(0, MAX_TRIES - tries);
  const progressRatio = remaining / MAX_TRIES;
  const progressBarColor =
    progressRatio > 0.5 ? '#4D8B6E' : progressRatio > 0.25 ? '#BD883E' : '#BA5E4E';

  const statusInfo = getMessage();

  return (
    <div
      className="route-theme-canvas"
      style={{
        backgroundColor: canvasBg,
        backgroundImage: `radial-gradient(ellipse 75% 45% at 50% 0%, ${activeZone.wash}, transparent 70%)`,
      }}
    >
      <div className="workspace-shell">
        <AppHeader onOpenCommandPalette={onOpenCommandPalette} subtitle="Temperature Radar (0–99)" />

        <main
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: 18,
            maxWidth: 560,
            width: '100%',
            margin: '0 auto',
            paddingBottom: 40,
          }}
        >
          {/* Large Target / Radar Readout Hero Card */}
          <section
            style={{
              backgroundColor: cardBg,
              border: `1px solid ${cardBorder}`,
              borderRadius: 14,
              padding: 24,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 16,
              flexWrap: 'wrap',
              boxShadow: isLight
                ? 'var(--card-top-highlight), 0 8px 22px rgba(24, 25, 28, 0.05)'
                : 'var(--card-top-highlight), 0 14px 32px rgba(0, 0, 0, 0.36)',
              transition: 'background-color 0.4s ease, border-color 0.4s ease',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1, minWidth: 200 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <FiTarget size={14} strokeWidth={1.5} color={activeZone.accent} />
                <span
                  className="mono"
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: activeZone.accent,
                    letterSpacing: '0.06em',
                  }}
                >
                  {activeZone.badge}
                </span>
              </div>
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: textPrimary,
                }}
              >
                {statusInfo.title}
              </div>
              <p style={{ fontSize: 13, color: textSecondary, lineHeight: 1.55 }}>
                {statusInfo.detail}
              </p>
            </div>

            {/* Bold Target Display Box */}
            <div
              className="mono tabular-nums"
              style={{
                width: 96,
                height: 96,
                borderRadius: 14,
                backgroundColor: wellBg,
                border: `2px solid ${activeZone.accent}`,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: 'var(--card-top-highlight)',
                transition: 'border-color 0.4s ease, background-color 0.4s ease',
              }}
            >
              <span
                style={{
                  fontSize: 10,
                  color: textMuted,
                  letterSpacing: '0.08em',
                  marginBottom: 2,
                }}
              >
                {perfect || limit ? 'TARGET' : lastGuess ? 'LAST' : 'HIDDEN'}
              </span>
              <span
                style={{
                  fontSize: 34,
                  fontWeight: 700,
                  color: activeZone.accent,
                  lineHeight: 1.1,
                }}
              >
                {perfect || limit
                  ? String(randomNumber).padStart(2, '0')
                  : lastGuess
                  ? String(lastGuess.value).padStart(2, '0')
                  : '??'}
              </span>
            </div>
          </section>

          {/* Main Input & Progress Card */}
          <section
            style={{
              backgroundColor: cardBg,
              border: `1px solid ${cardBorder}`,
              borderRadius: 14,
              padding: 24,
              display: 'flex',
              flexDirection: 'column',
              gap: 18,
              boxShadow: isLight
                ? 'var(--card-top-highlight), 0 8px 22px rgba(24, 25, 28, 0.05)'
                : 'var(--card-top-highlight), 0 14px 32px rgba(0, 0, 0, 0.36)',
              transition: 'background-color 0.4s ease, border-color 0.4s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <label
                htmlFor="guess-number-input"
                style={{ fontSize: 13, fontWeight: 600, color: textPrimary }}
              >
                Enter coordinates (0 – 99)
              </label>
              <span className="mono" style={{ fontSize: 12, color: textMuted }}>
                Range: 00–99
              </span>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <input
                id="guess-number-input"
                ref={inputRef}
                type="text"
                inputMode="numeric"
                maxLength={2}
                value={inputValue}
                placeholder="00 – 99"
                onChange={(e) => {
                  const numericText = e.target.value.replace(/[^0-9]/g, '');
                  setInputValue(numericText);
                  setValue(numericText === '' ? -1 : Number(numericText));
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleCheckPress();
                  }
                }}
                className="mono"
                style={{
                  flex: 1,
                  backgroundColor: wellBg,
                  border: `1px solid ${cardBorder}`,
                  borderRadius: 10,
                  padding: '12px 14px',
                  fontSize: 18,
                  fontWeight: 700,
                  color: textPrimary,
                  textAlign: 'center',
                  letterSpacing: '0.06em',
                }}
              />

              <Button
                type="button"
                variant="primary"
                size="lg"
                onClick={handleCheckPress}
                disabled={!hit || tries >= MAX_TRIES}
              >
                <FiCheck size={15} strokeWidth={1.5} />
                <span>CHECK</span>
              </Button>
            </div>

            {/* Remaining Attempts Progress Bar */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                <span style={{ color: textSecondary }}>Remaining Radar Sweeps</span>
                <span className="mono" style={{ color: textPrimary, fontWeight: 600 }}>
                  {remaining} / {MAX_TRIES}
                </span>
              </div>
              <div
                style={{
                  width: '100%',
                  height: 8,
                  backgroundColor: wellBg,
                  border: `1px solid ${cardBorder}`,
                  borderRadius: 999,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${Math.max(0, Math.min(100, progressRatio * 100))}%`,
                    height: '100%',
                    backgroundColor: progressBarColor,
                    transition: 'width 0.25s ease, background-color 0.25s ease',
                  }}
                />
              </div>
            </div>

            {/* Color-Coded Directional Guess Pills */}
            {guessHistory.length > 0 && (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                  paddingTop: 12,
                  borderTop: `1px solid ${cardBorder}`,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, color: textSecondary, fontWeight: 500 }}>
                    Telemetry Log
                  </span>
                  <span className="mono" style={{ fontSize: 11, color: textMuted }}>
                    {guessHistory.length} {guessHistory.length === 1 ? 'entry' : 'entries'}
                  </span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    gap: 8,
                    flexWrap: 'wrap',
                  }}
                >
                  {guessHistory.map((item, idx) => {
                    const isCorrect = item.result === 'correct';
                    const isLow = item.result === 'low';
                    const isHot = !isCorrect && item.distance <= 10;
                    const isWarm = !isCorrect && item.distance > 10 && item.distance <= 25;

                    const pillColor = isCorrect
                      ? '#4D8B6E'
                      : isHot
                      ? '#BA5E4E'
                      : isWarm
                      ? '#BD883E'
                      : '#5278A8';
                    const pillBg = isCorrect
                      ? 'rgba(77, 139, 110, 0.14)'
                      : isHot
                      ? 'rgba(186, 94, 78, 0.14)'
                      : isWarm
                      ? 'rgba(189, 136, 62, 0.14)'
                      : 'rgba(82, 120, 168, 0.12)';
                    const pillBorder = isCorrect
                      ? 'rgba(77, 139, 110, 0.4)'
                      : isHot
                      ? 'rgba(186, 94, 78, 0.4)'
                      : isWarm
                      ? 'rgba(189, 136, 62, 0.4)'
                      : 'rgba(82, 120, 168, 0.35)';

                    return (
                      <div
                        key={idx}
                        className="mono"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 5,
                          padding: '6px 11px',
                          borderRadius: 999,
                          backgroundColor: pillBg,
                          border: `1px solid ${pillBorder}`,
                          color: pillColor,
                          fontSize: 12,
                          fontWeight: 600,
                        }}
                        title={
                          isCorrect
                            ? 'Target locked'
                            : isLow
                            ? `Too low — go higher (${item.distance <= 10 ? 'Hot' : item.distance <= 25 ? 'Warm' : 'Cold'})`
                            : `Too high — go lower (${item.distance <= 10 ? 'Hot' : item.distance <= 25 ? 'Warm' : 'Cold'})`
                        }
                      >
                        <span>{String(item.value).padStart(2, '0')}</span>
                        {isCorrect ? (
                          <FiCheck size={12} strokeWidth={1.5} color="#4D8B6E" />
                        ) : isLow ? (
                          <FiArrowUp size={12} strokeWidth={1.5} color={pillColor} />
                        ) : (
                          <FiArrowDown size={12} strokeWidth={1.5} color={pillColor} />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </section>

          {/* Bottom Actions */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 10,
            }}
          >
            <Button variant="secondary" onClick={() => navigate('/')}>
              <FiHome size={14} strokeWidth={1.5} />
              <span>HOME</span>
            </Button>
            <Button variant="secondary" onClick={reset}>
              <FiRotateCcw size={14} strokeWidth={1.5} />
              <span>NEW TARGET</span>
            </Button>
          </div>
        </main>
      </div>
    </div>
  );
};
