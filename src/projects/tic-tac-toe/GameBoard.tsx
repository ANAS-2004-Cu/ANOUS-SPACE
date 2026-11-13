import React from 'react';
import { CellValue } from './gameEngine';

export interface GameBoardProps {
  board: CellValue[];
  winningIndices: Set<number>;
  winningLine?: readonly [number, number, number] | null;
  oldestIndex?: number | null;
  previewPlayer?: 'X' | 'O' | null;
  onCellClick: (index: number) => void;
}

function getLineCoords(line: readonly [number, number, number]) {
  const [startIdx, , endIdx] = line;
  const center = (pos: number) => (pos === 0 ? 47 : pos === 1 ? 150 : 253);
  const startRow = Math.floor(startIdx / 3);
  const startCol = startIdx % 3;
  const endRow = Math.floor(endIdx / 3);
  const endCol = endIdx % 3;

  return {
    x1: center(startCol),
    y1: center(startRow),
    x2: center(endCol),
    y2: center(endRow),
  };
}

export const GameBoard: React.FC<GameBoardProps> = ({
  board,
  winningIndices,
  winningLine = null,
  oldestIndex = null,
  previewPlayer = null,
  onCellClick,
}) => {
  const strikeCoords = winningLine ? getLineCoords(winningLine) : null;

  return (
    <div className="ttt-board-shell">
      <div className="ttt-board-well">
        {board.map((cell, idx) => {
          const isWinningSquare = winningIndices.has(idx);
          const isOldest = oldestIndex === idx;
          const showGhost = !cell && Boolean(previewPlayer) && !winningLine;

          const classes = [
            'ttt-cell',
            isWinningSquare
              ? 'ttt-cell--win'
              : cell === 'X'
              ? 'ttt-cell--x'
              : cell === 'O'
              ? 'ttt-cell--o'
              : '',
            isOldest ? 'ttt-cell--oldest' : '',
          ]
            .filter(Boolean)
            .join(' ');

          return (
            <button
              key={idx}
              type="button"
              onClick={() => onCellClick(idx)}
              className={classes}
              aria-label={`Square ${idx + 1}${cell ? `: ${cell}` : ''}`}
              title={
                isOldest
                  ? 'Oldest active piece — removed on the next move'
                  : undefined
              }
            >
              {cell === 'X' && (
                <span key={`${idx}-X`} className="marker-pop">
                  <svg
                    className="marker-svg"
                    width="42"
                    height="42"
                    viewBox="0 0 42 42"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M10 10L32 32"
                      stroke="currentColor"
                      strokeWidth="4.2"
                      strokeLinecap="round"
                    />
                    <path
                      d="M32 10L10 32"
                      stroke="currentColor"
                      strokeWidth="4.2"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
              )}

              {cell === 'O' && (
                <span key={`${idx}-O`} className="marker-pop">
                  <svg
                    className="marker-svg"
                    width="42"
                    height="42"
                    viewBox="0 0 42 42"
                    fill="none"
                    aria-hidden="true"
                  >
                    <circle
                      cx="21"
                      cy="21"
                      r="11.5"
                      stroke="currentColor"
                      strokeWidth="4.2"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
              )}

              {showGhost && previewPlayer === 'X' && (
                <span
                  className="ttt-cell__ghost"
                  style={{ color: 'var(--accent)' }}
                  aria-hidden="true"
                >
                  <svg width="38" height="38" viewBox="0 0 42 42" fill="none">
                    <path
                      d="M10 10L32 32M32 10L10 32"
                      stroke="currentColor"
                      strokeWidth="3.8"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
              )}

              {showGhost && previewPlayer === 'O' && (
                <span
                  className="ttt-cell__ghost"
                  style={{ color: 'var(--cat-amber-secondary)' }}
                  aria-hidden="true"
                >
                  <svg width="38" height="38" viewBox="0 0 42 42" fill="none">
                    <circle
                      cx="21"
                      cy="21"
                      r="11.5"
                      stroke="currentColor"
                      strokeWidth="3.8"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
              )}

              {isOldest && <span className="ttt-cell__oldest-tag">NEXT OUT</span>}
            </button>
          );
        })}
      </div>

      {strikeCoords && (
        <svg
          className="ttt-win-overlay"
          viewBox="0 0 300 300"
          fill="none"
          aria-hidden="true"
        >
          <line
            className="ttt-win-line"
            x1={strikeCoords.x1}
            y1={strikeCoords.y1}
            x2={strikeCoords.x2}
            y2={strikeCoords.y2}
          />
        </svg>
      )}
    </div>
  );
};
