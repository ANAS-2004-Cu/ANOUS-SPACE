import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiRotateCcw, FiCheck, FiArrowUp, FiArrowDown, FiHome, FiTarget } from 'react-icons/fi';
import { WorkspaceLayout } from '../../shared/ui/WorkspaceLayout';
import { ToolBanner } from '../../shared/ui/ToolBanner';
import { Surface } from '../../shared/ui/Surface';
import { Button } from '../../shared/ui/Button';
import { Input } from '../../shared/ui/Input';
import { Badge, BadgeTone } from '../../shared/ui/Badge';
import { recordRecentProject } from '../../shared/utils/recentTools';
import { GuessFeedback, MAX_TRIES, RadarZone, useGuessGame } from './useGuessGame';

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
        title: 'Target Matched',
        detail: `Exact match confirmed in ${tries} ${tries === 1 ? 'attempt' : 'attempts'}. The target number was ${target}.`,
      };
    case 'limit':
      return {
        title: 'Attempt Limit Reached',
        detail: `All ${MAX_TRIES} attempts used. The hidden target number was ${target}.`,
      };
    case 'so-lower':
      return {
        title: 'Close — Too High (Within 10)',
        detail: 'Your guess is within 10 units of the target, but still too high. Dial it down slightly.',
      };
    case 'so-higher':
      return {
        title: 'Close — Too Low (Within 10)',
        detail: 'Your guess is within 10 units of the target, but still too low. Push it slightly higher.',
      };
    case 'lower':
      return {
        title: 'Too High',
        detail: 'Your guess exceeds the target number. Aim lower.',
      };
    case 'higher':
      return {
        title: 'Too Low',
        detail: 'Your guess is below the target number. Aim higher.',
      };
    case 'empty':
      return {
        title: 'Input Required',
        detail: 'Please enter a valid number between 0 and 99 before checking.',
      };
    case 'out-of-range':
      return {
        title: 'Out of Range',
        detail: 'Please enter a number strictly between 0 and 99.',
      };
    default:
      return {
        title: 'Awaiting Coordinates',
        detail: 'Enter an integer from 0 to 99. Proximity telemetry narrows down your target.',
      };
  }
}

const ZONE_META: Record<
  RadarZone,
  { tone: BadgeTone; color: string; label: (hasGuess: boolean) => string }
> = {
  cool: {
    tone: 'accent',
    color: 'var(--accent)',
    label: (hasGuess) => (hasGuess ? 'COLD SIGNAL (> 25)' : 'RADAR STANDBY'),
  },
  warm: {
    tone: 'warning',
    color: 'var(--status-warning)',
    label: () => 'WARM PROXIMITY (≤ 25)',
  },
  hot: {
    tone: 'danger',
    color: 'var(--status-danger)',
    label: () => 'HOT — WITHIN 10 UNITS',
  },
  victory: {
    tone: 'success',
    color: 'var(--status-success)',
    label: () => 'TARGET LOCKED',
  },
  limit: {
    tone: 'danger',
    color: 'var(--status-danger)',
    label: () => 'ATTEMPTS EXHAUSTED',
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
    radarZone,
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

  const zone = ZONE_META[radarZone];
  const statusInfo = getFeedbackCopy(feedback, tries, target);
  const progressRatio = remaining / MAX_TRIES;
  const progressBarColor =
    progressRatio > 0.5
      ? 'var(--status-success)'
      : progressRatio > 0.25
      ? 'var(--status-warning)'
      : 'var(--status-danger)';

  const isGameEnded = feedback === 'victory' || feedback === 'limit';
  const proximityStrength =
    feedback === 'victory'
      ? 10
      : lastGuess
      ? Math.max(1, Math.min(10, Math.ceil((100 - Math.min(99, lastGuess.distance)) / 10)))
      : 0;
  const ringBgColor =
    radarZone === 'victory'
      ? 'var(--status-success-subtle)'
      : radarZone === 'hot' || radarZone === 'limit'
      ? 'var(--status-danger-subtle)'
      : radarZone === 'warm'
      ? 'var(--status-warning-subtle)'
      : 'var(--cat-amber-subtle)';

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
        eyebrow="Logic Deduction · Proximity Radar"
        title="Number Guess (0–99)"
        description="Locate the hidden two-digit coordinate within 10 attempts using live thermal proximity telemetry."
      />

      {/* Radar Readout Card */}
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
              <Badge tone={zone.tone}>
                <FiTarget size={12} strokeWidth={1.6} />
                <span>{zone.label(Boolean(lastGuess))}</span>
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
            className="guess-readout-box"
            style={{
              borderColor: zone.color,
              ['--radar-ring-color' as string]: ringBgColor,
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
              {isGameEnded ? 'TARGET' : lastGuess ? 'LAST' : 'HIDDEN'}
            </span>
            <span
              style={{
                fontSize: 34,
                fontWeight: 700,
                color: zone.color,
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

        {/* 10-Segment Signal Strength / Proximity Meter */}
        <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5 }}>
            <span className="mono" style={{ color: 'var(--text-muted)' }}>
              SIGNAL PROXIMITY
            </span>
            <span className="mono" style={{ color: zone.color, fontWeight: 600 }}>
              {lastGuess ? `${proximityStrength * 10}%` : 'STANDBY'}
            </span>
          </div>
          <div className="guess-meter-segments" aria-hidden="true">
            {Array.from({ length: 10 }, (_, idx) => {
              const activePip = idx < proximityStrength;
              return (
                <span
                  key={idx}
                  className={['guess-meter-pip', activePip ? 'guess-meter-pip--active' : '']
                    .filter(Boolean)
                    .join(' ')}
                  style={
                    activePip
                      ? {
                          backgroundColor: zone.color,
                          borderColor: zone.color,
                        }
                      : undefined
                  }
                />
              );
            })}
          </div>
        </div>
      </Surface>

      {/* Input & Telemetry Card */}
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
              Enter coordinates (0 – 99)
            </label>
            <span className="mono" style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Range: 00–99
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
              <span>CHECK</span>
            </Button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
              <span style={{ color: 'var(--text-secondary)' }}>Remaining Attempts</span>
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
                  Telemetry Log
                </span>
                <span className="mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  {guessHistory.length} {guessHistory.length === 1 ? 'entry' : 'entries'}
                </span>
              </div>

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {guessHistory.map((item, idx) => {
                  const isCorrect = item.result === 'correct';
                  const isLow = item.result === 'low';
                  const isHot = !isCorrect && item.distance <= 10;
                  const isWarm = !isCorrect && item.distance > 10 && item.distance <= 25;

                  const tone: BadgeTone = isCorrect
                    ? 'success'
                    : isHot
                    ? 'danger'
                    : isWarm
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
                          ? 'Target locked'
                          : isLow
                          ? `Too low — go higher (${item.distance <= 10 ? 'Hot' : item.distance <= 25 ? 'Warm' : 'Cold'})`
                          : `Too high — go lower (${item.distance <= 10 ? 'Hot' : item.distance <= 25 ? 'Warm' : 'Cold'})`
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
          <span>HOME</span>
        </Button>
        <Button variant="secondary" onClick={handleReset}>
          <FiRotateCcw size={14} strokeWidth={1.6} />
          <span>NEW TARGET</span>
        </Button>
      </div>
    </WorkspaceLayout>
  );
};
