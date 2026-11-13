import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FiRotateCcw, FiCpu, FiUsers } from 'react-icons/fi';
import { AppHeader } from '../../shared/ui/AppHeader';
import { Button } from '../../shared/ui/Button';
import { useAlert } from '../../shared/context/AlertContext';
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

  return (
    <div className="workspace-shell">
      <AppHeader onOpenCommandPalette={onOpenCommandPalette} subtitle="Tic-Tac-Toe" />

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
            backgroundColor: '#161922',
            border: '1px solid #252A37',
            borderRadius: 9,
          }}
        >
          <button
            type="button"
            onClick={() => handleVariantSwitch('classic')}
            style={{
              padding: '9px 12px',
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 500,
              backgroundColor: activeVariant === 'classic' ? '#3B82F6' : 'transparent',
              color: activeVariant === 'classic' ? '#F3F4F6' : '#9CA3AF',
            }}
          >
            Classic 3x3
          </button>
          <button
            type="button"
            onClick={() => handleVariantSwitch('3-marker')}
            style={{
              padding: '9px 12px',
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 500,
              backgroundColor: activeVariant === '3-marker' ? '#3B82F6' : 'transparent',
              color: activeVariant === '3-marker' ? '#F3F4F6' : '#9CA3AF',
            }}
          >
            3-Marker
          </button>
        </div>

        {activeVariant === 'classic' ? (
          <section
            style={{
              backgroundColor: '#161922',
              border: '1px solid #252A37',
              borderRadius: 10,
              padding: 20,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 18,
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
              <span style={{ fontSize: 13, fontWeight: 600, color: '#F3F4F6' }}>
                Classic 3x3 Grid
              </span>
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
                padding: '10px 14px',
                backgroundColor: '#0E1015',
                border: '1px solid #252A37',
                borderRadius: 8,
                textAlign: 'center',
                fontSize: 13,
                fontWeight: 500,
                color: winner ? '#10B981' : isClassicDraw ? '#9CA3AF' : '#F3F4F6',
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

            {/* 3x3 Board */}
            <div
              style={{
                width: 'clamp(250px, 76vw, 320px)',
                aspectRatio: '1 / 1',
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gridTemplateRows: 'repeat(3, 1fr)',
                gap: 8,
                padding: 10,
                backgroundColor: '#0E1015',
                border: '1px solid #252A37',
                borderRadius: 10,
              }}
            >
              {board.map((cell, idx) => {
                const isWinningSquare = Boolean(winner && isPartOfClassicWinningLine(idx));
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleClassicSquareClick(idx)}
                    className="mono"
                    style={{
                      backgroundColor: isWinningSquare
                        ? 'rgba(59, 130, 246, 0.16)'
                        : '#161922',
                      border: isWinningSquare
                        ? '1px solid #3B82F6'
                        : '1px solid #252A37',
                      borderRadius: 8,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 'clamp(30px, 9vw, 42px)',
                      fontWeight: 600,
                      color: cell === 'X' ? '#3B82F6' : '#F3F4F6',
                    }}
                  >
                    {cell}
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
                paddingTop: 6,
                borderTop: '1px solid #252A37',
              }}
            >
              <span className="mono" style={{ fontSize: 12, color: '#6B7280' }}>
                Mode state preserved across switches
              </span>
              <Button variant="secondary" size="sm" onClick={resetClassicGame}>
                <FiRotateCcw size={13} />
                <span>Reset Game</span>
              </Button>
            </div>
          </section>
        ) : (
          <section
            style={{
              backgroundColor: '#161922',
              border: '1px solid #252A37',
              borderRadius: 10,
              padding: 20,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 16,
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
                <div style={{ fontSize: 13, fontWeight: 600, color: '#F3F4F6' }}>
                  Three-Marker Variant (FIFO Queue)
                </div>
                <div style={{ fontSize: 12, color: '#9CA3AF' }}>
                  Max 3 markers per player; placing a 4th removes the oldest marker.
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <Button
                  size="sm"
                  variant={tmMode === 'vs-computer' ? 'primary' : 'secondary'}
                  onClick={() => handleTmModeSelect('vs-computer')}
                >
                  <FiCpu size={13} />
                  <span>vs Computer</span>
                </Button>
                <Button
                  size="sm"
                  variant={tmMode === '2-player' ? 'primary' : 'secondary'}
                  onClick={() => handleTmModeSelect('2-player')}
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
                padding: '10px 14px',
                backgroundColor: '#0E1015',
                border: '1px solid #252A37',
                borderRadius: 8,
                textAlign: 'center',
                fontSize: 13,
                fontWeight: 500,
                color: tmStatus.includes('wins') ? '#10B981' : '#F3F4F6',
              }}
            >
              {tmStatus}
            </div>

            {/* 3x3 Board */}
            <div
              style={{
                width: 'clamp(250px, 76vw, 320px)',
                aspectRatio: '1 / 1',
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gridTemplateRows: 'repeat(3, 1fr)',
                gap: 8,
                padding: 10,
                backgroundColor: '#0E1015',
                border: '1px solid #252A37',
                borderRadius: 10,
              }}
            >
              {tmBoard.map((cell, idx) => {
                const isWinningSquare = isPartOfTmWinningLine(idx);
                const isOldestX =
                  xPositions.length === 3 && xPositions[0] === idx && tmIsXNext && !tmStatus.includes('wins');
                const isOldestO =
                  oPositions.length === 3 && oPositions[0] === idx && !tmIsXNext && !tmStatus.includes('wins');
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleTmSquareClick(idx)}
                    className="mono"
                    style={{
                      backgroundColor: isWinningSquare
                        ? 'rgba(59, 130, 246, 0.16)'
                        : '#161922',
                      border: isWinningSquare
                        ? '1px solid #3B82F6'
                        : isOldestX || isOldestO
                        ? '1px dashed #6B7280'
                        : '1px solid #252A37',
                      borderRadius: 8,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 'clamp(30px, 9vw, 42px)',
                      fontWeight: 600,
                      color: cell === 'X' ? '#3B82F6' : '#F3F4F6',
                      opacity: isOldestX || isOldestO ? 0.65 : 1,
                    }}
                    title={
                      isOldestX || isOldestO
                        ? 'Oldest active marker (will be removed on next move)'
                        : undefined
                    }
                  >
                    {cell}
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
                paddingTop: 8,
                borderTop: '1px solid #252A37',
                flexWrap: 'wrap',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span
                  className="mono"
                  style={{
                    fontSize: 12,
                    color: '#3B82F6',
                    backgroundColor: '#0E1015',
                    border: '1px solid #252A37',
                    borderRadius: 6,
                    padding: '4px 10px',
                  }}
                >
                  {tmMode === 'vs-computer' ? 'You (X)' : 'Player X'}: {xPositions.length}/3
                </span>
                <span
                  className="mono"
                  style={{
                    fontSize: 12,
                    color: '#F3F4F6',
                    backgroundColor: '#0E1015',
                    border: '1px solid #252A37',
                    borderRadius: 6,
                    padding: '4px 10px',
                  }}
                >
                  {tmMode === 'vs-computer' ? 'Computer (O)' : 'Player O'}: {oPositions.length}/3
                </span>
              </div>

              <Button variant="secondary" size="sm" onClick={() => resetTmGame()}>
                <FiRotateCcw size={13} />
                <span>Reset Game</span>
              </Button>
            </div>
          </section>
        )}
      </main>
    </div>
  );
};
