export function createScoreTracker() {
  let score = 0;
  let correct = 0;
  let wrong = 0;
  let combo = 0;
  let totalReactionTime = 0;

  function reset() {
    score = 0;
    correct = 0;
    wrong = 0;
    combo = 0;
    totalReactionTime = 0;
  }

  function recordCorrectAnswer(reactionTime) {
    correct++;
    combo++;
    totalReactionTime += reactionTime;
    score += 10 + combo;
  }

  function recordWrongAnswer() {
    wrong++;
    combo = 0;
  }

  function getAccuracy() {
    const totalAttempts = correct + wrong;

    return totalAttempts === 0
      ? 100
      : Math.round((correct / totalAttempts) * 100);
  }

  function getAverageReactionTime() {
    return correct === 0
      ? "0.00"
      : (totalReactionTime / correct / 1000).toFixed(2);
  }

  function getStats() {
    return {
      score,
      correct,
      wrong,
      combo,
      accuracy: getAccuracy(),
      averageReactionTime: getAverageReactionTime()
    };
  }

  return {
    reset,
    recordCorrectAnswer,
    recordWrongAnswer,
    getStats
  };
}