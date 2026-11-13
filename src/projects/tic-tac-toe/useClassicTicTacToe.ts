import { useState, useMemo } from 'react';
import { useAlert } from '../../shared/context/AlertContext';
import {
  CellValue,
  calculateWinner,
  findBestClassicMove,
  getWinningIndices,
  getWinningLine,
} from './gameEngine';

export function useClassicTicTacToe() {
  const { showAlert } = useAlert();

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

  const classicWinningLine = useMemo(
    () => (winner ? getWinningLine(board) : null),
    [winner, board]
  );

  const classicWinningIndices = useMemo(
    () => (winner ? getWinningIndices(board) : new Set<number>()),
    [winner, board]
  );

  const classicPreviewPlayer: 'X' | 'O' | null =
    !winner && !isClassicDraw && !(typeBoard === 1 && currentPlayer === 'O')
      ? (currentPlayer as 'X' | 'O')
      : null;

  return {
    board,
    winner,
    typeBoard,
    currentPlayer,
    isClassicDraw,
    classicWinningLine,
    classicWinningIndices,
    classicPreviewPlayer,
    switchClassicMode,
    handleClassicSquareClick,
    resetClassicGame,
  };
}
