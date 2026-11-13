import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiRotateCcw, FiCheck, FiArrowUp, FiArrowDown, FiHome, FiHash } from 'react-icons/fi';
import { WorkspaceLayout } from '../../shared/ui/WorkspaceLayout';
import { ToolBanner } from '../../shared/ui/ToolBanner';
import { Surface } from '../../shared/ui/Surface';
import { Button } from '../../shared/ui/Button';
import { Input } from '../../shared/ui/Input';
import { Badge, BadgeTone } from '../../shared/ui/Badge';
import { recordRecentProject } from '../../shared/utils/recentTools';
import { GuessFeedback, HintLevel, MAX_TRIES, useGuessGame } from './useGuessGame';

export interface GuessGamePageProps {
  onOpenCommandPalette: () => void;
}

function getFeedbackCopy(
  feedback: GuessFeedback,
  tries: number,
  target: number
): { title: string; detail: string } {
  switch (feedback) {
    case 'victory':
      return {
        title: 'You Got It!',
        detail: `Matched in ${tries} ${tries === 1 ? 'try' : 'tries'}. The secret number was ${target}.`,
      };
    case 'limit':
      return {
        title: 'Out of Tries',
        detail: `You used all ${MAX_TRIES} tries. The secret number was ${target}.`,
      };
    case 'so-lower':
      return {
        title: 'Very Close — Too High',
        detail: 'You are within 10 of the secret number. Try a slightly lower number.',
      };
    case 'so-higher':
      return {
        title: 'Very Close — Too Low',
        detail: 'You are within 10 of the secret number. Try a slightly higher number.',
      };
    case 'lower':
      return {
        title: 'Too High',
        detail: 'The secret number is lower than your guess.',
      };
    case 'higher':
      return {
        title: 'Too Low',
        detail: 'The secret number is higher than your guess.',
      };
    case 'empty':
      return {
        title: 'Enter a Number',
        detail: 'Type a whole number from 0 to 99 to make a guess.',
      };
    case 'out-of-range':
      return {
        title: 'Out of Range',
        detail: 'Please choose a whole number between 0 and 99.',
      };
    default:
      return {
        title: 'Pick a Number (0–99)',
        detail:
          'You have 10 tries to find the hidden number. Each guess tells you whether to go higher or lower.',
      };
  }
}

const HINT_META: Record<
  HintLevel,
  { tone: BadgeTone; color: string; label: string }
> = {
  idle: {
    tone: 'accent',
    color: 'var(--accent)',
    label: 'Range 00–99',
  },
  far: {
    tone: 'accent',
    color: 'var(--accent)',
    label: 'More than 25 away',
  },
  close: {
    tone: 'warning',
    color: 'var(--status-warning)',
    label: 'Getting close (within 25)',
  },
  'very-close': {
    tone: 'danger',
    color: 'var(--status-danger)',
    label: 'Very close (within 10)',
  },
  won: {
    tone: 'success',
    color: 'var(--status-success)',
    label: 'Solved',
  },
  lost: {
    tone: 'danger',
    color: 'var(--status-danger)',
    label: 'Game Over',
  },
};

export const GuessGamePage: React.FC<GuessGamePageProps> = ({ onOpenCommandPalette }) => {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [inputValue, setInputValue] = useState('');

  const {
    target,
    tries,
    remaining,
    active,
    feedback,
    guessHistory,
    lastGuess,
    minBound,
    maxBound,
    hintLevel,
    submitGuess,
    reset,
  } = useGuessGame();

  useEffect(() => {
    recordRecentProject('guess-game');
  }, []);

  const handleCheckPress = () => {
    submitGuess(inputValue);
    setInputValue('');
    inputRef.current?.focus();
  };

  const handleReset = () => {
    reset();
    setInputValue('');
    inputRef.current?.focus();
  };

  const hint = HINT_META[hintLevel];
  const statusInfo = getFeedbackCopy(feedback, tries, target);
  const progressRatio = remaining / MAX_TRIES;
  const progressBarColor =
    progressRatio > 0.5
      ? 'var(--status-success)'
      : progressRatio > 0.25
      ? 'var(--status-warning)'
      : 'var(--status-danger)';

  const isGameEnded = feedback === 'victory' || feedback === 'limit';
  const tileBg =
    hintLevel === 'won'
      ? 'var(--status-success-subtle)'
      : hintLevel === 'very-close' || hintLevel === 'lost'
      ? 'var(--status-danger-subtle)'
      : hintLevel === 'close'
      ? 'var(--status-warning-subtle)'
      : 'var(--bg-recessed)';

  const directionIcon =
    feedback === 'victory' ? (
      <FiCheck size={12} strokeWidth={1.7} />
    ) : feedback === 'higher' || feedback === 'so-higher' ? (
      <FiArrowUp size={12} strokeWidth={1.7} />
    ) : feedback === 'lower' || feedback === 'so-lower' ? (
      <FiArrowDown size={12} strokeWidth={1.7} />
    ) : (
      <FiHash size={12} strokeWidth={1.7} />
    );

  return (
    <WorkspaceLayout
      onOpenCommandPalette={onOpenCommandPalette}
      subtitle="Number Guess (0–99)"
      accent="amber"
      width="narrow"
    >
      <ToolBanner
        toolId="guess-game"
        accent="amber"
        eyebrow="Puzzle · 10 Tries"
        title="Number Guess (0–99)"
        description="Guess the hidden number between 0 and 99 within 10 tries using higher/lower hints and narrowed range tracking."
      />

      {/* Status & Narrowed Range Card */}
      <Surface
        variant="elevated"
        accent="amber"
        padded
        className="animate-enter"
        style={{ ['--stagger-index' as string]: 1 }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1, minWidth: 200 }}>
            <div>
              <Badge tone={hint.tone}>
                {directionIcon}
                <span>{hint.label}</span>
              </Badge>
            </div>

            <h2 style={{ fontSize: 17, fontWeight: 600, color: 'var(--text-primary)' }}>
              {statusInfo.title}
            </h2>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.55 }}>
              {statusInfo.detail}
            </p>
          </div>

          <div
            className="guess-number-tile"
            style={{
              borderColor: hint.color,
              backgroundColor: tileBg,
            }}
          >
            <span
              style={{
                fontSize: 10,
                color: 'var(--text-muted)',
                letterSpacing: '0.08em',
                marginBottom: 2,
              }}
            >
              {isGameEnded ? 'ANSWER' : lastGuess ? 'LAST' : 'SECRET'}
            </span>
            <span
              style={{
                fontSize: 34,
                fontWeight: 700,
                color: hint.color,
                lineHeight: 1.1,
              }}
            >
              {isGameEnded
                ? String(target).padStart(2, '0')
                : lastGuess
                ? String(lastGuess.value).padStart(2, '0')
                : '??'}
            </span>
          </div>
        </div>

        {/* Dynamic 0-99 Possible Range Indicator */}
        <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 7 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
            <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>
              Possible Range
            </span>
            <span className="mono" style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
              {minBound === maxBound
                ? String(minBound).padStart(2, '0')
                : `${String(minBound).padStart(2, '0')} – ${String(maxBound).padStart(2, '0')}`}
            </span>
          </div>
          <div
            className="guess-range-track"
            role="img"
            aria-label={`Possible numbers from ${minBound} to ${maxBound}`}
          >
            <div
              className="guess-range-window"
              style={{
                left: `${minBound}%`,
                width: `${Math.max(2, maxBound - minBound + 1)}%`,
                backgroundColor: hint.color,
              }}
            />
          </div>
          <div
            className="mono"
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: 10.5,
              color: 'var(--text-muted)',
            }}
          >
            <span>00</span>
            <span>50</span>
            <span>99</span>
          </div>
        </div>
      </Surface>

      {/* Input & Guess History Card */}
      <Surface
        accent="amber"
        padded
        className="animate-enter"
        style={{ ['--stagger-index' as string]: 2 }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <label
              htmlFor="guess-number-input"
              style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}
            >
              Your Guess (0 – 99)
            </label>
            <span className="mono" style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {remaining} {remaining === 1 ? 'try' : 'tries'} left
            </span>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ flex: 1 }}>
              <Input
                id="guess-number-input"
                ref={inputRef}
                type="text"
                inputMode="numeric"
                maxLength={2}
                mono
                value={inputValue}
                placeholder="00 – 99"
                disabled={!active || tries >= MAX_TRIES}
                onChange={(e) => {
                  const numericText = e.target.value.replace(/[^0-9]/g, '');
                  setInputValue(numericText);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleCheckPress();
                  }
                }}
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  textAlign: 'center',
                  letterSpacing: '0.08em',
                  height: 42,
                }}
              />
            </div>

            <Button
              type="button"
              variant="primary"
              size="lg"
              onClick={handleCheckPress}
              disabled={!active || tries >= MAX_TRIES}
            >
              <FiCheck size={15} strokeWidth={1.6} />
              <span>Guess</span>
            </Button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
              <span style={{ color: 'var(--text-secondary)' }}>Remaining Tries</span>
              <span className="mono" style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                {remaining} / {MAX_TRIES}
              </span>
            </div>
            <div className="guess-progress-track">
              <div
                className="guess-progress-fill"
                style={{
                  width: `${Math.max(0, Math.min(100, progressRatio * 100))}%`,
                  backgroundColor: progressBarColor,
                }}
              />
            </div>
          </div>

          {guessHistory.length > 0 && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                paddingTop: 14,
                borderTop: '1px solid var(--border-subtle)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>
                  Previous Guesses
                </span>
                <span className="mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  {guessHistory.length} {guessHistory.length === 1 ? 'guess' : 'guesses'}
                </span>
              </div>

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {guessHistory.map((item, idx) => {
                  const isCorrect = item.result === 'correct';
                  const isLow = item.result === 'low';
                  const isVeryClose = !isCorrect && item.distance <= 10;
                  const isClose = !isCorrect && item.distance > 10 && item.distance <= 25;

                  const tone: BadgeTone = isCorrect
                    ? 'success'
                    : isVeryClose
                    ? 'danger'
                    : isClose
                    ? 'warning'
                    : 'accent';

                  return (
                    <Badge
                      key={`${idx}-${item.value}`}
                      tone={tone}
                      pill
                      className="guess-history-chip"
                      style={{ padding: '4px 10px', fontSize: 12 }}
                      title={
                        isCorrect
                          ? 'Correct guess'
                          : isLow
                          ? 'Too low — go higher'
                          : 'Too high — go lower'
                      }
                    >
                      <span>{String(item.value).padStart(2, '0')}</span>
                      {isCorrect ? (
                        <FiCheck size={12} strokeWidth={1.6} />
                      ) : isLow ? (
                        <FiArrowUp size={12} strokeWidth={1.6} />
                      ) : (
                        <FiArrowDown size={12} strokeWidth={1.6} />
                      )}
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </Surface>

      {/* Bottom Actions */}
      <div
        className="animate-enter"
        style={{
          ['--stagger-index' as string]: 3,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
        }}
      >
        <Button variant="secondary" onClick={() => navigate('/')}>
          <FiHome size={14} strokeWidth={1.6} />
          <span>Back to Hub</span>
        </Button>
        <Button variant="secondary" onClick={handleReset}>
          <FiRotateCcw size={14} strokeWidth={1.6} />
          <span>New Number</span>
        </Button>
      </div>
    </WorkspaceLayout>
  );
};
