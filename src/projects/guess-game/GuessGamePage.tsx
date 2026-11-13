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
  { tone: BadgeTone; color: string; tileClass: string; label: string }
> = {
  idle: {
    tone: 'ochre',
    color: 'var(--tone-ochre)',
    tileClass: 'guess-number-tile--idle',
    label: 'Range 00–99',
  },
  far: {
    tone: 'slate',
    color: 'var(--tone-slate)',
    tileClass: 'guess-number-tile--idle',
    label: 'More than 25 away',
  },
  close: {
    tone: 'ochre',
    color: 'var(--tone-ochre)',
    tileClass: 'guess-number-tile--close',
    label: 'Getting close (within 25)',
  },
  'very-close': {
    tone: 'danger',
    color: 'var(--status-danger)',
    tileClass: 'guess-number-tile--danger',
    label: 'Very close (within 10)',
  },
  won: {
    tone: 'sage',
    color: 'var(--tone-sage)',
    tileClass: 'guess-number-tile--won',
    label: 'Solved',
  },
  lost: {
    tone: 'danger',
    color: 'var(--status-danger)',
    tileClass: 'guess-number-tile--danger',
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
      ? 'var(--tone-sage)'
      : progressRatio > 0.25
      ? 'var(--tone-ochre)'
      : 'var(--status-danger)';

  const isGameEnded = feedback === 'victory' || feedback === 'limit';

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
      accent="ochre"
      width="narrow"
    >
      <ToolBanner
        toolId="guess-game"
        accent="ochre"
        eyebrow="Puzzle · 10 Tries"
        title="Number Guess (0–99)"
        description="Guess the hidden number between 0 and 99 within 10 tries using higher/lower hints and narrowed range tracking."
      />

      {/* Status & Narrowed Range Card */}
      <Surface
        variant="elevated"
        accent="ochre"
        padded
        className="animate-enter"
        style={{ ['--stagger-index' as string]: 1 }}
      >
        <div className="ui-row--between ui-row--lg">
          <div className="ui-stack ui-stack--sm ui-flex-1">
            <div>
              <Badge tone={hint.tone}>
                {directionIcon}
                <span>{hint.label}</span>
              </Badge>
            </div>

            <h2 className="guess-copy-title">{statusInfo.title}</h2>
            <p className="ui-section-subtitle">{statusInfo.detail}</p>
          </div>

          <div className={`guess-number-tile ${hint.tileClass}`}>
            <span className="guess-number-tile__caption">
              {isGameEnded ? 'ANSWER' : lastGuess ? 'LAST' : 'SECRET'}
            </span>
            <span className="guess-number-tile__value">
              {isGameEnded
                ? String(target).padStart(2, '0')
                : lastGuess
                ? String(lastGuess.value).padStart(2, '0')
                : '??'}
            </span>
          </div>
        </div>

        {/* Dynamic 0-99 Possible Range Indicator */}
        <div className="guess-range-section">
          <div className="guess-range-label-row">
            <span className="guess-range-label">Possible Range</span>
            <span className="mono guess-range-value">
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
          <div className="mono guess-range-ticks">
            <span>00</span>
            <span>50</span>
            <span>99</span>
          </div>
        </div>
      </Surface>

      {/* Input & Guess History Card */}
      <Surface
        accent="ochre"
        padded
        className="animate-enter"
        style={{ ['--stagger-index' as string]: 2 }}
      >
        <div className="ui-stack ui-stack--lg">
          <div className="ui-row--between">
            <label htmlFor="guess-number-input" className="ui-field__label">
              Your Guess (0 – 99)
            </label>
            <span className="mono ui-meta-label">
              {remaining} {remaining === 1 ? 'try' : 'tries'} left
            </span>
          </div>

          <div className="ui-row ui-row--md">
            <div className="ui-flex-1">
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
                className="guess-input-field"
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

          <div className="ui-stack ui-stack--xs">
            <div className="guess-range-label-row">
              <span className="ui-section-subtitle">Remaining Tries</span>
              <span className="mono guess-range-value">
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
            <div className="ui-stack ui-stack--sm ui-divider-top">
              <div className="ui-row--between">
                <span className="guess-range-label">Previous Guesses</span>
                <span className="mono ui-meta-label">
                  {guessHistory.length} {guessHistory.length === 1 ? 'guess' : 'guesses'}
                </span>
              </div>

              <div className="ui-row ui-row--wrap">
                {guessHistory.map((item, idx) => {
                  const isCorrect = item.result === 'correct';
                  const isLow = item.result === 'low';
                  const isVeryClose = !isCorrect && item.distance <= 10;
                  const isClose = !isCorrect && item.distance > 10 && item.distance <= 25;

                  const tone: BadgeTone = isCorrect
                    ? 'sage'
                    : isVeryClose
                    ? 'danger'
                    : isClose
                    ? 'ochre'
                    : 'slate';

                  return (
                    <Badge
                      key={`${idx}-${item.value}`}
                      tone={tone}
                      pill
                      className="guess-history-chip"
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
        className="ui-row--between animate-enter"
        style={{ ['--stagger-index' as string]: 3 }}
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
