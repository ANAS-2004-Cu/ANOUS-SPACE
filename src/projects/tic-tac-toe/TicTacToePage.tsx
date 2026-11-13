import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FiRotateCcw, FiCpu, FiUsers } from 'react-icons/fi';
import { WorkspaceLayout } from '../../shared/ui/WorkspaceLayout';
import { ToolBanner } from '../../shared/ui/ToolBanner';
import { Surface } from '../../shared/ui/Surface';
import { SegmentedControl } from '../../shared/ui/SegmentedControl';
import { Button } from '../../shared/ui/Button';
import { Badge } from '../../shared/ui/Badge';
import { useAlert } from '../../shared/context/AlertContext';
import { recordRecentProject } from '../../shared/utils/recentTools';
import {
  CellValue,
  calculateWinner,
  findBestClassicMove,
  findBestThreeMarkerMove,
  getWinningIndices,
} from './gameEngine';
import { GameBoard } from './GameBoard';

type GameVariant = 'classic' | '3-marker';

export interface TicTacToePageProps {
  onOpenCommandPalette: () => void;
}

export const TicTacToePage: React.FC<TicTacToePageProps> = ({ onOpenCommandPalette }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialVariant: GameVariant =
    searchParams.get('variant') === '3-marker' ? '3-marker' : 'classic';
  const [activeVariant, setActiveVariant] = useState<GameVariant>(initialVariant);
  const { showAlert } = useAlert();

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

  // ============================================================================
  // Classic 3x3 State (Preserving independent 1-Player and 2-Player snapshots)
  // ============================================================================
  const [board1, setBoard1] = useState<CellValue[]>(Array(9).fill(null));
  const [board2, setBoard2] = useState<CellValue[]>(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState(true);
  const [winner1, setWinner1] = useState<string | null>(null);
  const [winner2, setWinner2] = useState<string | null>(null);
  const [winner, setWinner] = useState<string | null>(null);
  const [typeBoard, setTypeBoard] = useState<1 | 2>(2);
  const [board, setBoard] = useState<CellValue[]>(Array(9).fill(null));
  const [isXNext1, setIsXNext1] = useState(true);
  const [count, setCount] = useState(0);
  const [count1, setCount1] = useState(0);
  const [count2, setCount2] = useState(0);
  const [currentPlayer, setCurrentPlayer] = useState('X');

  const switchClassicMode = (type: 1 | 2) => {
    if (typeBoard === type) return;

    if (type === 1) {
      setBoard2(board.slice());
      setBoard(board1.slice());
      setWinner2(winner);
      setWinner(winner1);
      setIsXNext1(isXNext);
      setIsXNext(true);
      setCount2(count);
      setCount(count1);
      setCurrentPlayer('X');
    } else {
      setBoard1(board.slice());
      setBoard(board2.slice());
      setWinner1(winner);
      setWinner(winner2);
      setIsXNext(isXNext1);
      setCount1(count);
      setCount(count2);
      setCurrentPlayer(isXNext1 ? 'X' : 'O');
    }

    setTypeBoard(type);
  };

  const runClassicComputerMove = (boardAfterPlayer: CellValue[]) => {
    const newBoard = boardAfterPlayer.slice();
    const availableMoves = newBoard
      .map((val, idx) => (val === null ? idx : null))
      .filter((val): val is number => val !== null);
    if (availableMoves.length > 0) {
      const move = findBestClassicMove(newBoard);
      newBoard[move] = 'O';
      setIsXNext(true);
      setCurrentPlayer('X');
      setWinner(calculateWinner(newBoard));
      setBoard(newBoard);
    }
  };

  const handleClassicSquareClick = (index: number) => {
    if (typeBoard === 1 && count === 5 && winner === null) {
      showAlert('Round Complete', 'The board is full. Reset the board to start a new round.');
      return;
    }

    if (typeBoard === 2 && count === 9 && winner === null) {
      showAlert('Round Complete', 'The board is full. Reset the board to start a new round.');
      return;
    }

    if (board[index] || winner) {
      if (winner) {
        showAlert('Round Complete', `Player ${winner} has already won this round.`);
      }
      return;
    }

    if (count < 9) {
      setCount(count + 1);
    }

    const nextBoard = board.slice();
    nextBoard[index] = isXNext ? 'X' : 'O';
    const immediateWinner = calculateWinner(nextBoard);

    setBoard(nextBoard);
    setWinner(immediateWinner);

    if (typeBoard === 1) {
      if (!immediateWinner) {
        runClassicComputerMove(nextBoard);
      }
    } else {
      setCurrentPlayer(isXNext ? 'O' : 'X');
      setIsXNext(!isXNext);
    }
  };

  const resetClassicGame = () => {
    setBoard(Array(9).fill(null));
    setWinner(null);
    setIsXNext(typeBoard === 1 ? true : isXNext);
    setCurrentPlayer('X');
    setCount(0);
  };

  const isClassicDraw =
    (typeBoard === 2 && count === 9 && winner === null) ||
    (typeBoard === 1 && count === 5 && winner === null);

  const classicWinningIndices = useMemo(
    () => (winner ? getWinningIndices(board) : new Set<number>()),
    [winner, board]
  );

  // ============================================================================
  // 3-Marker Variant State (FIFO 3-marker queue mechanic + 700ms AI delay)
  // ============================================================================
  const [tmBoard, setTmBoard] = useState<CellValue[]>(Array(9).fill(null));
  const [tmIsXNext, setTmIsXNext] = useState(true);
  const [tmStatus, setTmStatus] = useState("Player X's turn");
  const [xPositions, setXPositions] = useState<number[]>([]);
  const [oPositions, setOPositions] = useState<number[]>([]);
  const [tmMode, setTmMode] = useState<'2-player' | 'vs-computer'>('vs-computer');

  const executeTmMove = useCallback(
    (index: number, player: 'X' | 'O', currentPositions: number[]) => {
      const newBoard = [...tmBoard];
      const updatedPositions = [...currentPositions];

      if (updatedPositions.length === 3) {
        const oldestPosition = updatedPositions.shift();
        if (oldestPosition !== undefined) {
          newBoard[oldestPosition] = null;
        }
      }

      updatedPositions.push(index);
      newBoard[index] = player;

      setTmBoard(newBoard);
      if (player === 'X') {
        setXPositions(updatedPositions);
      } else {
        setOPositions(updatedPositions);
      }

      const tmWinner = calculateWinner(newBoard);
      if (tmWinner) {
        if (tmMode === 'vs-computer' && tmWinner === 'O') {
          setTmStatus('Computer wins');
        } else {
          setTmStatus(`Player ${tmWinner} wins`);
        }
      } else {
        setTmIsXNext(player === 'O');
        if (tmMode === 'vs-computer') {
          setTmStatus(player === 'O' ? 'Your turn (X)' : 'Computer thinking...');
        } else {
          setTmStatus(`Player ${player === 'O' ? 'X' : 'O'}'s turn`);
        }
      }
    },
    [tmBoard, tmMode]
  );

  useEffect(() => {
    if (
      activeVariant === '3-marker' &&
      tmMode === 'vs-computer' &&
      !tmIsXNext &&
      !tmStatus.includes('wins')
    ) {
      const timeout = window.setTimeout(() => {
        const bestMoveIndex = findBestThreeMarkerMove(tmBoard);
        if (bestMoveIndex !== -1) {
          executeTmMove(bestMoveIndex, 'O', oPositions);
        }
      }, 700);
      return () => window.clearTimeout(timeout);
    }
  }, [activeVariant, tmIsXNext, tmMode, tmStatus, tmBoard, oPositions, executeTmMove]);

  const handleTmSquareClick = (index: number) => {
    if (tmBoard[index] || tmStatus.includes('wins')) {
      return;
    }
    if (tmMode === 'vs-computer' && !tmIsXNext) {
      return;
    }

    const player: 'X' | 'O' = tmIsXNext ? 'X' : 'O';
    const positions = tmIsXNext ? xPositions : oPositions;
    executeTmMove(index, player, positions);
  };

  const resetTmGame = (modeOverride?: '2-player' | 'vs-computer') => {
    const targetMode = modeOverride || tmMode;
    setTmBoard(Array(9).fill(null));
    setTmIsXNext(true);
    setXPositions([]);
    setOPositions([]);
    setTmStatus(targetMode === 'vs-computer' ? 'Your turn (X)' : "Player X's turn");
  };

  const handleTmModeSelect = (nextMode: '2-player' | 'vs-computer') => {
    setTmMode(nextMode);
    resetTmGame(nextMode);
  };

  const tmWinningIndices = useMemo(() => getWinningIndices(tmBoard), [tmBoard]);
  const tmHasWinner = tmStatus.includes('wins');
  const tmFadingIndex =
    !tmHasWinner && tmIsXNext && xPositions.length === 3
      ? xPositions[0]
      : !tmHasWinner && !tmIsXNext && oPositions.length === 3
      ? oPositions[0]
      : null;

  return (
    <WorkspaceLayout
      onOpenCommandPalette={onOpenCommandPalette}
      subtitle="Tic-Tac-Toe Arena"
      accent="amber"
      width="narrow"
    >
      <ToolBanner
        toolId="tic-tac-toe"
        accent="amber"
        eyebrow="Board Strategy · AI & Pass-and-Play"
        title="Tic-Tac-Toe Arena"
        description="Classic 3×3 rules or the no-draw 3-marker FIFO queue where placing a 4th piece evicts your oldest marker."
      />

      <div className="animate-enter" style={{ ['--stagger-index' as string]: 1 }}>
        <SegmentedControl<GameVariant>
          equalWidth
          accentActive
          ariaLabel="Tic-Tac-Toe game variant"
          value={activeVariant}
          onChange={handleVariantSwitch}
          options={[
            { value: 'classic', label: 'Classic 3x3' },
            { value: '3-marker', label: '3-Marker Queue' },
          ]}
        />
      </div>

      {activeVariant === 'classic' ? (
        <Surface
          key="classic-surface"
          variant="elevated"
          accent="amber"
          padded
          className="animate-enter"
          style={{ ['--stagger-index' as string]: 2 }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18 }}>
            <div
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 10,
                flexWrap: 'wrap',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>
                  Classic 3x3 Tabletop
                </h2>
                <div className="mono" style={{ display: 'flex', gap: 6, fontSize: 11 }}>
                  <span style={{ color: 'var(--accent)', fontWeight: 700 }}>X</span>
                  <span style={{ color: 'var(--text-muted)' }}>vs</span>
                  <span style={{ color: 'var(--cat-amber-secondary)', fontWeight: 700 }}>O</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 6 }}>
                <Button
                  size="sm"
                  variant={typeBoard === 1 ? 'primary' : 'secondary'}
                  onClick={() => switchClassicMode(1)}
                >
                  <FiCpu size={13} />
                  <span>1 Player</span>
                </Button>
                <Button
                  size="sm"
                  variant={typeBoard === 2 ? 'primary' : 'secondary'}
                  onClick={() => switchClassicMode(2)}
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
              className="mono"
              style={{
                width: '100%',
                padding: '10px 14px',
                textAlign: 'center',
                fontSize: 13,
                fontWeight: 600,
                borderColor: winner
                  ? 'var(--status-success-border)'
                  : currentPlayer === 'X'
                  ? 'var(--accent-border)'
                  : 'var(--cat-amber-border)',
                color: winner
                  ? 'var(--status-success)'
                  : isClassicDraw
                  ? 'var(--text-secondary)'
                  : currentPlayer === 'X'
                  ? 'var(--accent)'
                  : 'var(--cat-amber-secondary)',
              }}
            >
              {winner
                ? `Winner: Player ${winner}`
                : isClassicDraw
                ? 'Draw — No moves remaining'
                : typeBoard === 1 && currentPlayer === 'O'
                ? 'Computer thinking...'
                : `Player ${currentPlayer}'s turn`}
            </Surface>

            <GameBoard
              board={board}
              winningIndices={classicWinningIndices}
              onCellClick={handleClassicSquareClick}
            />

            <div
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: 12,
                borderTop: '1px solid var(--border-subtle)',
                gap: 10,
                flexWrap: 'wrap',
              }}
            >
              <span className="mono" style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Mode state preserved across switches
              </span>
              <Button variant="secondary" size="sm" onClick={resetClassicGame}>
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
          accent="amber"
          padded
          className="animate-enter"
          style={{ ['--stagger-index' as string]: 2 }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18 }}>
            <div
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 10,
                flexWrap: 'wrap',
              }}
            >
              <div>
                <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>
                  Three-Marker Variant (FIFO Queue)
                </h2>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                  Max 3 markers per player — placing a 4th evicts the oldest marker.
                </div>
              </div>

              <div style={{ display: 'flex', gap: 6 }}>
                <Button
                  size="sm"
                  variant={tmMode === 'vs-computer' ? 'primary' : 'secondary'}
                  onClick={() => handleTmModeSelect('vs-computer')}
                >
                  <FiCpu size={13} strokeWidth={1.6} />
                  <span>vs Computer</span>
                </Button>
                <Button
                  size="sm"
                  variant={tmMode === '2-player' ? 'primary' : 'secondary'}
                  onClick={() => handleTmModeSelect('2-player')}
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
              className="mono"
              style={{
                width: '100%',
                padding: '10px 14px',
                textAlign: 'center',
                fontSize: 13,
                fontWeight: 600,
                borderColor: tmHasWinner
                  ? 'var(--status-success-border)'
                  : tmIsXNext
                  ? 'var(--accent-border)'
                  : 'var(--cat-amber-border)',
                color: tmHasWinner
                  ? 'var(--status-success)'
                  : tmIsXNext
                  ? 'var(--accent)'
                  : 'var(--cat-amber-secondary)',
              }}
            >
              {tmStatus}
            </Surface>

            <GameBoard
              board={tmBoard}
              winningIndices={tmWinningIndices}
              fadingIndex={tmFadingIndex}
              onCellClick={handleTmSquareClick}
            />

            <div
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 10,
                paddingTop: 12,
                borderTop: '1px solid var(--border-subtle)',
                flexWrap: 'wrap',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Badge tone="accent">
                  {tmMode === 'vs-computer' ? 'You (X)' : 'Player X'}: {xPositions.length}/3
                </Badge>
                <Badge tone="amber">
                  {tmMode === 'vs-computer' ? 'Computer (O)' : 'Player O'}: {oPositions.length}/3
                </Badge>
              </div>

              <Button variant="secondary" size="sm" onClick={() => resetTmGame()}>
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
