export function createRenderer() {
  const noteHighwayEl =
    document.getElementById("noteHighway");

  const startBtn =
    document.getElementById("startBtn");

  const gameArea =
    document.getElementById("gameArea");

  const targetNoteEl =
    document.getElementById("targetNote");

  const feedbackEl =
    document.getElementById("feedback");

  const judgementEl =
    document.getElementById("judgement");

  const scoreValueEl =
    document.getElementById("scoreValue");

  const timeValueEl =
    document.getElementById("timeValue");

  const accuracyValueEl =
    document.getElementById("accuracyValue");

  const comboValueEl =
    document.getElementById("comboValue");

  let judgementTimeout = null;

  function getNoteHighwayHeight() {
    return noteHighwayEl.clientHeight;
  }

  function showGame() {
    startBtn.classList.add("hidden");
    gameArea.classList.remove("hidden");
  }

  function showTargetNote(note) {
    targetNoteEl.textContent = note;
  }

  function showFeedback(message) {
    feedbackEl.textContent = message;
  }

  function clearFeedback() {
    feedbackEl.textContent = "";
  }

  function showJudgement(message) {
    judgementEl.textContent = message;

    clearTimeout(judgementTimeout);

    judgementTimeout =
      window.setTimeout(() => {
        judgementEl.textContent = "";
      }, 700);
  }

  function clearJudgement() {
    clearTimeout(judgementTimeout);

    judgementTimeout = null;
    judgementEl.textContent = "";
  }

  function updateScoreboard({
    score,
    timeLeft,
    accuracy,
    combo
  }) {
    scoreValueEl.textContent = score;
    timeValueEl.textContent =
      `${timeLeft}s`;
    accuracyValueEl.textContent =
      `${accuracy}%`;
    comboValueEl.textContent =
      `×${combo}`;
  }

  function createFallingNote(noteName) {
    const noteEl =
      document.createElement("div");

    noteEl.className = "falling-note";

    noteEl.textContent =
      noteName.replace("#", "♯");

    /*
     * Find the actual piano key that
     * corresponds to this falling note.
     */
    const matchingKey =
      document.querySelector(
        `.key[data-note="${noteName}"]`
      );

    if (!matchingKey) {
      console.error(
        `No piano key found for falling note: ${noteName}`
      );

      return null;
    }

    noteHighwayEl.appendChild(noteEl);

    /*
     * Measure the highway and the actual
     * rendered piano key.
     */
    const highwayRect =
      noteHighwayEl.getBoundingClientRect();

    const keyRect =
      matchingKey.getBoundingClientRect();

    /*
     * Find the horizontal centre of the
     * piano key.
     */
    const keyCentre =
      keyRect.left +
      keyRect.width / 2;

    /*
     * Convert the screen coordinate into
     * a coordinate relative to the highway.
     */
    const horizontalPosition =
      keyCentre -
      highwayRect.left;

    noteEl.style.left =
      `${horizontalPosition}px`;

    function setPosition(y) {
      noteEl.style.top =
        `${y}px`;
    }

    /*
     * IMPORTANT:
     * game.js needs the actual height of
     * the falling note to calculate where
     * its bottom edge reaches the hit line.
     */
    function getHeight() {
      return noteEl.offsetHeight;
    }

    function remove() {
      noteEl.remove();
    }

    return {
      setPosition,
      getHeight,
      remove
    };
  }

  function showGameOver({
    score,
    perfect,
    good,
    miss,
    accuracy,
    maxCombo,
    averageTimingError
  }) {
    clearJudgement();

    targetNoteEl.textContent =
      "Game Over";

    feedbackEl.innerHTML = `
      Final Score: ${score}<br>
      Perfect: ${perfect}<br>
      Good: ${good}<br>
      Miss: ${miss}<br>
      Accuracy: ${accuracy}%<br>
      Highest Combo: ×${maxCombo}<br>
      Average Timing Error: ${averageTimingError}s
    `;

    startBtn.textContent =
      "Play Again";

    startBtn.classList.remove(
      "hidden"
    );
  }

  return {
    showGame,
    showTargetNote,
    showFeedback,
    clearFeedback,
    showJudgement,
    clearJudgement,
    updateScoreboard,
    createFallingNote,
    getNoteHighwayHeight,
    showGameOver
  };
}