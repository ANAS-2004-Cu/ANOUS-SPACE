import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  FiRotateCcw,
  FiCpu,
  FiUsers,
  FiBookOpen,
  FiChevronDown,
  FiChevronUp,
} from 'react-icons/fi';
import { WorkspaceLayout } from '../../shared/ui/WorkspaceLayout';
import { ToolBanner } from '../../shared/ui/ToolBanner';
import { Surface } from '../../shared/ui/Surface';
import { SegmentedControl } from '../../shared/ui/SegmentedControl';
import { Button } from '../../shared/ui/Button';
import { Badge } from '../../shared/ui/Badge';
import { recordRecentProject } from '../../shared/utils/recentTools';
import { GameBoard } from './GameBoard';
import { AiDifficulty } from './gameEngine';
import { useClassicTicTacToe } from './useClassicTicTacToe';
import { useThreeMarkerTicTacToe } from './useThreeMarkerTicTacToe';

type GameVariant = 'classic' | '3-marker';

const DIFFICULTY_OPTIONS: { value: AiDifficulty; label: string; hint: string }[] = [
  { value: 'easy', label: 'Easy', hint: 'Casual · Random openings' },
  { value: 'medium', label: 'Medium', hint: 'Balanced · Tactical blocks' },
  { value: 'hard', label: 'Hard', hint: 'Master · Deep lookahead AI' },
];

const CLASSIC_RULES = [
  {
    step: '01',
    title: '3×3 Grid Objective',
    desc: 'Players take turns placing X and O on the 3×3 grid. The first player to align 3 matching symbols horizontally, vertically, or diagonally wins.',
  },
  {
    step: '02',
    title: '1P AI & 2P Pass-and-Play',
    desc: 'Play against the computer in 1 Player mode or locally with a friend in 2 Players mode. Switching between 1P and 2P preserves both boards.',
  },
  {
    step: '03',
    title: 'AI Difficulty Levels',
    desc: 'In 1 Player mode, choose Easy (casual moves), Medium (blocks & immediate wins), or Hard (unbeatable full-depth Minimax).',
  },
];

const THREE_MARKER_RULES = [
  {
    step: '01',
    title: '3-Piece Limit Per Player',
    desc: 'Each player can hold at most 3 active markers on the board at any time (tracked by the X: 3/3 and O: 3/3 counters).',
  },
  {
    step: '02',
    title: '4th Move Removes Oldest (FIFO)',
    desc: 'Once you have 3 pieces on the grid, your oldest piece is highlighted with a dashed border and NEXT OUT tag. Placing your 4th piece immediately removes that oldest piece.',
  },
  {
    step: '03',
    title: 'No Draws — Pure Tactics',
    desc: 'Because the board never fills up, draws are impossible. Plan ahead so removing your oldest marker does not open a winning line for your opponent.',
  },
];

export interface TicTacToePageProps {
  onOpenCommandPalette: () => void;
}

export const TicTacToePage: React.FC<TicTacToePageProps> = ({ onOpenCommandPalette }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialVariant: GameVariant =
    searchParams.get('variant') === '3-marker' ? '3-marker' : 'classic';
  const [activeVariant, setActiveVariant] = useState<GameVariant>(initialVariant);
  const [showRules, setShowRules] = useState(false);

  useEffect(() => {
    recordRecentProject('tic-tac-toe');
  }, []);

  useEffect(() => {
    const paramVariant = searchParams.get('variant');
    if (paramVariant === '3-marker' && activeVariant !== '3-marker') {
      setActiveVariant('3-marker');
    } else if (paramVariant === 'classic' && activeVariant !== 'classic') {
      setActiveVariant('classic');
    }
  }, [searchParams, activeVariant]);

  const handleVariantSwitch = (variant: GameVariant) => {
    setActiveVariant(variant);
    if (variant === '3-marker') {
      setSearchParams({ variant: '3-marker' }, { replace: true });
    } else {
      setSearchParams({}, { replace: true });
    }
  };

  const classic = useClassicTicTacToe();
  const threeMarker = useThreeMarkerTicTacToe(activeVariant);

  const classicStatusModifier = classic.winner
    ? 'ttt-status-banner--win'
    : classic.isClassicDraw
    ? 'ttt-status-banner--draw'
    : classic.currentPlayer === 'X'
    ? 'ttt-status-banner--x'
    : 'ttt-status-banner--o';

  const tmStatusModifier = threeMarker.tmHasWinner
    ? 'ttt-status-banner--win'
    : threeMarker.tmIsXNext
    ? 'ttt-status-banner--x'
    : 'ttt-status-banner--o';

  const activeRules = activeVariant === 'classic' ? CLASSIC_RULES : THREE_MARKER_RULES;
  const activeClassicDiffMeta =
    DIFFICULTY_OPTIONS.find((opt) => opt.value === classic.classicDifficulty) ||
    DIFFICULTY_OPTIONS[1];
  const activeTmDiffMeta =
    DIFFICULTY_OPTIONS.find((opt) => opt.value === threeMarker.tmDifficulty) ||
    DIFFICULTY_OPTIONS[1];

  return (
    <WorkspaceLayout
      onOpenCommandPalette={onOpenCommandPalette}
      subtitle="Tic-Tac-Toe"
      accent="ochre"
      width="narrow"
    >
      <ToolBanner
        toolId="tic-tac-toe"
        accent="ochre"
        eyebrow="Board Game · 1 or 2 Players"
        title="Tic-Tac-Toe"
        description="Play Classic 3×3 or 3-Marker mode, where each player keeps at most 3 pieces on the board."
        actions={
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowRules((prev) => !prev)}
            aria-expanded={showRules}
          >
            <FiBookOpen size={13} />
            <span>{showRules ? 'Hide Rules' : 'How to Play'}</span>
          </Button>
        }
      />

      <div className="animate-enter" style={{ ['--stagger-index' as string]: 1 }}>
        <SegmentedControl<GameVariant>
          equalWidth
          accentActive
          ariaLabel="Tic-Tac-Toe game variant"
          value={activeVariant}
          onChange={handleVariantSwitch}
          options={[
            { value: 'classic', label: 'Classic 3×3' },
            { value: '3-marker', label: '3-Marker Mode' },
          ]}
        />
      </div>

      {/* Collapsible How to Play / Rules Guide */}
      <div
        className="game-rules-card animate-enter"
        data-open={showRules}
        style={{ ['--stagger-index' as string]: 1 }}
      >
        <button
          type="button"
          className="game-rules-toggle"
          onClick={() => setShowRules((prev) => !prev)}
          aria-expanded={showRules}
        >
          <span className="game-rules-toggle__title">
            <span className="game-rules-toggle__icon">
              <FiBookOpen size={14} />
            </span>
            <span>
              How to Play · {activeVariant === 'classic' ? 'Classic 3×3 Rules' : '3-Marker FIFO Rules'}
            </span>
          </span>
          <span className="game-rules-toggle__meta">
            <span>{showRules ? 'Hide' : 'Show guide'}</span>
            {showRules ? <FiChevronUp size={14} /> : <FiChevronDown size={14} />}
          </span>
        </button>

        {showRules && (
          <div className="game-rules-body">
            <div className="game-rules-grid">
              {activeRules.map((rule) => (
                <div key={rule.step} className="game-rule-item">
                  <div className="game-rule-item__header">
                    <span className="game-rule-item__step">{rule.step}</span>
                    <span>{rule.title}</span>
                  </div>
                  <p className="game-rule-item__desc">{rule.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {activeVariant === 'classic' ? (
        <Surface
          key="classic-surface"
          variant="elevated"
          accent="ochre"
          padded
          className="animate-enter"
          style={{ ['--stagger-index' as string]: 2 }}
        >
          <div className="ttt-board-stack">
            <div className="ttt-header-row">
              <div className="ui-row ui-row--md">
                <h2 className="ui-section-title">Classic 3×3</h2>
                <div className="mono ttt-legend">
                  <span className="ttt-legend-x">X</span>
                  <span className="ui-meta-label">vs</span>
                  <span className="ttt-legend-o">O</span>
                </div>
              </div>

              <div className="ui-row ui-row--sm">
                <Button
                  size="sm"
                  variant={classic.typeBoard === 1 ? 'primary' : 'secondary'}
                  onClick={() => classic.switchClassicMode(1)}
                >
                  <FiCpu size={13} />
                  <span>1 Player</span>
                </Button>
                <Button
                  size="sm"
                  variant={classic.typeBoard === 2 ? 'primary' : 'secondary'}
                  onClick={() => classic.switchClassicMode(2)}
                >
                  <FiUsers size={13} />
                  <span>2 Players</span>
                </Button>
              </div>
            </div>

            {classic.typeBoard === 1 && (
              <div className="ttt-difficulty-bar" role="group" aria-label="AI Difficulty">
                <div className="ttt-difficulty-meta">
                  <span className="ttt-difficulty-label">AI Difficulty</span>
                  <span className="ttt-difficulty-hint">{activeClassicDiffMeta.hint}</span>
                </div>
                <div className="ttt-difficulty-group">
                  {DIFFICULTY_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      className="ttt-difficulty-pill"
                      data-active={classic.classicDifficulty === opt.value}
                      onClick={() => classic.handleClassicDifficultyChange(opt.value)}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <Surface
              as="div"
              variant="recessed"
              padded={false}
              className={`mono ttt-status-banner ${classicStatusModifier}`}
            >
              {classic.winner
                ? classic.typeBoard === 1 && classic.winner === 'O'
                  ? `Winner: Computer (${activeClassicDiffMeta.label})`
                  : `Winner: Player ${classic.winner}`
                : classic.isClassicDraw
                ? 'Draw — No moves remaining'
                : classic.typeBoard === 1 && classic.currentPlayer === 'O'
                ? 'Computer thinking...'
                : classic.typeBoard === 1
                ? 'Your turn (X)'
                : `Player ${classic.currentPlayer}'s turn`}
            </Surface>

            <GameBoard
              board={classic.board}
              winningIndices={classic.classicWinningIndices}
              winningLine={classic.classicWinningLine}
              previewPlayer={classic.classicPreviewPlayer}
              onCellClick={classic.handleClassicSquareClick}
            />

            <div className="ttt-footer-row">
              <span className="mono ui-meta-label">
                1P and 2P boards stay saved when switching
              </span>
              <Button variant="secondary" size="sm" onClick={classic.resetClassicGame}>
                <FiRotateCcw size={13} />
                <span>Reset Board</span>
              </Button>
            </div>
          </div>
        </Surface>
      ) : (
        <Surface
          key="3-marker-surface"
          variant="elevated"
          accent="ochre"
          padded
          className="animate-enter"
          style={{ ['--stagger-index' as string]: 2 }}
        >
          <div className="ttt-board-stack">
            <div className="ttt-header-row">
              <div>
                <h2 className="ui-section-title">3-Marker Mode</h2>
                <div className="ui-section-subtitle">
                  Max 3 pieces per player — your 4th move removes your oldest piece.
                </div>
              </div>

              <div className="ui-row ui-row--sm">
                <Button
                  size="sm"
                  variant={threeMarker.tmMode === 'vs-computer' ? 'primary' : 'secondary'}
                  onClick={() => threeMarker.handleTmModeSelect('vs-computer')}
                >
                  <FiCpu size={13} strokeWidth={1.6} />
                  <span>vs Computer</span>
                </Button>
                <Button
                  size="sm"
                  variant={threeMarker.tmMode === '2-player' ? 'primary' : 'secondary'}
                  onClick={() => threeMarker.handleTmModeSelect('2-player')}
                >
                  <FiUsers size={13} strokeWidth={1.6} />
                  <span>2 Players</span>
                </Button>
              </div>
            </div>

            {threeMarker.tmMode === 'vs-computer' && (
              <div className="ttt-difficulty-bar" role="group" aria-label="AI Difficulty">
                <div className="ttt-difficulty-meta">
                  <span className="ttt-difficulty-label">AI Difficulty</span>
                  <span className="ttt-difficulty-hint">{activeTmDiffMeta.hint}</span>
                </div>
                <div className="ttt-difficulty-group">
                  {DIFFICULTY_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      className="ttt-difficulty-pill"
                      data-active={threeMarker.tmDifficulty === opt.value}
                      onClick={() => threeMarker.handleTmDifficultySelect(opt.value)}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <Surface
              as="div"
              variant="recessed"
              padded={false}
              className={`mono ttt-status-banner ${tmStatusModifier}`}
            >
              {threeMarker.tmStatus}
            </Surface>

            <GameBoard
              board={threeMarker.tmBoard}
              winningIndices={threeMarker.tmWinningIndices}
              winningLine={threeMarker.tmWinningLine}
              oldestIndex={threeMarker.tmOldestIndex}
              previewPlayer={threeMarker.tmPreviewPlayer}
              onCellClick={threeMarker.handleTmSquareClick}
            />

            <div className="ttt-footer-row">
              <div className="ui-row">
                <Badge tone="accent">
                  {threeMarker.tmMode === 'vs-computer' ? 'You (X)' : 'Player X'}:{' '}
                  {threeMarker.xPositions.length}/3
                </Badge>
                <Badge tone="ochre">
                  {threeMarker.tmMode === 'vs-computer' ? 'Computer (O)' : 'Player O'}:{' '}
                  {threeMarker.oPositions.length}/3
                </Badge>
              </div>

              <Button variant="secondary" size="sm" onClick={() => threeMarker.resetTmGame()}>
                <FiRotateCcw size={13} strokeWidth={1.6} />
                <span>Reset Board</span>
              </Button>
            </div>
          </div>
        </Surface>
      )}
    </WorkspaceLayout>
  );
};
