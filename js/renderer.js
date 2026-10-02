/*
 * Fallback tile height, matching the
 * CSS, when game.js does not set one.
 */
const MAX_TILE_HEIGHT = 40;


export function createRenderer() {
  const noteHighwayEl =
    document.getElementById("noteHighway");

  const startBtn =
    document.getElementById("startBtn");

  const gameArea =
    document.getElementById("gameArea");

  const setupScreen =
    document.getElementById("setupScreen");

  const welcomeScreen =
    document.getElementById("welcomeScreen");

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
   * =============================
   * GAME OVER ELEMENTS
   * =============================
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

  const finalHoldsEl =
    document.getElementById(
      "finalHolds"
    );

  const playAgainBtn =
    document.getElementById(
      "playAgainBtn"
    );

  const resultsLeaderboardBtn =
    document.getElementById(
      "resultsLeaderboardBtn"
    );

  const offsetSuggestionEl =
    document.getElementById(
      "offsetSuggestion"
    );

  const offsetSuggestionTextEl =
    document.getElementById(
      "offsetSuggestionText"
    );

  const applyOffsetBtn =
    document.getElementById(
      "applyOffsetBtn"
    );


  /*
   * =============================
   * LEADERBOARD ELEMENTS
   * =============================
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


  /*
   * Horizontal centre of every piano
   * key, relative to the note highway.
   *
   * Measured once per game instead of
   * per falling tile: reading layout
   * while tiles are moving is slow.
   */
  let keyPositions = null;


  function measureKeyPositions() {
    if (!noteHighwayEl) {
      return;
    }

    const highwayLeft =
      noteHighwayEl
        .getBoundingClientRect()
        .left;

    keyPositions = new Map();

    document
      .querySelectorAll(".key")
      .forEach(
        (key) => {
          const keyRect =
            key.getBoundingClientRect();

          keyPositions.set(
            key.dataset.note,
            keyRect.left +
              keyRect.width / 2 -
              highwayLeft
          );
        }
      );
  }


  /*
   * =============================
   * GAME DISPLAY
   * =============================
   */

  function getNoteHighwayHeight() {
    if (!noteHighwayEl) {
      return 0;
    }

    return noteHighwayEl.clientHeight;
  }


  /*
   * Swaps the welcome screen for the
   * song, difficulty and name controls.
   */
  function showSetup() {
    if (welcomeScreen) {
      welcomeScreen.classList.add(
        "hidden"
      );
    }

    if (setupScreen) {
      setupScreen.classList.remove(
        "hidden"
      );
    }
  }


  function showGame() {
    closeGameOver();
    closeLeaderboard();

    if (setupScreen) {
      setupScreen.classList.add(
        "hidden"
      );
    }

    if (startBtn) {
      startBtn.classList.add(
        "hidden"
      );
    }

    if (gameArea) {
      gameArea.classList.remove(
        "hidden"
      );
    }
  }


  function showTargetNote(note) {
    if (!targetNoteEl) {
      return;
    }

    targetNoteEl.textContent =
      note;
  }


  function showFeedback(message) {
    if (!feedbackEl) {
      return;
    }

    feedbackEl.textContent =
      message;
  }


  function clearFeedback() {
    if (!feedbackEl) {
      return;
    }

    feedbackEl.textContent =
      "";
  }


  /*
   * Shows temporary timing feedback
   * such as Perfect, Good or Miss.
   */
  function showJudgement(message) {
    if (!judgementEl) {
      return;
    }

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

    if (judgementEl) {
      judgementEl.textContent =
        "";
    }
  }


  /*
   * =============================
   * SCOREBOARD
   * =============================
   */

  function updateScoreboard({
    score,
    timeLeft,
    accuracy,
    combo
  }) {
    if (scoreValueEl) {
      scoreValueEl.textContent =
        score;
    }

    if (timeValueEl) {
      timeValueEl.textContent =
        `${timeLeft}s`;
    }

    if (accuracyValueEl) {
      accuracyValueEl.textContent =
        `${accuracy}%`;
    }

    if (comboValueEl) {
      comboValueEl.textContent =
        `×${combo}`;
    }
  }


  /*
   * =============================
   * FALLING NOTES
   * =============================
   *
   * Creates one falling note and
   * horizontally aligns it with the
   * centre of its corresponding
   * piano key.
   */

  function createFallingNote(
    noteName,
    height,
    isLongNote
  ) {
    if (!noteHighwayEl) {
      console.error(
        "Note highway element was not found."
      );

      return null;
    }


    if (!keyPositions) {
      measureKeyPositions();
    }


    const horizontalPosition =
      keyPositions.get(noteName);


    if (horizontalPosition === undefined) {
      console.error(
        `No piano key found for falling note: ${noteName}`
      );

      return null;
    }


    /*
     * Create the visual falling note.
     */
    const noteEl =
      document.createElement(
        "div"
      );

    noteEl.className =
      "falling-note";


    /*
     * Long notes are drawn as a bar with
     * a tail, so it is clear the key stays
     * down until the whole tile has gone
     * past the line.
     */
    if (isLongNote) {
      noteEl.classList.add("hold");
    }


    /*
     * Shorter tiles when notes are close
     * together (set by game.js).
     */
    if (height) {
      noteEl.style.minHeight =
        `${height}px`;

      noteEl.style.height =
        `${height}px`;
    }


    /*
     * =============================
     * NOTE COLOUR SYSTEM
     * =============================
     *
     * Colour is based on pitch class.
     * This means the same musical
     * pitch receives the same colour
     * in octave 4 and octave 5.
     */

    const pitchClass =
      noteName.replace(
        /\d/g,
        ""
      );


    const noteColourClasses = {
      C: "note-blue",
      "C#": "note-blue",

      D: "note-cyan",
      "D#": "note-cyan",

      E: "note-green",

      F: "note-purple",
      "F#": "note-purple",

      G: "note-pink",
      "G#": "note-pink",

      A: "note-orange",
      "A#": "note-orange",

      B: "note-yellow"
    };


    const colourClass =
      noteColourClasses[
        pitchClass
      ];


    if (colourClass) {
      noteEl.classList.add(
        colourClass
      );
    }


    /*
     * Display sharps using the
     * musical sharp symbol.
     */
    noteEl.textContent =
      noteName.replace(
        "#",
        "♯"
      );


    noteEl.style.left =
      `${horizontalPosition}px`;


    noteHighwayEl.appendChild(
      noteEl
    );


    /*
     * game.js controls vertical
     * movement using these methods.
     *
     * Moving with transform keeps the
     * browser from re-laying out the
     * page on every frame.
     */

    function setPosition(y) {
      noteEl.style.transform =
        `translate3d(-50%, ${y}px, 0)`;
    }


    function getHeight() {
      return height || MAX_TILE_HEIGHT;
    }


    /*
     * Highlights a long note while the
     * player is holding its key.
     */
    function setHolding(holding) {
      noteEl.classList.toggle(
        "holding",
        holding
      );
    }


    function remove() {
      noteEl.remove();
    }


    return {
      setPosition,
      setHolding,
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
    title
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
      `${title} Rankings`;


    /*
     * Empty leaderboard.
     */
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


    /*
     * Populate leaderboard rows.
     */
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
    averageTimingError,
    holdsCompleted,
    holdsBroken,
    offsetSuggestion
  }) {
    clearJudgement();
    clearFeedback();


    if (!gameOverModalEl) {
      console.error(
        "Game Over modal was not found in index.html."
      );

      return;
    }


    /*
     * =============================
     * STAR RATING
     * =============================
     */

    let stars =
      "⭐";

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


    /*
     * Populate result information.
     */

    if (resultStarsEl) {
      resultStarsEl.textContent =
        stars;
    }

    if (resultMessageEl) {
      resultMessageEl.textContent =
        performanceMessage;
    }

    if (finalScoreEl) {
      finalScoreEl.textContent =
        score;
    }

    if (finalPerfectEl) {
      finalPerfectEl.textContent =
        perfect;
    }

    if (finalGoodEl) {
      finalGoodEl.textContent =
        good;
    }

    if (finalMissEl) {
      finalMissEl.textContent =
        miss;
    }

    if (finalAccuracyEl) {
      finalAccuracyEl.textContent =
        `${accuracy}%`;
    }

    if (finalComboEl) {
      finalComboEl.textContent =
        `×${maxCombo}`;
    }

    if (finalTimingErrorEl) {
      finalTimingErrorEl.textContent =
        `${averageTimingError}s`;
    }


    if (finalHoldsEl) {
      finalHoldsEl.textContent =
        `${holdsCompleted} / ${
          holdsCompleted + holdsBroken
        }`;
    }


    /*
     * Timing tip, e.g. "You hit 80 ms
     * late on average", with a button
     * that corrects the audio offset.
     */
    if (offsetSuggestionEl) {
      offsetSuggestionEl.classList.toggle(
        "hidden",
        !offsetSuggestion
      );
    }


    if (
      offsetSuggestion &&
      offsetSuggestionTextEl &&
      applyOffsetBtn
    ) {
      offsetSuggestionTextEl.textContent =
        offsetSuggestion.message;

      applyOffsetBtn.onclick =
        () => {
          offsetSuggestion.apply();

          offsetSuggestionTextEl.textContent =
            "Timing adjusted. Play again to try it.";

          applyOffsetBtn.onclick =
            null;
        };
    }


    /*
     * Bring back the song and difficulty
     * controls for the next game.
     */
    showSetup();

    if (startBtn) {
      startBtn.classList.remove(
        "hidden"
      );
    }


    /*
     * Display Game Over modal.
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
   * Main View Leaderboard button.
   */
  if (leaderboardBtn) {
    leaderboardBtn
      .addEventListener(
        "click",
        openLeaderboard
      );
  }


  /*
   * Close leaderboard button.
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
   *
   * Reuses the existing Start Game
   * behaviour from script.js.
   */
  if (playAgainBtn) {
    playAgainBtn
      .addEventListener(
        "click",
        () => {
          closeGameOver();

          if (startBtn) {
            startBtn.click();
          }
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


  /*
   * =============================
   * PUBLIC RENDERER METHODS
   * =============================
   */

  return {
    measureKeyPositions,
    showSetup,
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