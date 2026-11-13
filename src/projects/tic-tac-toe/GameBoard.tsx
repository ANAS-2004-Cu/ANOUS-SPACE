import React from 'react';
import { CellValue } from './gameEngine';

export interface GameBoardProps {
  board: CellValue[];
  winningIndices: Set<number>;
  fadingIndex?: number | null;
  onCellClick: (index: number) => void;
}

export const GameBoard: React.FC<GameBoardProps> = ({
  board,
  winningIndices,
  fadingIndex = null,
  onCellClick,
}) => {
  return (
    <div className="ttt-board-well">
      {board.map((cell, idx) => {
        const isWinningSquare = winningIndices.has(idx);
        const isEvicting = fadingIndex === idx;
        const classes = [
          'ttt-cell',
          isWinningSquare
            ? 'ttt-cell--win'
            : cell === 'X'
            ? 'ttt-cell--x'
            : cell === 'O'
            ? 'ttt-cell--o'
            : '',
          isEvicting ? 'ttt-cell--fading' : '',
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
              isEvicting
                ? 'Oldest active marker (will vanish on this turn)'
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
            {isEvicting && <span className="ttt-cell__fading-tag">FADING</span>}
          </button>
        );
      })}
    </div>
  );
};
