export function createScoreTracker() {
  let score = 0;
  let perfect = 0;
  let good = 0;
  let miss = 0;
  let combo = 0;
  let maxCombo = 0;
  let totalTimingError = 0;
  let successfulHits = 0;

  function reset() {
    score = 0;
    perfect = 0;
    good = 0;
    miss = 0;
    combo = 0;
    maxCombo = 0;
    totalTimingError = 0;
    successfulHits = 0;
  }

  function recordPerfect(timingError) {
    perfect += 1;
    successfulHits += 1;
    combo += 1;
    maxCombo = Math.max(maxCombo, combo);

    totalTimingError += Math.abs(timingError);

    score += 100 + combo * 2;
  }

  function recordGood(timingError) {
    good += 1;
    successfulHits += 1;
    combo += 1;
    maxCombo = Math.max(maxCombo, combo);

    totalTimingError += Math.abs(timingError);

    score += 50 + combo;
  }

  function recordMiss() {
    miss += 1;
    combo = 0;
  }

  function getStats() {
    const totalAttempts =
      perfect + good + miss;

    const accuracy =
      totalAttempts === 0
        ? 100
        : Math.round(
            ((perfect + good) / totalAttempts) * 100
          );

    const averageTimingError =
      successfulHits === 0
        ? "0.00"
        : (
            totalTimingError /
            successfulHits /
            1000
          ).toFixed(2);

    return {
      score,
      perfect,
      good,
      miss,
      combo,
      maxCombo,
      accuracy,
      averageTimingError
    };
  }

  return {
    reset,
    recordPerfect,
    recordGood,
    recordMiss,
    getStats
  };
}