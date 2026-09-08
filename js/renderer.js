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


  /*
   * Game Over modal elements.
   */
  const gameOverModalEl =
    document.getElementById(
      "gameOverModal"
    );

  const resultStarsEl =
    document.getElementById(
      "resultStars"
    );

  const resultMessageEl =
    document.getElementById(
      "resultMessage"
    );

  const finalScoreEl =
    document.getElementById(
      "finalScore"
    );

  const finalPerfectEl =
    document.getElementById(
      "finalPerfect"
    );

  const finalGoodEl =
    document.getElementById(
      "finalGood"
    );

  const finalMissEl =
    document.getElementById(
      "finalMiss"
    );

  const finalAccuracyEl =
    document.getElementById(
      "finalAccuracy"
    );

  const finalComboEl =
    document.getElementById(
      "finalCombo"
    );

  const finalTimingErrorEl =
    document.getElementById(
      "finalTimingError"
    );

  const playAgainBtn =
    document.getElementById(
      "playAgainBtn"
    );

  const resultsLeaderboardBtn =
    document.getElementById(
      "resultsLeaderboardBtn"
    );


  /*
   * Leaderboard elements.
   */
  const leaderboardBodyEl =
    document.getElementById(
      "leaderboardBody"
    );

  const leaderboardDifficultyEl =
    document.getElementById(
      "leaderboardDifficulty"
    );

  const leaderboardSectionEl =
    document.getElementById(
      "leaderboardSection"
    );

  const leaderboardBtn =
    document.getElementById(
      "leaderboardBtn"
    );

  const closeLeaderboardBtn =
    document.getElementById(
      "closeLeaderboardBtn"
    );


  let judgementTimeout = null;


  function getNoteHighwayHeight() {
    return noteHighwayEl.clientHeight;
  }


  /*
   * Show the main game.
   */
  function showGame() {
    /*
     * Make sure any previous result
     * modal is closed before replaying.
     */
    closeGameOver();
    closeLeaderboard();

    startBtn.classList.add(
      "hidden"
    );

    gameArea.classList.remove(
      "hidden"
    );
  }


  function showTargetNote(note) {
    targetNoteEl.textContent =
      note;
  }


  function showFeedback(message) {
    feedbackEl.textContent =
      message;
  }


  function clearFeedback() {
    feedbackEl.textContent =
      "";
  }


  /*
   * Shows temporary timing feedback
   * such as Perfect, Good or Miss.
   */
  function showJudgement(message) {
    judgementEl.textContent =
      message;

    clearTimeout(
      judgementTimeout
    );

    judgementTimeout =
      window.setTimeout(() => {
        judgementEl.textContent =
          "";
      }, 700);
  }


  function clearJudgement() {
    clearTimeout(
      judgementTimeout
    );

    judgementTimeout =
      null;

    judgementEl.textContent =
      "";
  }


  /*
   * Updates the live scoreboard.
   */
  function updateScoreboard({
    score,
    timeLeft,
    accuracy,
    combo
  }) {
    scoreValueEl.textContent =
      score;

    timeValueEl.textContent =
      `${timeLeft}s`;

    accuracyValueEl.textContent =
      `${accuracy}%`;

    comboValueEl.textContent =
      `×${combo}`;
  }


  /*
   * Creates one falling note and aligns
   * it horizontally with its piano key.
   */
  function createFallingNote(
    noteName
  ) {
    const noteEl =
      document.createElement(
        "div"
      );

    noteEl.className =
      "falling-note";

    noteEl.textContent =
      noteName.replace(
        "#",
        "♯"
      );

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

    noteHighwayEl.appendChild(
      noteEl
    );

    const highwayRect =
      noteHighwayEl
        .getBoundingClientRect();

    const keyRect =
      matchingKey
        .getBoundingClientRect();

    const keyCentre =
      keyRect.left +
      keyRect.width / 2;

    const horizontalPosition =
      keyCentre -
      highwayRect.left;

    noteEl.style.left =
      `${horizontalPosition}px`;


    function setPosition(y) {
      noteEl.style.top =
        `${y}px`;
    }


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


  /*
   * =============================
   * LEADERBOARD
   * =============================
   */


  function openLeaderboard() {
    if (!leaderboardSectionEl) {
      return;
    }

    leaderboardSectionEl
      .classList.remove(
        "hidden"
      );
  }


  function closeLeaderboard() {
    if (!leaderboardSectionEl) {
      return;
    }

    leaderboardSectionEl
      .classList.add(
        "hidden"
      );
  }


  function showLeaderboard(
    entries,
    difficulty
  ) {
    if (
      !leaderboardBodyEl ||
      !leaderboardDifficultyEl
    ) {
      console.error(
        "Leaderboard elements were not found in index.html."
      );

      return;
    }

    leaderboardBodyEl.textContent =
      "";

    leaderboardDifficultyEl.textContent =
      `${difficulty} Rankings`;


    if (entries.length === 0) {
      const row =
        document.createElement(
          "tr"
        );

      const cell =
        document.createElement(
          "td"
        );

      cell.colSpan = 5;

      cell.textContent =
        "No scores yet. Be the first!";

      row.appendChild(
        cell
      );

      leaderboardBodyEl
        .appendChild(
          row
        );

      return;
    }


    entries.forEach(
      (entry, index) => {
        const row =
          document.createElement(
            "tr"
          );

        const rankCell =
          document.createElement(
            "td"
          );

        const playerCell =
          document.createElement(
            "td"
          );

        const scoreCell =
          document.createElement(
            "td"
          );

        const accuracyCell =
          document.createElement(
            "td"
          );

        const comboCell =
          document.createElement(
            "td"
          );


        rankCell.textContent =
          index + 1;

        playerCell.textContent =
          entry.playerName;

        scoreCell.textContent =
          entry.score;

        accuracyCell.textContent =
          `${entry.accuracy}%`;

        comboCell.textContent =
          `×${entry.maxCombo}`;


        row.append(
          rankCell,
          playerCell,
          scoreCell,
          accuracyCell,
          comboCell
        );

        leaderboardBodyEl
          .appendChild(
            row
          );
      }
    );
  }


  /*
   * =============================
   * GAME OVER MODAL
   * =============================
   */


  function closeGameOver() {
    if (!gameOverModalEl) {
      return;
    }

    gameOverModalEl
      .classList.add(
        "hidden"
      );
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

    /*
     * Live gameplay feedback should
     * not remain underneath the modal.
     */
    clearFeedback();


    /*
     * Calculate star rating.
     */
    let stars = "⭐";

    let performanceMessage =
      "Keep practising!";


    if (accuracy >= 85) {
      stars =
        "⭐⭐⭐";

      performanceMessage =
        "Excellent Performance!";
    } else if (
      accuracy >= 60
    ) {
      stars =
        "⭐⭐";

      performanceMessage =
        "Great Effort!";
    }


    resultStarsEl.textContent =
      stars;

    resultMessageEl.textContent =
      performanceMessage;

    finalScoreEl.textContent =
      score;

    finalPerfectEl.textContent =
      perfect;

    finalGoodEl.textContent =
      good;

    finalMissEl.textContent =
      miss;

    finalAccuracyEl.textContent =
      `${accuracy}%`;

    finalComboEl.textContent =
      `×${maxCombo}`;

    finalTimingErrorEl.textContent =
      `${averageTimingError}s`;


    /*
     * Show the results modal.
     */
    gameOverModalEl
      .classList.remove(
        "hidden"
      );
  }


  /*
   * =============================
   * BUTTON EVENTS
   * =============================
   */


  /*
   * Normal View Leaderboard button.
   */
  if (leaderboardBtn) {
    leaderboardBtn
      .addEventListener(
        "click",
        openLeaderboard
      );
  }


  /*
   * Leaderboard close button.
   */
  if (closeLeaderboardBtn) {
    closeLeaderboardBtn
      .addEventListener(
        "click",
        closeLeaderboard
      );
  }


  /*
   * Play Again button inside
   * the Game Over modal.
   */
  if (playAgainBtn) {
    playAgainBtn
      .addEventListener(
        "click",
        () => {
          closeGameOver();

          /*
           * Reuse the existing Start Game
           * button behaviour from script.js.
           */
          startBtn.click();
        }
      );
  }


  /*
   * View Leaderboard button inside
   * the Game Over modal.
   */
  if (resultsLeaderboardBtn) {
    resultsLeaderboardBtn
      .addEventListener(
        "click",
        () => {
          closeGameOver();

          openLeaderboard();
        }
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
    showLeaderboard,
    showGameOver
  };
}