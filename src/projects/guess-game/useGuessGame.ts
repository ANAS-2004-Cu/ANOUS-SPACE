import { useState, useCallback, useMemo } from 'react';

export const MAX_TRIES = 10;

export interface GuessEntry {
  value: number;
  result: 'high' | 'low' | 'correct';
  distance: number;
}

export type GuessFeedback =
  | 'idle'
  | 'empty'
  | 'out-of-range'
  | 'higher'
  | 'lower'
  | 'so-higher'
  | 'so-lower'
  | 'victory'
  | 'limit';

export type HintLevel = 'idle' | 'far' | 'close' | 'very-close' | 'won' | 'lost';

export function useGuessGame() {
  const [target, setTarget] = useState(() => Math.floor(Math.random() * 100));
  const [tries, setTries] = useState(0);
  const [active, setActive] = useState(true);
  const [feedback, setFeedback] = useState<GuessFeedback>('idle');
  const [guessHistory, setGuessHistory] = useState<GuessEntry[]>([]);

  const submitGuess = useCallback(
    (rawInput: string) => {
      if (tries >= MAX_TRIES || !active) {
        if (active) {
          setFeedback('limit');
        }
        return;
      }

      if (rawInput.trim() === '') {
        setFeedback('empty');
        return;
      }

      const parsed = Number(rawInput);
      if (Number.isNaN(parsed) || parsed < 0 || parsed > 99) {
        setFeedback('out-of-range');
        return;
      }

      const distance = Math.abs(target - parsed);

      if (target === parsed) {
        setTries((prev) => prev + 1);
        setActive(false);
        setFeedback('victory');
        setGuessHistory((prev) => [...prev, { value: parsed, result: 'correct', distance }]);
        return;
      }

      const nextTries = tries + 1;
      setTries(nextTries);

      if (target > parsed) {
        setFeedback(distance <= 10 ? 'so-higher' : 'higher');
        setGuessHistory((prev) => [...prev, { value: parsed, result: 'low', distance }]);
      } else {
        setFeedback(distance <= 10 ? 'so-lower' : 'lower');
        setGuessHistory((prev) => [...prev, { value: parsed, result: 'high', distance }]);
      }

      if (nextTries >= MAX_TRIES) {
        setFeedback('limit');
      }
    },
    [tries, active, target]
  );

  const reset = useCallback(() => {
    setTarget(Math.floor(Math.random() * 100));
    setTries(0);
    setActive(true);
    setFeedback('idle');
    setGuessHistory([]);
  }, []);

  const lastGuess = guessHistory.length > 0 ? guessHistory[guessHistory.length - 1] : null;
  const lastDistance = lastGuess ? lastGuess.distance : null;

  const { minBound, maxBound } = useMemo(() => {
    let min = 0;
    let max = 99;
    for (const entry of guessHistory) {
      if (entry.result === 'correct') {
        min = entry.value;
        max = entry.value;
        break;
      } else if (entry.result === 'low') {
        min = Math.max(min, Math.min(99, entry.value + 1));
      } else if (entry.result === 'high') {
        max = Math.min(max, Math.max(0, entry.value - 1));
      }
    }
    if (min > max) {
      return { minBound: target, maxBound: target };
    }
    return { minBound: min, maxBound: max };
  }, [guessHistory, target]);

  let hintLevel: HintLevel = 'idle';
  if (feedback === 'victory') {
    hintLevel = 'won';
  } else if (feedback === 'limit' || (tries >= MAX_TRIES && active)) {
    hintLevel = 'lost';
  } else if (lastDistance !== null && lastDistance <= 10) {
    hintLevel = 'very-close';
  } else if (lastDistance !== null && lastDistance <= 25) {
    hintLevel = 'close';
  } else if (lastDistance !== null) {
    hintLevel = 'far';
  }

  return {
    target,
    tries,
    remaining: Math.max(0, MAX_TRIES - tries),
    active,
    feedback,
    guessHistory,
    lastGuess,
    minBound,
    maxBound,
    hintLevel,
    submitGuess,
    reset,
  };
}
