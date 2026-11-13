import { useState, useCallback } from 'react';

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

export type RadarZone = 'victory' | 'limit' | 'hot' | 'warm' | 'cool';

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

  let radarZone: RadarZone = 'cool';
  if (feedback === 'victory') {
    radarZone = 'victory';
  } else if (feedback === 'limit' || (tries >= MAX_TRIES && active)) {
    radarZone = 'limit';
  } else if (lastDistance !== null && lastDistance <= 10) {
    radarZone = 'hot';
  } else if (lastDistance !== null && lastDistance <= 25) {
    radarZone = 'warm';
  }

  return {
    target,
    tries,
    remaining: Math.max(0, MAX_TRIES - tries),
    active,
    feedback,
    guessHistory,
    lastGuess,
    radarZone,
    submitGuess,
    reset,
  };
}
