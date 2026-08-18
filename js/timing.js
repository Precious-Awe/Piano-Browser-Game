const PERFECT_WINDOW = 100;
const GOOD_WINDOW = 200;

export function calculateTimingError(
  playerInputTime,
  scheduledHitTime
) {
  return playerInputTime - scheduledHitTime;
}

export function calculateJudgement(timingError) {
  const absoluteError = Math.abs(timingError);

  if (absoluteError <= PERFECT_WINDOW) {
    return "Perfect";
  }

  if (absoluteError <= GOOD_WINDOW) {
    return "Good";
  }

  return "Miss";
}