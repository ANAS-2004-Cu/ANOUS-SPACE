import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiRotateCcw, FiCheck, FiArrowUp, FiArrowDown, FiHome } from 'react-icons/fi';
import { AppHeader } from '../../shared/ui/AppHeader';
import { Button } from '../../shared/ui/Button';
import { recordRecentProject } from '../../shared/utils/recentTools';

export interface GuessGamePageProps {
  onOpenCommandPalette: () => void;
}

interface GuessEntry {
  value: number;
  result: 'high' | 'low' | 'correct';
}

const MAX_TRIES = 10;

export const GuessGamePage: React.FC<GuessGamePageProps> = ({ onOpenCommandPalette }) => {
  const navigate = useNavigate();
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

    const guessResult: GuessEntry = { value, result: 'low' };

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
      if (Math.abs(randomNumber - value) <= 10) {
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
      if (Math.abs(randomNumber - value) <= 10) {
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

  const getMessage = (): { title: string; detail: string; tone: 'neutral' | 'success' | 'danger' | 'accent' } => {
    if (perfect) {
      return {
        title: 'Target Matched',
        detail: `Exact match confirmed. The target number was ${randomNumber}.`,
        tone: 'success',
      };
    }
    if (limit) {
      return {
        title: 'Attempt Limit Reached',
        detail: `All ${MAX_TRIES} attempts used. The target number was ${randomNumber}.`,
        tone: 'danger',
      };
    }
    if (soLower) {
      return {
        title: 'Close — Too High (Within 10)',
        detail: 'Your guess is within 10 units of the target, but still too high. Try a lower value.',
        tone: 'accent',
      };
    }
    if (soHigher) {
      return {
        title: 'Close — Too Low (Within 10)',
        detail: 'Your guess is within 10 units of the target, but still too low. Try a higher value.',
        tone: 'accent',
      };
    }
    if (lower) {
      return {
        title: 'Too High',
        detail: 'Your guess exceeds the target number. Try a lower value.',
        tone: 'neutral',
      };
    }
    if (higher) {
      return {
        title: 'Too Low',
        detail: 'Your guess is below the target number. Try a higher value.',
        tone: 'neutral',
      };
    }
    if (empty) {
      return {
        title: 'Input Required',
        detail: 'Please enter a valid number between 0 and 99 before checking.',
        tone: 'danger',
      };
    }
    if (tooBig) {
      return {
        title: 'Out of Range',
        detail: 'Please enter a number strictly between 0 and 99.',
        tone: 'danger',
      };
    }
    return {
      title: 'Ready for Input',
      detail: 'Enter an integer from 0 to 99 to receive range and proximity feedback.',
      tone: 'neutral',
    };
  };

  const remaining = Math.max(0, MAX_TRIES - tries);
  const progressRatio = remaining / MAX_TRIES;
  const progressBarColor =
    progressRatio > 0.5 ? '#10B981' : progressRatio > 0.25 ? '#F59E0B' : '#EF4444';

  const statusInfo = getMessage();

  return (
    <div className="workspace-shell">
      <AppHeader onOpenCommandPalette={onOpenCommandPalette} subtitle="Number Guess (0–99)" />

      <main
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          maxWidth: 560,
          width: '100%',
          margin: '0 auto',
          paddingBottom: 40,
        }}
      >
        {/* Main Input & Progress Card */}
        <section
          style={{
            backgroundColor: '#161922',
            border: '1px solid #252A37',
            borderRadius: 10,
            padding: 20,
            display: 'flex',
            flexDirection: 'column',
            gap: 18,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <label
              htmlFor="guess-number-input"
              style={{ fontSize: 13, fontWeight: 600, color: '#F3F4F6' }}
            >
              Enter your guess between 0 and 99
            </label>
            <span className="mono" style={{ fontSize: 12, color: '#6B7280' }}>
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
              placeholder="0 – 99"
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
                backgroundColor: '#0E1015',
                border: '1px solid #252A37',
                borderRadius: 8,
                padding: '10px 14px',
                fontSize: 16,
                fontWeight: 600,
                color: '#F3F4F6',
                textAlign: 'center',
              }}
            />

            <Button
              type="button"
              variant="primary"
              size="lg"
              onClick={handleCheckPress}
              disabled={!hit || tries >= MAX_TRIES}
            >
              <FiCheck size={15} />
              <span>CHECK</span>
            </Button>
          </div>

          {/* Remaining Attempts Progress Bar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
              <span style={{ color: '#9CA3AF' }}>Remaining Attempts</span>
              <span className="mono" style={{ color: '#F3F4F6', fontWeight: 600 }}>
                {remaining} / {MAX_TRIES}
              </span>
            </div>
            <div
              style={{
                width: '100%',
                height: 8,
                backgroundColor: '#0E1015',
                border: '1px solid #252A37',
                borderRadius: 6,
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

          {/* Guess History Chips */}
          {guessHistory.length > 0 && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                paddingTop: 10,
                borderTop: '1px solid #252A37',
              }}
            >
              <span style={{ fontSize: 12, color: '#9CA3AF' }}>Previous Guesses</span>
              <div
                style={{
                  display: 'flex',
                  gap: 8,
                  overflowX: 'auto',
                  paddingBottom: 4,
                }}
              >
                {guessHistory.map((item, idx) => {
                  const isCorrect = item.result === 'correct';
                  const isLow = item.result === 'low';
                  return (
                    <div
                      key={idx}
                      className="mono"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        padding: '5px 10px',
                        borderRadius: 6,
                        backgroundColor: isCorrect
                          ? 'rgba(16, 185, 129, 0.14)'
                          : '#0E1015',
                        border: isCorrect
                          ? '1px solid rgba(16, 185, 129, 0.4)'
                          : '1px solid #252A37',
                        color: isCorrect ? '#10B981' : '#F3F4F6',
                        fontSize: 12,
                        fontWeight: 600,
                        flexShrink: 0,
                      }}
                      title={
                        isCorrect
                          ? 'Correct guess'
                          : isLow
                          ? 'Too low (go higher)'
                          : 'Too high (go lower)'
                      }
                    >
                      <span>{item.value}</span>
                      {isCorrect ? (
                        <FiCheck size={12} color="#10B981" />
                      ) : isLow ? (
                        <FiArrowUp size={12} color="#3B82F6" />
                      ) : (
                        <FiArrowDown size={12} color="#EF4444" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>

        {/* Status / Telemetry Panel */}
        <section
          style={{
            backgroundColor: '#161922',
            border:
              statusInfo.tone === 'success'
                ? '1px solid rgba(16, 185, 129, 0.45)'
                : statusInfo.tone === 'danger'
                ? '1px solid rgba(239, 68, 68, 0.45)'
                : statusInfo.tone === 'accent'
                ? '1px solid rgba(59, 130, 246, 0.45)'
                : '1px solid #252A37',
            borderRadius: 10,
            padding: '24px 20px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            gap: 8,
            minHeight: 130,
          }}
        >
          <div
            className="mono"
            style={{
              fontSize: 15,
              fontWeight: 600,
              color:
                statusInfo.tone === 'success'
                  ? '#10B981'
                  : statusInfo.tone === 'danger'
                  ? '#EF4444'
                  : statusInfo.tone === 'accent'
                  ? '#3B82F6'
                  : '#F3F4F6',
            }}
          >
            {statusInfo.title}
          </div>
          <p style={{ fontSize: 13, color: '#9CA3AF', maxWidth: 420, lineHeight: 1.5 }}>
            {statusInfo.detail}
          </p>
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
            <FiHome size={14} />
            <span>HOME</span>
          </Button>
          <Button variant="secondary" onClick={reset}>
            <FiRotateCcw size={14} />
            <span>RESET</span>
          </Button>
        </div>
      </main>
    </div>
  );
};
