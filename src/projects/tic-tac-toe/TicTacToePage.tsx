import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FiRotateCcw, FiCpu, FiUsers } from 'react-icons/fi';
import { WorkspaceLayout } from '../../shared/ui/WorkspaceLayout';
import { ToolBanner } from '../../shared/ui/ToolBanner';
import { Surface } from '../../shared/ui/Surface';
import { SegmentedControl } from '../../shared/ui/SegmentedControl';
import { Button } from '../../shared/ui/Button';
import { Badge } from '../../shared/ui/Badge';
import { recordRecentProject } from '../../shared/utils/recentTools';
import { GameBoard } from './GameBoard';
import { useClassicTicTacToe } from './useClassicTicTacToe';
import { useThreeMarkerTicTacToe } from './useThreeMarkerTicTacToe';

type GameVariant = 'classic' | '3-marker';

export interface TicTacToePageProps {
  onOpenCommandPalette: () => void;
}

export const TicTacToePage: React.FC<TicTacToePageProps> = ({ onOpenCommandPalette }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialVariant: GameVariant =
    searchParams.get('variant') === '3-marker' ? '3-marker' : 'classic';
  const [activeVariant, setActiveVariant] = useState<GameVariant>(initialVariant);

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

            <Surface
              as="div"
              variant="recessed"
              padded={false}
              className={`mono ttt-status-banner ${classicStatusModifier}`}
            >
              {classic.winner
                ? `Winner: Player ${classic.winner}`
                : classic.isClassicDraw
                ? 'Draw — No moves remaining'
                : classic.typeBoard === 1 && classic.currentPlayer === 'O'
                ? 'Computer thinking...'
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
