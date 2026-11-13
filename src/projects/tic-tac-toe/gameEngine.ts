export const WINNING_LINES: readonly [number, number, number][] = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

export type CellValue = string | null;

export function calculateWinner(squares: CellValue[]): string | null {
  for (const [a, b, c] of WINNING_LINES) {
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return squares[a];
    }
  }
  return null;
}

export function getWinningLine(squares: CellValue[]): readonly [number, number, number] | null {
  for (const line of WINNING_LINES) {
    const [a, b, c] = line;
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return line;
    }
  }
  return null;
}

export function getWinningIndices(squares: CellValue[]): Set<number> {
  const line = getWinningLine(squares);
  return line ? new Set(line) : new Set();
}

export function findBestClassicMove(currentBoard: CellValue[]): number {
  for (const [a, b, c] of WINNING_LINES) {
    if (currentBoard[a] === 'O' && currentBoard[b] === 'O' && currentBoard[c] === null) return c;
    if (currentBoard[a] === 'O' && currentBoard[b] === null && currentBoard[c] === 'O') return b;
    if (currentBoard[a] === null && currentBoard[b] === 'O' && currentBoard[c] === 'O') return a;
  }

  for (const [a, b, c] of WINNING_LINES) {
    if (currentBoard[a] === 'X' && currentBoard[b] === 'X' && currentBoard[c] === null) return c;
    if (currentBoard[a] === 'X' && currentBoard[b] === null && currentBoard[c] === 'X') return b;
    if (currentBoard[a] === null && currentBoard[b] === 'X' && currentBoard[c] === 'X') return a;
  }

  const availableMoves = currentBoard
    .map((val, idx) => (val === null ? idx : null))
    .filter((val): val is number => val !== null);
  return availableMoves[Math.floor(Math.random() * availableMoves.length)];
}

function findTwoInRowMove(currentBoard: CellValue[], marker: string): number {
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
}

export function findBestThreeMarkerMove(currentBoard: CellValue[]): number {
  const boardCopy = [...currentBoard];

  const winningMove = findTwoInRowMove(boardCopy, 'O');
  if (winningMove !== -1) return winningMove;

  const blockingMove = findTwoInRowMove(boardCopy, 'X');
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
}
