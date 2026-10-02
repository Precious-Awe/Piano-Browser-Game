/*
 * Timing windows, per difficulty.
 *
 * Easy is generous so a beginner can
 * land notes; Hard is tighter.
 *
 * perfect: within this many ms of the
 *          beat counts as Perfect
 * good:    within this counts as Good,
 *          and presses further away are
 *          ignored altogether
 */
const WINDOWS = {
  easy: {
    perfect: 160,
    good: 320
  },

  medium: {
    perfect: 120,
    good: 240
  },

  hard: {
    perfect: 90,
    good: 180
  }
};


let currentWindows =
  WINDOWS.easy;


export function setTimingDifficulty(
  difficulty
) {
  currentWindows =
    WINDOWS[difficulty] ||
    WINDOWS.easy;
}


/*
 * Presses further than this from a
 * note's hit time are ignored.
 */
export function getHitWindow() {
  return currentWindows.good;
}


export function calculateTimingError(
  playerInputTime,
  scheduledHitTime
) {
  return playerInputTime - scheduledHitTime;
}


export function calculateJudgement(timingError) {
  const absoluteError = Math.abs(timingError);

  if (
    absoluteError <=
    currentWindows.perfect
  ) {
    return "Perfect";
  }

  if (
    absoluteError <=
    currentWindows.good
  ) {
    return "Good";
  }

  return "Miss";
}
