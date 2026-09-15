import {
  saveLeaderboardEntry,
  getLeaderboard
} from "./leaderboard.js";

import {
  playNote,
  loadSong,
  startSong,
  pauseSong,
  resumeSong,
  stopSong,
  getSongTime
} from "./audio.js";

import {
  createRenderer
} from "./renderer.js";

import {
  getSongById
} from "./notes.js";

import {
  createScoreTracker
} from "./scoring.js";

import {
  calculateTimingError,
  calculateJudgement
} from "./timing.js";


const NOTE_FALL_DURATION = 2500;
const SONG_END_BUFFER = 1000;


const keys =
  document.querySelectorAll(
    ".key"
  );


const pauseBtn =
  document.getElementById(
    "pauseBtn"
  );


const scoreTracker =
  createScoreTracker();


const renderer =
  createRenderer();


let gameActive = false;

let gamePaused = false;

let animationFrameId =
  null;


let nextNoteIndex = 0;

let activeNotes = [];


let songDuration = 0;

let timeLeft = 0;


let selectedDifficulty =
  "easy";

let selectedSongId =
  "outbyte";


let currentSong =
  null;

let currentSongNotes = [];


/*
 * Initialise keyboard controls,
 * difficulty controls and leaderboard.
 */
export function initialiseGame() {
  keys.forEach(
    (key) => {
      key.addEventListener(
        "pointerdown",
        handleKeyPress
      );
    }
  );


  /*
   * Connect the Pause / Resume button
   * to the game.
   */
  if (pauseBtn) {
    pauseBtn.addEventListener(
      "click",
      togglePauseGame
    );
  }


  window.addEventListener(
    "resize",
    positionBlackKeys
  );


  const difficultyOptions =
    document.querySelectorAll(
      'input[name="difficulty"]'
    );


  difficultyOptions.forEach(
    (option) => {
      option.addEventListener(
        "change",
        () => {
          const difficulty =
            getSelectedDifficulty();


          renderer.showLeaderboard(
            getLeaderboard(
              difficulty
            ),

            formatDifficulty(
              difficulty
            )
          );
        }
      );
    }
  );


  /*
   * Show the Easy leaderboard
   * when the page first loads.
   */
  renderer.showLeaderboard(
    getLeaderboard(
      "easy"
    ),
    "Easy"
  );
}


/*
 * Converts a musical beat number
 * into milliseconds from the
 * beginning of the currently
 * selected track.
 *
 * Each song can have its own BPM
 * and timing offset.
 */
function beatToMilliseconds(
  beat
) {
  if (!currentSong) {
    return 0;
  }


  const secondsPerBeat =
    60 /
    currentSong.bpm;


  const hitTimeInSeconds =
    currentSong.offset +
    (beat - 1) *
      secondsPerBeat;


  return (
    hitTimeInSeconds *
    1000
  );
}


/*
 * Reads the song selected by
 * the player.
 */
function getSelectedSongId() {
  const selectedOption =
    document.querySelector(
      'input[name="song"]:checked'
    );


  if (!selectedOption) {
    return "outbyte";
  }


  return selectedOption.value;
}


/*
 * Reads the difficulty selected
 * by the player.
 */
function getSelectedDifficulty() {
  const selectedOption =
    document.querySelector(
      'input[name="difficulty"]:checked'
    );


  if (!selectedOption) {
    return "easy";
  }


  return selectedOption.value;
}


/*
 * Reads the player's name.
 */
function getPlayerName() {
  const playerNameInput =
    document.getElementById(
      "playerName"
    );


  if (!playerNameInput) {
    return "";
  }


  return playerNameInput
    .value
    .trim();
}


/*
 * Converts:
 *
 * easy -> Easy
 * medium -> Medium
 * hard -> Hard
 */
function formatDifficulty(
  difficulty
) {
  return (
    difficulty
      .charAt(0)
      .toUpperCase() +
    difficulty.slice(1)
  );
}


/*
 * Starts a new game.
 */
export async function startGame() {
  const playerName =
    getPlayerName();


  if (!playerName) {
    alert(
      "Please enter your name before starting the game."
    );

    return;
  }


  stopCurrentGame();


  scoreTracker.reset();


  nextNoteIndex = 0;

  activeNotes = [];


  /*
   * Read the player's selected song.
   */
  selectedSongId =
    getSelectedSongId();


  currentSong =
    getSongById(
      selectedSongId
    );


  if (!currentSong) {
    console.error(
      `Song not found: ${selectedSongId}`
    );

    return;
  }


  /*
   * Read the player's selected
   * difficulty.
   */
  selectedDifficulty =
    getSelectedDifficulty();


  /*
   * Retrieve the appropriate chart
   * from the selected song.
   */
  currentSongNotes =
    currentSong
      .difficulties[
        selectedDifficulty
      ];


  /*
   * Shadows Behind Neon and
   * Galactic Spiritual Journey
   * currently have empty charts.
   *
   * Do not start their audio until
   * those charts have been created.
   */
  if (
    !currentSongNotes ||
    currentSongNotes.length === 0
  ) {
    console.warn(
      `No ${selectedDifficulty} chart has been created for ${currentSong.title} yet.`
    );


    alert(
      `${currentSong.title} is not ready to play yet.`
    );


    return;
  }


  /*
   * Load the backing track belonging
   * to the selected song.
   *
   * audio.js will avoid unnecessarily
   * loading the same file again.
   */
  try {
    await loadSong(
      currentSong.audioPath
    );
  } catch (error) {
    console.error(
      "Could not load selected song:",
      error
    );


    alert(
      "The selected song could not be loaded."
    );


    return;
  }


  /*
   * The game only becomes active once
   * the chart and audio are ready.
   */
  gameActive = true;

  gamePaused = false;

  updatePauseButton();


  /*
   * Determine the game duration from
   * the final note in this song's chart.
   */
  const finalSongNote =
    currentSongNotes[
      currentSongNotes.length -
      1
    ];


  songDuration =
    beatToMilliseconds(
      finalSongNote.beat
    ) +
    SONG_END_BUFFER;


  timeLeft =
    Math.ceil(
      songDuration /
      1000
    );


  renderer.showGame();

  renderer.clearFeedback();

  renderer.clearJudgement();


  const formattedDifficulty =
    formatDifficulty(
      selectedDifficulty
    );


  /*
   * Example:
   *
   * Outbyte — Easy
   *
   * Later:
   *
   * Shadows Behind Neon — Medium
   */
  renderer.showTargetNote(
    `${currentSong.title} — ${formattedDifficulty}`
  );


  /*
   * The keyboard was hidden before
   * the game started, so position
   * the black keys once it is visible.
   */
  positionBlackKeys();


  updateStats();


  /*
   * Start the backing track.
   *
   * The backing track's audio clock
   * becomes the master clock for the
   * scheduler and falling notes.
   */
  startSong();


  animationFrameId =
    requestAnimationFrame(
      gameLoop
    );
}


/*
 * Positions each black key
 * between its neighbouring
 * white keys.
 */
function positionBlackKeys() {
  const keyboard =
    document.getElementById(
      "keyboard"
    );


  if (!keyboard) {
    return;
  }


  const keyboardRect =
    keyboard
      .getBoundingClientRect();


  if (
    keyboardRect.width === 0
  ) {
    return;
  }


  const blackKeyMap = {
    "C#4": [
      "C4",
      "D4"
    ],

    "D#4": [
      "D4",
      "E4"
    ],

    "F#4": [
      "F4",
      "G4"
    ],

    "G#4": [
      "G4",
      "A4"
    ],

    "A#4": [
      "A4",
      "B4"
    ],

    "C#5": [
      "C5",
      "D5"
    ],

    "D#5": [
      "D5",
      "E5"
    ],

    "F#5": [
      "F5",
      "G5"
    ],

    "G#5": [
      "G5",
      "A5"
    ],

    "A#5": [
      "A5",
      "B5"
    ]
  };


  Object.entries(
    blackKeyMap
  ).forEach(
    ([
      blackNote,
      neighbouringNotes
    ]) => {
      const [
        leftNote,
        rightNote
      ] =
        neighbouringNotes;


      const leftKey =
        keyboard.querySelector(
          `.white-key[data-note="${leftNote}"]`
        );


      const rightKey =
        keyboard.querySelector(
          `.white-key[data-note="${rightNote}"]`
        );


      const blackKey =
        keyboard.querySelector(
          `.black-key[data-note="${blackNote}"]`
        );


      if (
        !leftKey ||
        !rightKey ||
        !blackKey
      ) {
        return;
      }


      const leftRect =
        leftKey
          .getBoundingClientRect();


      const rightRect =
        rightKey
          .getBoundingClientRect();


      const boundary =
        (
          leftRect.right +
          rightRect.left
        ) /
        2;


      const relativeBoundary =
        boundary -
        keyboardRect.left;


      const blackKeyWidth =
        blackKey
          .getBoundingClientRect()
          .width;


      blackKey.style.left =
        `${
          relativeBoundary -
          blackKeyWidth / 2
        }px`;
    }
  );
}


/*
 * Main animation loop.
 *
 * The backing track's audio clock
 * is the master gameplay clock.
 */
function gameLoop() {
  /*
   * Stop the animation loop while
   * the game is inactive or paused.
   */
  if (
    !gameActive ||
    gamePaused
  ) {
    return;
  }


  const elapsedTime =
    getSongTime() *
    1000;


  spawnUpcomingNotes(
    elapsedTime
  );


  updateActiveNotes(
    elapsedTime
  );


  updateSongTimer(
    elapsedTime
  );


  if (
    elapsedTime >=
      songDuration &&
    activeNotes.length === 0
  ) {
    endGame();

    return;
  }


  animationFrameId =
    requestAnimationFrame(
      gameLoop
    );
}


/*
 * Spawns notes from the currently
 * selected song and difficulty chart.
 */
function spawnUpcomingNotes(
  elapsedTime
) {
  while (
    nextNoteIndex <
    currentSongNotes.length
  ) {
    const songNote =
      currentSongNotes[
        nextNoteIndex
      ];


    const scheduledHitTime =
      beatToMilliseconds(
        songNote.beat
      );


    const spawnTime =
      scheduledHitTime -
      NOTE_FALL_DURATION;


    if (
      elapsedTime <
      spawnTime
    ) {
      break;
    }


    spawnSongNote(
      songNote,
      scheduledHitTime,
      spawnTime
    );


    nextNoteIndex += 1;
  }
}


/*
 * Creates a visual falling note
 * and adds it to the active list.
 */
function spawnSongNote(
  songNote,
  scheduledHitTime,
  spawnTime
) {
  const visualNote =
    renderer
      .createFallingNote(
        songNote.note
      );


  if (!visualNote) {
    console.error(
      `Could not render song note: ${songNote.note}`
    );


    return;
  }


  visualNote.setPosition(
    0
  );


  activeNotes.push({
    noteName:
      songNote.note,

    scheduledHitTime,

    spawnTime,

    visualNote,

    judged: false
  });
}


/*
 * Updates the position and timing
 * state of every active falling note.
 */
function updateActiveNotes(
  elapsedTime
) {
  const highwayHeight =
    renderer
      .getNoteHighwayHeight();


  activeNotes.forEach(
    (activeNote) => {
      if (
        activeNote.judged
      ) {
        return;
      }


      const noteHeight =
        activeNote
          .visualNote
          .getHeight();


      const targetY =
        highwayHeight -
        noteHeight;


      const noteElapsedTime =
        elapsedTime -
        activeNote
          .spawnTime;


      const progress =
        Math.min(
          Math.max(
            noteElapsedTime /
              NOTE_FALL_DURATION,
            0
          ),
          1
        );


      const yPosition =
        progress *
        targetY;


      activeNote
        .visualNote
        .setPosition(
          yPosition
        );


      const timingError =
        elapsedTime -
        activeNote
          .scheduledHitTime;


      const judgement =
        calculateJudgement(
          timingError
        );


      /*
       * Automatically register a Miss
       * once the accepted late timing
       * window has passed.
       */
      if (
        timingError > 0 &&
        judgement === "Miss"
      ) {
        registerMiss(
          activeNote,
          "Note missed. Combo lost."
        );
      }
    }
  );


  removeJudgedNotes();
}


/*
 * Handles piano key presses.
 */
function handleKeyPress(
  event
) {
  /*
   * Keyboard input is ignored when
   * the game is inactive or paused.
   *
   * This prevents players from
   * changing their score during Pause.
   */
  if (
    !gameActive ||
    gamePaused
  ) {
    return;
  }


  const selectedNote =
    event.currentTarget
      .dataset.note;


  if (!selectedNote) {
    return;
  }


  playNote(
    selectedNote
  );


  const elapsedTime =
    getSongTime() *
    1000;


  const matchingNote =
    findClosestMatchingNote(
      selectedNote,
      elapsedTime
    );


  /*
   * The player pressed a key for
   * which there is no active
   * matching note.
   */
  if (!matchingNote) {
    scoreTracker
      .recordMiss();


    renderer.showJudgement(
      "Wrong Key"
    );


    renderer.showFeedback(
      "No matching note. Combo lost."
    );


    updateStats();


    return;
  }


  const timingError =
    calculateTimingError(
      elapsedTime,
      matchingNote
        .scheduledHitTime
    );


  const judgement =
    calculateJudgement(
      timingError
    );


  /*
   * Perfect hit.
   */
  if (
    judgement ===
    "Perfect"
  ) {
    matchingNote.judged =
      true;


    scoreTracker
      .recordPerfect(
        timingError
      );


    renderer.showJudgement(
      "Perfect"
    );


    renderer.showFeedback(
      formatTimingFeedback(
        timingError
      )
    );


    updateStats();


    return;
  }


  /*
   * Good hit.
   */
  if (
    judgement ===
    "Good"
  ) {
    matchingNote.judged =
      true;


    scoreTracker
      .recordGood(
        timingError
      );


    renderer.showJudgement(
      "Good"
    );


    renderer.showFeedback(
      formatTimingFeedback(
        timingError
      )
    );


    updateStats();


    return;
  }


  /*
   * Matching note was pressed outside
   * the accepted timing window.
   */
  registerMiss(
    matchingNote,

    timingError < 0
      ? "Too early. Combo lost."
      : "Too late. Combo lost."
  );
}


/*
 * Finds the closest active note
 * matching the piano key pressed.
 */
function findClosestMatchingNote(
  selectedNote,
  elapsedTime
) {
  const candidates =
    activeNotes.filter(
      (activeNote) =>
        !activeNote.judged &&
        activeNote.noteName ===
          selectedNote
    );


  if (
    candidates.length === 0
  ) {
    return null;
  }


  candidates.sort(
    (a, b) => {
      const differenceA =
        Math.abs(
          elapsedTime -
          a.scheduledHitTime
        );


      const differenceB =
        Math.abs(
          elapsedTime -
          b.scheduledHitTime
        );


      return (
        differenceA -
        differenceB
      );
    }
  );


  return candidates[0];
}


/*
 * Registers a Miss for a
 * specific falling note.
 */
function registerMiss(
  activeNote,
  feedbackMessage
) {
  if (
    activeNote.judged
  ) {
    return;
  }


  activeNote.judged =
    true;


  scoreTracker
    .recordMiss();


  renderer.showJudgement(
    "Miss"
  );


  renderer.showFeedback(
    feedbackMessage
  );


  updateStats();
}


/*
 * Removes notes that have already
 * received a final judgement.
 */
function removeJudgedNotes() {
  activeNotes =
    activeNotes.filter(
      (activeNote) => {
        if (
          !activeNote.judged
        ) {
          return true;
        }


        activeNote
          .visualNote
          .remove();


        return false;
      }
    );
}


/*
 * Updates the countdown timer.
 */
function updateSongTimer(
  elapsedTime
) {
  const remainingTime =
    Math.max(
      songDuration -
        elapsedTime,
      0
    );


  const newTimeLeft =
    Math.ceil(
      remainingTime /
      1000
    );


  if (
    newTimeLeft !==
    timeLeft
  ) {
    timeLeft =
      newTimeLeft;


    updateStats();
  }
}


/*
 * Creates readable timing
 * feedback.
 */
function formatTimingFeedback(
  timingError
) {
  const absoluteError =
    Math.round(
      Math.abs(
        timingError
      )
    );


  if (
    timingError < 0
  ) {
    return (
      `${absoluteError} ms early`
    );
  }


  if (
    timingError > 0
  ) {
    return (
      `${absoluteError} ms late`
    );
  }


  return "Exact timing";
}


/*
 * Updates the live scoreboard.
 */
function updateStats() {
  const stats =
    scoreTracker.getStats();


  renderer.updateScoreboard({
    score:
      stats.score,

    timeLeft,

    accuracy:
      stats.accuracy,

    combo:
      stats.combo
  });
}


/*
 * Toggles the game between
 * Pause and Resume.
 */
function togglePauseGame() {
  if (!gameActive) {
    return;
  }


  if (gamePaused) {
    resumeGame();
  } else {
    pauseGame();
  }
}


/*
 * Pauses the entire game.
 *
 * The backing track is paused first.
 * This freezes the audio-based master
 * clock used by the game scheduler.
 *
 * The animation frame is then cancelled
 * so the falling notes and countdown
 * remain frozen on screen.
 */
function pauseGame() {
  if (
    !gameActive ||
    gamePaused
  ) {
    return;
  }


  pauseSong();


  gamePaused = true;


  if (
    animationFrameId !==
    null
  ) {
    cancelAnimationFrame(
      animationFrameId
    );
  }


  animationFrameId =
    null;


  updatePauseButton();


  renderer.showJudgement(
    "Paused"
  );


  renderer.showFeedback(
    "Game paused. Press Resume to continue."
  );
}


/*
 * Resumes the entire game from
 * exactly the same position.
 *
 * audio.js resumes the backing track
 * from its saved playback position.
 *
 * The animation loop then continues
 * using the resumed audio clock.
 */
function resumeGame() {
  if (
    !gameActive ||
    !gamePaused
  ) {
    return;
  }


  resumeSong();


  gamePaused = false;


  updatePauseButton();


  renderer.clearJudgement();

  renderer.clearFeedback();


  animationFrameId =
    requestAnimationFrame(
      gameLoop
    );
}


/*
 * Updates the Pause button so that
 * the interface reflects the current
 * game state.
 */
function updatePauseButton() {
  if (!pauseBtn) {
    return;
  }


  if (gamePaused) {
    pauseBtn.textContent =
      "Resume";


    pauseBtn.setAttribute(
      "aria-label",
      "Resume game"
    );
  } else {
    pauseBtn.textContent =
      "Pause";


    pauseBtn.setAttribute(
      "aria-label",
      "Pause game"
    );
  }
}


/*
 * Stops any game that is
 * currently running before
 * a new one begins.
 */
function stopCurrentGame() {
  gameActive = false;

  gamePaused = false;


  updatePauseButton();


  if (
    animationFrameId !==
    null
  ) {
    cancelAnimationFrame(
      animationFrameId
    );
  }


  animationFrameId =
    null;


  stopSong();


  activeNotes.forEach(
    (activeNote) => {
      activeNote
        .visualNote
        .remove();
    }
  );


  activeNotes = [];
}


/*
 * Ends the game, saves the
 * player's best leaderboard
 * result and displays the final
 * statistics.
 */
function endGame() {
  gameActive = false;

  gamePaused = false;


  updatePauseButton();


  if (
    animationFrameId !==
    null
  ) {
    cancelAnimationFrame(
      animationFrameId
    );
  }


  animationFrameId =
    null;


  stopSong();


  activeNotes.forEach(
    (activeNote) => {
      activeNote
        .visualNote
        .remove();
    }
  );


  activeNotes = [];


  const stats =
    scoreTracker.getStats();


  const playerName =
    getPlayerName();


  /*
   * Save completed result.
   *
   * For now the leaderboard remains
   * separated by difficulty.
   *
   * We can decide later whether song
   * should also become a leaderboard
   * category.
   */
  saveLeaderboardEntry({
    playerName,

    difficulty:
      selectedDifficulty,

    score:
      stats.score,

    accuracy:
      stats.accuracy,

    maxCombo:
      stats.maxCombo
  });


  const formattedDifficulty =
    formatDifficulty(
      selectedDifficulty
    );


  renderer.showLeaderboard(
    getLeaderboard(
      selectedDifficulty
    ),

    formattedDifficulty
  );


  renderer.showGameOver({
    score:
      stats.score,

    perfect:
      stats.perfect,

    good:
      stats.good,

    miss:
      stats.miss,

    accuracy:
      stats.accuracy,

    maxCombo:
      stats.maxCombo,

    averageTimingError:
      stats
        .averageTimingError
  });
}