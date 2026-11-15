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

export type PlayerMarker = 'X' | 'O';
export type CellValue = PlayerMarker | null;
export type AiDifficulty = 'easy' | 'medium' | 'hard';

export function calculateWinner(squares: CellValue[]): PlayerMarker | null {
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

function getAvailableMoves(board: CellValue[]): number[] {
  return board
    .map((val, idx) => (val === null ? idx : null))
    .filter((val): val is number => val !== null);
}

function pickRandomMove(moves: number[]): number {
  if (moves.length === 0) return -1;
  return moves[Math.floor(Math.random() * moves.length)];
}

function findTwoInRowMove(currentBoard: CellValue[], marker: PlayerMarker): number {
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

function minimaxClassic(
  board: CellValue[],
  depth: number,
  isMaximizing: boolean,
  alpha: number,
  beta: number
): number {
  const winner = calculateWinner(board);
  if (winner === 'O') return 10 - depth;
  if (winner === 'X') return depth - 10;

  const available = getAvailableMoves(board);
  if (available.length === 0) return 0;

  if (isMaximizing) {
    let best = -Infinity;
    for (const move of available) {
      board[move] = 'O';
      const score = minimaxClassic(board, depth + 1, false, alpha, beta);
      board[move] = null;
      if (score > best) best = score;
      if (score > alpha) alpha = score;
      if (beta <= alpha) break;
    }
    return best;
  } else {
    let best = Infinity;
    for (const move of available) {
      board[move] = 'X';
      const score = minimaxClassic(board, depth + 1, true, alpha, beta);
      board[move] = null;
      if (score < best) best = score;
      if (score < beta) beta = score;
      if (beta <= alpha) break;
    }
    return best;
  }
}

export function findBestClassicMove(
  currentBoard: CellValue[],
  difficulty: AiDifficulty = 'medium'
): number {
  const availableMoves = getAvailableMoves(currentBoard);
  if (availableMoves.length === 0) return -1;

  // Easy: Purely casual play — random empty cell (with a small 25% chance to take an obvious win)
  if (difficulty === 'easy') {
    if (Math.random() < 0.25) {
      const winMove = findTwoInRowMove(currentBoard, 'O');
      if (winMove !== -1) return winMove;
    }
    return pickRandomMove(availableMoves);
  }

  // Medium: Takes immediate wins and blocks immediate threats, otherwise picks randomly
  if (difficulty === 'medium') {
    const winMove = findTwoInRowMove(currentBoard, 'O');
    if (winMove !== -1) return winMove;

    const blockMove = findTwoInRowMove(currentBoard, 'X');
    if (blockMove !== -1) return blockMove;

    return pickRandomMove(availableMoves);
  }

  // Hard: Unbeatable full-depth Minimax with tie-breaking variety
  const boardCopy = currentBoard.slice();
  let bestScore = -Infinity;
  let bestMoves: number[] = [];

  for (const move of availableMoves) {
    boardCopy[move] = 'O';
    const score = minimaxClassic(boardCopy, 0, false, -Infinity, Infinity);
    boardCopy[move] = null;

    if (score > bestScore) {
      bestScore = score;
      bestMoves = [move];
    } else if (score === bestScore) {
      bestMoves.push(move);
    }
  }

  return pickRandomMove(bestMoves);
}

function simulateThreeMarkerStep(
  board: CellValue[],
  moveIndex: number,
  player: PlayerMarker,
  playerPositions: number[]
): { nextBoard: CellValue[]; nextPositions: number[] } {
  const nextBoard = board.slice();
  const nextPositions = playerPositions.slice();

  if (nextPositions.length === 3) {
    const oldest = nextPositions.shift();
    if (oldest !== undefined) {
      nextBoard[oldest] = null;
    }
  }

  nextPositions.push(moveIndex);
  nextBoard[moveIndex] = player;

  return { nextBoard, nextPositions };
}

function evaluateThreeMarkerHeuristic(board: CellValue[]): number {
  let score = 0;
  if (board[4] === 'O') score += 3;
  else if (board[4] === 'X') score -= 3;

  for (const [a, b, c] of WINNING_LINES) {
    const line = [board[a], board[b], board[c]];
    const oCount = line.filter((cell) => cell === 'O').length;
    const xCount = line.filter((cell) => cell === 'X').length;

    if (oCount === 2 && xCount === 0) score += 6;
    else if (xCount === 2 && oCount === 0) score -= 6;
    else if (oCount === 1 && xCount === 0) score += 1;
    else if (xCount === 1 && oCount === 0) score -= 1;
  }

  return score;
}

function minimaxThreeMarker(
  board: CellValue[],
  oPositions: number[],
  xPositions: number[],
  depth: number,
  maxDepth: number,
  isMaximizing: boolean,
  alpha: number,
  beta: number
): number {
  const winner = calculateWinner(board);
  if (winner === 'O') return 100 - depth;
  if (winner === 'X') return depth - 100;
  if (depth >= maxDepth) return evaluateThreeMarkerHeuristic(board);

  const available = getAvailableMoves(board);
  if (available.length === 0) return 0;

  if (isMaximizing) {
    let best = -Infinity;
    for (const move of available) {
      const { nextBoard, nextPositions } = simulateThreeMarkerStep(board, move, 'O', oPositions);
      const score = minimaxThreeMarker(
        nextBoard,
        nextPositions,
        xPositions,
        depth + 1,
        maxDepth,
        false,
        alpha,
        beta
      );
      if (score > best) best = score;
      if (score > alpha) alpha = score;
      if (beta <= alpha) break;
    }
    return best;
  } else {
    let best = Infinity;
    for (const move of available) {
      const { nextBoard, nextPositions } = simulateThreeMarkerStep(board, move, 'X', xPositions);
      const score = minimaxThreeMarker(
        nextBoard,
        oPositions,
        nextPositions,
        depth + 1,
        maxDepth,
        true,
        alpha,
        beta
      );
      if (score < best) best = score;
      if (score < beta) beta = score;
      if (beta <= alpha) break;
    }
    return best;
  }
}

export function findBestThreeMarkerMove(
  currentBoard: CellValue[],
  difficulty: AiDifficulty = 'medium',
  oPositions: number[] = [],
  xPositions: number[] = []
): number {
  const availableSpots = getAvailableMoves(currentBoard);
  if (availableSpots.length === 0) return -1;

  // Easy: Random placement (25% chance to take an immediate FIFO-aware win)
  if (difficulty === 'easy') {
    if (Math.random() < 0.25) {
      for (const spot of availableSpots) {
        const { nextBoard } = simulateThreeMarkerStep(currentBoard, spot, 'O', oPositions);
        if (calculateWinner(nextBoard) === 'O') return spot;
      }
    }
    return pickRandomMove(availableSpots);
  }

  // Medium: Tactical 1-step lookahead (win, block, center, corner, random)
  if (difficulty === 'medium') {
    for (const spot of availableSpots) {
      const { nextBoard } = simulateThreeMarkerStep(currentBoard, spot, 'O', oPositions);
      if (calculateWinner(nextBoard) === 'O') return spot;
    }

    for (const spot of availableSpots) {
      const { nextBoard } = simulateThreeMarkerStep(currentBoard, spot, 'X', xPositions);
      if (calculateWinner(nextBoard) === 'X') return spot;
    }

    const fallbackWin = findTwoInRowMove(currentBoard, 'O');
    if (fallbackWin !== -1) return fallbackWin;

    const fallbackBlock = findTwoInRowMove(currentBoard, 'X');
    if (fallbackBlock !== -1) return fallbackBlock;

    if (currentBoard[4] === null) return 4;

    const corners = [0, 2, 6, 8];
    const availableCorners = corners.filter((pos) => currentBoard[pos] === null);
    if (availableCorners.length > 0) {
      return pickRandomMove(availableCorners);
    }

    return pickRandomMove(availableSpots);
  }

  // Hard: Multi-ply FIFO-aware Minimax with Alpha-Beta pruning
  let bestScore = -Infinity;
  let bestMoves: number[] = [];
  const searchDepth = 5;

  for (const move of availableSpots) {
    const { nextBoard, nextPositions } = simulateThreeMarkerStep(
      currentBoard,
      move,
      'O',
      oPositions
    );
    const score = minimaxThreeMarker(
      nextBoard,
      nextPositions,
      xPositions,
      0,
      searchDepth,
      false,
      -Infinity,
      Infinity
    );

    if (score > bestScore) {
      bestScore = score;
      bestMoves = [move];
    } else if (score === bestScore) {
      bestMoves.push(move);
    }
  }

  return pickRandomMove(bestMoves);
}
