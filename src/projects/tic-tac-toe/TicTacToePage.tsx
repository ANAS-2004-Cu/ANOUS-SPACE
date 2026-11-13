import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FiRotateCcw, FiCpu, FiUsers } from 'react-icons/fi';
import { AppHeader } from '../../shared/ui/AppHeader';
import { Button } from '../../shared/ui/Button';
import { useAlert } from '../../shared/context/AlertContext';
import { useTheme } from '../../shared/context/ThemeContext';
import { recordRecentProject } from '../../shared/utils/recentTools';

type GameVariant = 'classic' | '3-marker';

const WINNING_LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

const COLOR_X = '#5278A8'; // Muted Slate Blue X
const COLOR_O = '#BD883E'; // Warm Ochre O
const COLOR_WIN = '#4D8B6E'; // Muted Sage Winning Line

function calculateWinner(squares: (string | null)[]): string | null {
  for (let i = 0; i < WINNING_LINES.length; i++) {
    const [a, b, c] = WINNING_LINES[i];
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return squares[a];
    }
  }
  return null;
}

export interface TicTacToePageProps {
  onOpenCommandPalette: () => void;
}

export const TicTacToePage: React.FC<TicTacToePageProps> = ({ onOpenCommandPalette }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialVariant: GameVariant =
    searchParams.get('variant') === '3-marker' ? '3-marker' : 'classic';
  const [activeVariant, setActiveVariant] = useState<GameVariant>(initialVariant);

  const { showAlert } = useAlert();
  const { theme } = useTheme();
  const isLight = theme === 'light';

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
  }, [searchParams]);

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
  const [board1, setBoard1] = useState<(string | null)[]>(Array(9).fill(null));
  const [board2, setBoard2] = useState<(string | null)[]>(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState(true);
  const [winner1, setWinner1] = useState<string | null>(null);
  const [winner2, setWinner2] = useState<string | null>(null);
  const [winner, setWinner] = useState<string | null>(null);
  const [typeBoard, setTypeBoard] = useState<1 | 2>(2);
  const [board, setBoard] = useState<(string | null)[]>(Array(9).fill(null));
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

  const findBestClassicMove = (currentBoard: (string | null)[]): number => {
    for (let i = 0; i < WINNING_LINES.length; i++) {
      const [a, b, c] = WINNING_LINES[i];
      if (currentBoard[a] === 'O' && currentBoard[b] === 'O' && currentBoard[c] === null) return c;
      if (currentBoard[a] === 'O' && currentBoard[b] === null && currentBoard[c] === 'O') return b;
      if (currentBoard[a] === null && currentBoard[b] === 'O' && currentBoard[c] === 'O') return a;
    }

    for (let i = 0; i < WINNING_LINES.length; i++) {
      const [a, b, c] = WINNING_LINES[i];
      if (currentBoard[a] === 'X' && currentBoard[b] === 'X' && currentBoard[c] === null) return c;
      if (currentBoard[a] === 'X' && currentBoard[b] === null && currentBoard[c] === 'X') return b;
      if (currentBoard[a] === null && currentBoard[b] === 'X' && currentBoard[c] === 'X') return a;
    }

    const availableMoves = currentBoard
      .map((val, idx) => (val === null ? idx : null))
      .filter((val): val is number => val !== null);
    return availableMoves[Math.floor(Math.random() * availableMoves.length)];
  };

  const runClassicComputerMove = (boardAfterPlayer: (string | null)[]) => {
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

  const isPartOfClassicWinningLine = (index: number) => {
    if (!winner) return false;
    for (let i = 0; i < WINNING_LINES.length; i++) {
      const [a, b, c] = WINNING_LINES[i];
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return index === a || index === b || index === c;
      }
    }
    return false;
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

  // ============================================================================
  // 3-Marker Variant State (FIFO 3-marker queue mechanic + 700ms AI delay)
  // ============================================================================
  const [tmBoard, setTmBoard] = useState<(string | null)[]>(Array(9).fill(null));
  const [tmIsXNext, setTmIsXNext] = useState(true);
  const [tmStatus, setTmStatus] = useState("Player X's turn");
  const [xPositions, setXPositions] = useState<number[]>([]);
  const [oPositions, setOPositions] = useState<number[]>([]);
  const [tmMode, setTmMode] = useState<'2-player' | 'vs-computer'>('vs-computer');

  useEffect(() => {
    if (
      activeVariant === '3-marker' &&
      tmMode === 'vs-computer' &&
      !tmIsXNext &&
      !tmStatus.includes('wins')
    ) {
      const timeout = window.setTimeout(() => {
        makeTmComputerMove();
      }, 700);
      return () => window.clearTimeout(timeout);
    }
  }, [activeVariant, tmIsXNext, tmMode, tmStatus, tmBoard, oPositions]);

  const findTmWinningMove = (currentBoard: (string | null)[], marker: string): number => {
    for (const [a, b, c] of WINNING_LINES) {
      const lineMarkers = [currentBoard[a], currentBoard[b], currentBoard[c]];
      const markerCount = lineMarkers.filter((spot) => spot === marker).length;
      const emptyCount = lineMarkers.filter((spot) => spot === null).length;

      if (markerCount === 2 && emptyCount === 1) {
        if (currentBoard[a] === null) return a;
        if (currentBoard[b] === null) return b;
        if (currentBoard[c] === null) return c;
      }
    }
    return -1;
  };

  const findBestTmMove = (currentBoard: (string | null)[]): number => {
    const boardCopy = [...currentBoard];

    const winningMove = findTmWinningMove(boardCopy, 'O');
    if (winningMove !== -1) return winningMove;

    const blockingMove = findTmWinningMove(boardCopy, 'X');
    if (blockingMove !== -1) return blockingMove;

    if (boardCopy[4] === null) return 4;

    const corners = [0, 2, 6, 8];
    const availableCorners = corners.filter((pos) => boardCopy[pos] === null);
    if (availableCorners.length > 0) {
      return availableCorners[Math.floor(Math.random() * availableCorners.length)];
    }

    const availableSpots = boardCopy
      .map((spot, idx) => (spot === null ? idx : -1))
      .filter((idx) => idx !== -1);
    if (availableSpots.length > 0) {
      return availableSpots[Math.floor(Math.random() * availableSpots.length)];
    }

    return -1;
  };

  const executeTmMove = (
    index: number,
    player: 'X' | 'O',
    currentPositions: number[]
  ) => {
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
  };

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

  const makeTmComputerMove = () => {
    if (tmStatus.includes('wins')) return;
    const bestMoveIndex = findBestTmMove(tmBoard);
    if (bestMoveIndex !== -1) {
      executeTmMove(bestMoveIndex, 'O', oPositions);
    }
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

  const isPartOfTmWinningLine = (index: number) => {
    const tmWinner = calculateWinner(tmBoard);
    if (!tmWinner) return false;
    for (let i = 0; i < WINNING_LINES.length; i++) {
      const [a, b, c] = WINNING_LINES[i];
      if (tmBoard[a] && tmBoard[a] === tmBoard[b] && tmBoard[a] === tmBoard[c]) {
        return index === a || index === b || index === c;
      }
    }
    return false;
  };

  const canvasBg = isLight ? '#F4F4F7' : '#13141B';
  const tabletopBg = isLight ? '#FFFFFF' : '#1C1F2B';
  const tabletopBorder = isLight ? '#DCE0EC' : '#2C3144';
  const recessedWellBg = isLight ? '#E6E9F2' : '#0E1017';
  const cellBg = isLight ? '#F7F8FC' : '#151822';
  const cellBorder = isLight ? '#D5DAE8' : '#252A3A';
  const textPrimary = isLight ? '#0F172A' : '#F3F4F6';
  const textSecondary = isLight ? '#475569' : '#9CA3AF';
  const textMuted = isLight ? '#64748B' : '#6B7280';

  return (
    <div
      className="route-theme-canvas"
      style={{
        backgroundColor: canvasBg,
        backgroundImage: isLight
          ? 'radial-gradient(circle at 25% 10%, rgba(56, 189, 248, 0.1), transparent 45%), radial-gradient(circle at 75% 15%, rgba(251, 146, 60, 0.1), transparent 45%)'
          : 'radial-gradient(circle at 25% 10%, rgba(56, 189, 248, 0.12), transparent 48%), radial-gradient(circle at 75% 15%, rgba(251, 146, 60, 0.11), transparent 48%)',
      }}
    >
      <div className="workspace-shell">
        <AppHeader onOpenCommandPalette={onOpenCommandPalette} subtitle="Tic-Tac-Toe Arena" />

        <main
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            maxWidth: 540,
            width: '100%',
            margin: '0 auto',
            paddingBottom: 40,
          }}
        >
          {/* Segmented Variant Tabs (Classic 3x3 | 3-Marker) */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 6,
              padding: 5,
              backgroundColor: tabletopBg,
              border: `1px solid ${tabletopBorder}`,
              borderRadius: 11,
              boxShadow: isLight
                ? '0 4px 14px rgba(15, 23, 42, 0.04)'
                : '0 10px 26px rgba(0, 0, 0, 0.35)',
            }}
          >
            <button
              type="button"
              onClick={() => handleVariantSwitch('classic')}
              style={{
                padding: '10px 12px',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                backgroundColor:
                  activeVariant === 'classic' ? 'rgba(56, 189, 248, 0.16)' : 'transparent',
                color: activeVariant === 'classic' ? COLOR_X : textSecondary,
                border:
                  activeVariant === 'classic'
                    ? '1px solid rgba(56, 189, 248, 0.45)'
                    : '1px solid transparent',
              }}
            >
              Classic 3x3
            </button>
            <button
              type="button"
              onClick={() => handleVariantSwitch('3-marker')}
              style={{
                padding: '10px 12px',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                backgroundColor:
                  activeVariant === '3-marker' ? 'rgba(251, 146, 60, 0.16)' : 'transparent',
                color: activeVariant === '3-marker' ? COLOR_O : textSecondary,
                border:
                  activeVariant === '3-marker'
                    ? '1px solid rgba(251, 146, 60, 0.45)'
                    : '1px solid transparent',
              }}
            >
              3-Marker Queue
            </button>
          </div>

          {activeVariant === 'classic' ? (
            <section
              style={{
                backgroundColor: tabletopBg,
                border: `1px solid ${tabletopBorder}`,
                borderRadius: 14,
                padding: 22,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 18,
                boxShadow: isLight
                  ? '0 14px 32px rgba(15, 23, 42, 0.06)'
                  : '0 22px 48px rgba(0, 0, 0, 0.48)',
              }}
            >
              {/* Mode Switcher */}
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
                  <span style={{ fontSize: 14, fontWeight: 600, color: textPrimary }}>
                    Classic 3x3 Tabletop
                  </span>
                  <div className="mono" style={{ display: 'flex', gap: 6, fontSize: 11 }}>
                    <span style={{ color: COLOR_X, fontWeight: 700 }}>X</span>
                    <span style={{ color: textMuted }}>vs</span>
                    <span style={{ color: COLOR_O, fontWeight: 700 }}>O</span>
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

              {/* Status Banner */}
              <div
                className="mono"
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  backgroundColor: recessedWellBg,
                  border: `1px solid ${
                    winner
                      ? 'rgba(16, 185, 129, 0.5)'
                      : currentPlayer === 'X'
                      ? 'rgba(56, 189, 248, 0.35)'
                      : 'rgba(251, 146, 60, 0.35)'
                  }`,
                  borderRadius: 10,
                  textAlign: 'center',
                  fontSize: 13,
                  fontWeight: 600,
                  color: winner
                    ? COLOR_WIN
                    : isClassicDraw
                    ? textSecondary
                    : currentPlayer === 'X'
                    ? COLOR_X
                    : COLOR_O,
                }}
              >
                {winner
                  ? `Winner: Player ${winner}`
                  : isClassicDraw
                  ? 'Draw — No moves remaining'
                  : typeBoard === 1 && currentPlayer === 'O'
                  ? 'Computer thinking...'
                  : `Player ${currentPlayer}'s turn`}
              </div>

              {/* 3x3 Raised & Recessed Board */}
              <div
                style={{
                  width: 'clamp(260px, 78vw, 332px)',
                  aspectRatio: '1 / 1',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gridTemplateRows: 'repeat(3, 1fr)',
                  gap: 10,
                  padding: 12,
                  backgroundColor: recessedWellBg,
                  border: `1px solid ${tabletopBorder}`,
                  borderRadius: 14,
                  boxShadow: isLight
                    ? 'inset 0 2px 6px rgba(15, 23, 42, 0.08)'
                    : 'inset 0 3px 10px rgba(0, 0, 0, 0.55)',
                }}
              >
                {board.map((cell, idx) => {
                  const isWinningSquare = Boolean(winner && isPartOfClassicWinningLine(idx));
                  const markerColor = isWinningSquare
                    ? COLOR_WIN
                    : cell === 'X'
                    ? COLOR_X
                    : COLOR_O;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleClassicSquareClick(idx)}
                      className="mono"
                      style={{
                        backgroundColor: isWinningSquare
                          ? 'rgba(16, 185, 129, 0.16)'
                          : cellBg,
                        border: isWinningSquare
                          ? `2px solid ${COLOR_WIN}`
                          : `1px solid ${cellBorder}`,
                        borderRadius: 10,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 'clamp(32px, 9vw, 44px)',
                        fontWeight: 700,
                        color: markerColor,
                        boxShadow: isLight
                          ? '0 2px 5px rgba(15, 23, 42, 0.05)'
                          : '0 4px 10px rgba(0, 0, 0, 0.35)',
                        transition: 'border-color 0.15s ease, background-color 0.15s ease',
                      }}
                    >
                      {cell && (
                        <span key={`${idx}-${cell}`} className="marker-pop">
                          {cell}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              <div
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingTop: 8,
                  borderTop: `1px solid ${tabletopBorder}`,
                }}
              >
                <span className="mono" style={{ fontSize: 12, color: textMuted }}>
                  Mode state preserved across switches
                </span>
                <Button variant="secondary" size="sm" onClick={resetClassicGame}>
                  <FiRotateCcw size={13} />
                  <span>Reset Board</span>
                </Button>
              </div>
            </section>
          ) : (
            <section
              style={{
                backgroundColor: tabletopBg,
                border: `1px solid ${tabletopBorder}`,
                borderRadius: 14,
                padding: 24,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 16,
                boxShadow: isLight
                  ? 'var(--card-top-highlight), 0 10px 26px rgba(24, 25, 28, 0.06)'
                  : 'var(--card-top-highlight), 0 18px 36px rgba(0, 0, 0, 0.42)',
              }}
            >
              {/* Header & Mode Switcher */}
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
                  <div style={{ fontSize: 14, fontWeight: 600, color: textPrimary }}>
                    Three-Marker Variant (FIFO Queue)
                  </div>
                  <div style={{ fontSize: 12, color: textSecondary }}>
                    Max 3 markers per player — placing a 4th evicts the oldest marker.
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <Button
                    size="sm"
                    variant={tmMode === 'vs-computer' ? 'primary' : 'secondary'}
                    onClick={() => handleTmModeSelect('vs-computer')}
                  >
                    <FiCpu size={13} strokeWidth={1.5} />
                    <span>vs Computer</span>
                  </Button>
                  <Button
                    size="sm"
                    variant={tmMode === '2-player' ? 'primary' : 'secondary'}
                    onClick={() => handleTmModeSelect('2-player')}
                  >
                    <FiUsers size={13} strokeWidth={1.5} />
                    <span>2 Players</span>
                  </Button>
                </div>
              </div>

              {/* Status Banner */}
              <div
                className="mono"
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  backgroundColor: recessedWellBg,
                  border: `1px solid ${
                    tmStatus.includes('wins')
                      ? 'rgba(77, 139, 110, 0.45)'
                      : tmIsXNext
                      ? 'rgba(82, 120, 168, 0.35)'
                      : 'rgba(189, 136, 62, 0.35)'
                  }`,
                  borderRadius: 10,
                  textAlign: 'center',
                  fontSize: 13,
                  fontWeight: 600,
                  color: tmStatus.includes('wins')
                    ? COLOR_WIN
                    : tmIsXNext
                    ? COLOR_X
                    : COLOR_O,
                }}
              >
                {tmStatus}
              </div>

              {/* 3x3 Raised & Recessed Board */}
              <div
                style={{
                  width: 'clamp(260px, 78vw, 332px)',
                  aspectRatio: '1 / 1',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gridTemplateRows: 'repeat(3, 1fr)',
                  gap: 10,
                  padding: 12,
                  backgroundColor: recessedWellBg,
                  border: `1px solid ${tabletopBorder}`,
                  borderRadius: 14,
                  boxShadow: isLight
                    ? 'inset 0 2px 5px rgba(24, 25, 28, 0.06)'
                    : 'inset 0 3px 8px rgba(0, 0, 0, 0.45)',
                }}
              >
                {tmBoard.map((cell, idx) => {
                  const isWinningSquare = isPartOfTmWinningLine(idx);
                  const isOldestX =
                    xPositions.length === 3 &&
                    xPositions[0] === idx &&
                    tmIsXNext &&
                    !tmStatus.includes('wins');
                  const isOldestO =
                    oPositions.length === 3 &&
                    oPositions[0] === idx &&
                    !tmIsXNext &&
                    !tmStatus.includes('wins');
                  const isEvicting = isOldestX || isOldestO;
                  const markerColor = isWinningSquare
                    ? COLOR_WIN
                    : cell === 'X'
                    ? COLOR_X
                    : COLOR_O;

                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleTmSquareClick(idx)}
                      className="mono"
                      style={{
                        position: 'relative',
                        backgroundColor: isWinningSquare
                          ? 'rgba(77, 139, 110, 0.16)'
                          : cellBg,
                        border: isWinningSquare
                          ? `2px solid ${COLOR_WIN}`
                          : isOldestX
                          ? `1.5px dashed ${COLOR_X}`
                          : isOldestO
                          ? `1.5px dashed ${COLOR_O}`
                          : `1px solid ${cellBorder}`,
                        borderRadius: 10,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 'clamp(32px, 9vw, 44px)',
                        fontWeight: 700,
                        color: markerColor,
                        opacity: isEvicting ? 0.55 : 1,
                        boxShadow: isLight
                          ? '0 2px 5px rgba(24, 25, 28, 0.05)'
                          : '0 4px 10px rgba(0, 0, 0, 0.3)',
                        transition: 'all 0.15s ease',
                      }}
                      title={
                        isEvicting
                          ? 'Oldest active marker (will vanish on this turn)'
                          : undefined
                      }
                    >
                      {cell && (
                        <span key={`${idx}-${cell}`} className="marker-pop">
                          {cell}
                        </span>
                      )}
                      {isEvicting && (
                        <span
                          style={{
                            position: 'absolute',
                            bottom: 4,
                            fontSize: 9,
                            letterSpacing: '0.06em',
                            color: isOldestX ? COLOR_X : COLOR_O,
                            fontWeight: 600,
                          }}
                        >
                          FADING
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Live Marker Counters & Reset */}
              <div
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 10,
                  paddingTop: 10,
                  borderTop: `1px solid ${tabletopBorder}`,
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span
                    className="mono"
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: COLOR_X,
                      backgroundColor: 'rgba(82, 120, 168, 0.12)',
                      border: '1px solid rgba(82, 120, 168, 0.35)',
                      borderRadius: 7,
                      padding: '4px 10px',
                    }}
                  >
                    {tmMode === 'vs-computer' ? 'You (X)' : 'Player X'}: {xPositions.length}/3
                  </span>
                  <span
                    className="mono"
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: COLOR_O,
                      backgroundColor: 'rgba(189, 136, 62, 0.12)',
                      border: '1px solid rgba(189, 136, 62, 0.35)',
                      borderRadius: 7,
                      padding: '4px 10px',
                    }}
                  >
                    {tmMode === 'vs-computer' ? 'Computer (O)' : 'Player O'}: {oPositions.length}/3
                  </span>
                </div>

                <Button variant="secondary" size="sm" onClick={() => resetTmGame()}>
                  <FiRotateCcw size={13} strokeWidth={1.5} />
                  <span>Reset Board</span>
                </Button>
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
};
