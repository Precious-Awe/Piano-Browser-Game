export function createRenderer() {
  const startBtn = document.getElementById("startBtn");
  const gameArea = document.getElementById("gameArea");
  const targetNoteEl = document.getElementById("targetNote");
  const feedbackEl = document.getElementById("feedback");

  const scoreValueEl = document.getElementById("scoreValue");
  const timeValueEl = document.getElementById("timeValue");
  const accuracyValueEl = document.getElementById("accuracyValue");
  const comboValueEl = document.getElementById("comboValue");

  function showGame() {
    startBtn.classList.add("hidden");
    gameArea.classList.remove("hidden");
  }

  function showTargetNote(note) {
    targetNoteEl.textContent = note;
    feedbackEl.textContent = "";
  }

  function showFeedback(message) {
    feedbackEl.textContent = message;
  }

  function clearFeedback() {
    feedbackEl.textContent = "";
  }

  function updateScoreboard({ score, timeLeft, accuracy, combo }) {
    scoreValueEl.textContent = score;
    timeValueEl.textContent = `${timeLeft}s`;
    accuracyValueEl.textContent = `${accuracy}%`;
    comboValueEl.textContent = `×${combo}`;
  }

  function createFallingNote(noteName) {
  const noteHighwayEl = document.getElementById("noteHighway");

  const noteEl = document.createElement("div");
  noteEl.className = "falling-note";
  noteEl.textContent = noteName.replace("#", "♯");

  noteHighwayEl.appendChild(noteEl);

  return noteEl;
}

function removeFallingNote(noteEl) {
  noteEl.remove();
}

  function showGameOver({
    score,
    correct,
    wrong,
    accuracy,
    averageReactionTime
  }) {
    targetNoteEl.textContent = "Game Over";

    feedbackEl.innerHTML = `
      Final Score: ${score}<br>
      Correct Notes: ${correct}<br>
      Wrong Notes: ${wrong}<br>
      Accuracy: ${accuracy}%<br>
      Average Reaction Time: ${averageReactionTime}s
    `;

    startBtn.textContent = "Play Again";
    startBtn.classList.remove("hidden");
  }

  return {
    showGame,
    showTargetNote,
    showFeedback,
    clearFeedback,
    updateScoreboard,
    showGameOver,
    createFallingNote,
    removeFallingNote
  };
}