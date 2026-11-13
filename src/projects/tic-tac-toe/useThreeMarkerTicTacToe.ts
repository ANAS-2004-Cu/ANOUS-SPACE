import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  CellValue,
  calculateWinner,
  findBestThreeMarkerMove,
  getWinningIndices,
  getWinningLine,
} from './gameEngine';

export function useThreeMarkerTicTacToe(activeVariant: 'classic' | '3-marker') {
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

  const tmWinningLine = useMemo(() => getWinningLine(tmBoard), [tmBoard]);
  const tmWinningIndices = useMemo(() => getWinningIndices(tmBoard), [tmBoard]);
  const tmHasWinner = tmStatus.includes('wins');
  const tmOldestIndex =
    !tmHasWinner && tmIsXNext && xPositions.length === 3
      ? xPositions[0]
      : !tmHasWinner && !tmIsXNext && oPositions.length === 3
      ? oPositions[0]
      : null;

  const tmPreviewPlayer: 'X' | 'O' | null =
    !tmHasWinner && !(tmMode === 'vs-computer' && !tmIsXNext)
      ? tmIsXNext
        ? 'X'
        : 'O'
      : null;

  return {
    tmBoard,
    tmIsXNext,
    tmStatus,
    xPositions,
    oPositions,
    tmMode,
    tmWinningLine,
    tmWinningIndices,
    tmHasWinner,
    tmOldestIndex,
    tmPreviewPlayer,
    handleTmSquareClick,
    resetTmGame,
    handleTmModeSelect,
  };
}
