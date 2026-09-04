import {
  playNote,
  startSong,
  stopSong,
  getSongTime
} from "./audio.js";

import { createRenderer } from "./renderer.js";
import { PRACTICE_SONG } from "./notes.js";
import { createScoreTracker } from "./scoring.js";

import {
  calculateTimingError,
  calculateJudgement
} from "./timing.js";

const NOTE_FALL_DURATION = 2500;
const SONG_END_BUFFER = 1000;

const keys =
  document.querySelectorAll(".key");

const scoreTracker =
  createScoreTracker();

const renderer =
  createRenderer();

let gameActive = false;
let animationFrameId = null;

let nextNoteIndex = 0;
let activeNotes = [];

let songDuration = 0;
let timeLeft = 0;

export function initialiseGame() {
  keys.forEach((key) => {
    key.addEventListener(
      "pointerdown",
      handleKeyPress
    );
  });

  window.addEventListener(
    "resize",
    positionBlackKeys
  );
}

/*
 * Converts a musical beat number into
 * milliseconds from the beginning of the track.
 *
 * Beat 1 occurs at PRACTICE_SONG.offset.
 */
function beatToMilliseconds(beat) {
  const secondsPerBeat =
    60 / PRACTICE_SONG.bpm;

  const hitTimeInSeconds =
    PRACTICE_SONG.offset +
    (beat - 1) * secondsPerBeat;

  return hitTimeInSeconds * 1000;
}

export function startGame() {
  stopCurrentGame();

  scoreTracker.reset();

  gameActive = true;
  nextNoteIndex = 0;
  activeNotes = [];

  const finalSongNote =
    PRACTICE_SONG.notes[
      PRACTICE_SONG.notes.length - 1
    ];

  songDuration =
    beatToMilliseconds(
      finalSongNote.beat
    ) +
    SONG_END_BUFFER;

  timeLeft =
    Math.ceil(
      songDuration / 1000
    );

  renderer.showGame();
  renderer.clearFeedback();
  renderer.clearJudgement();

  renderer.showTargetNote(
    PRACTICE_SONG.title
  );

  /*
   * The keyboard was hidden before the game
   * started, so position the black keys now
   * that it is visible.
   */
  positionBlackKeys();

  updateStats();

  /*
   * Start the backing track.
   * Its audio clock becomes the master clock.
   */
  startSong();

  animationFrameId =
    requestAnimationFrame(
      gameLoop
    );
}

function positionBlackKeys() {
  const keyboard =
    document.getElementById(
      "keyboard"
    );

  if (!keyboard) {
    return;
  }

  const keyboardRect =
    keyboard.getBoundingClientRect();

  if (keyboardRect.width === 0) {
    return;
  }

  const blackKeyMap = {
    "C#4": ["C4", "D4"],
    "D#4": ["D4", "E4"],
    "F#4": ["F4", "G4"],
    "G#4": ["G4", "A4"],
    "A#4": ["A4", "B4"],

    "C#5": ["C5", "D5"],
    "D#5": ["D5", "E5"],
    "F#5": ["F5", "G5"],
    "G#5": ["G5", "A5"],
    "A#5": ["A5", "B5"]
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
      ] = neighbouringNotes;

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
        leftKey.getBoundingClientRect();

      const rightRect =
        rightKey.getBoundingClientRect();

      const boundary =
        (
          leftRect.right +
          rightRect.left
        ) / 2;

      const relativeBoundary =
        boundary -
        keyboardRect.left;

      const blackKeyWidth =
        blackKey.getBoundingClientRect()
          .width;

      blackKey.style.left =
        `${
          relativeBoundary -
          blackKeyWidth / 2
        }px`;
    }
  );
}

function gameLoop() {
  if (!gameActive) {
    return;
  }

  /*
   * getSongTime() returns seconds.
   * Convert to milliseconds for the
   * timing system.
   */
  const elapsedTime =
    getSongTime() * 1000;

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
    elapsedTime >= songDuration &&
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

function spawnUpcomingNotes(
  elapsedTime
) {
  while (
    nextNoteIndex <
    PRACTICE_SONG.notes.length
  ) {
    const songNote =
      PRACTICE_SONG.notes[
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

function spawnSongNote(
  songNote,
  scheduledHitTime,
  spawnTime
) {
  const visualNote =
    renderer.createFallingNote(
      songNote.note
    );

  if (!visualNote) {
    console.error(
      `Could not render song note: ${songNote.note}`
    );

    return;
  }

  visualNote.setPosition(0);

  activeNotes.push({
    noteName:
      songNote.note,

    scheduledHitTime,
    spawnTime,
    visualNote,

    judged: false
  });
}

function updateActiveNotes(
  elapsedTime
) {
  const highwayHeight =
    renderer.getNoteHighwayHeight();

  activeNotes.forEach(
    (activeNote) => {
      if (
        activeNote.judged
      ) {
        return;
      }

      const noteHeight =
        activeNote.visualNote
          .getHeight();

      const targetY =
        highwayHeight -
        noteHeight;

      const noteElapsedTime =
        elapsedTime -
        activeNote.spawnTime;

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

      activeNote.visualNote
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

function handleKeyPress(
  event
) {
  if (!gameActive) {
    return;
  }

  const selectedNote =
    event.currentTarget
      .dataset.note;

  if (!selectedNote) {
    return;
  }

  /*
   * The player's input supplies the
   * live piano part.
   */
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

  if (!matchingNote) {
    scoreTracker.recordMiss();

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

  registerMiss(
    matchingNote,

    timingError < 0
      ? "Too early. Combo lost."
      : "Too late. Combo lost."
  );
}

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

  scoreTracker.recordMiss();

  renderer.showJudgement(
    "Miss"
  );

  renderer.showFeedback(
    feedbackMessage
  );

  updateStats();
}

function removeJudgedNotes() {
  activeNotes =
    activeNotes.filter(
      (activeNote) => {
        if (
          !activeNote.judged
        ) {
          return true;
        }

        activeNote.visualNote
          .remove();

        return false;
      }
    );
}

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
    return `${absoluteError} ms early`;
  }

  if (
    timingError > 0
  ) {
    return `${absoluteError} ms late`;
  }

  return "Exact timing";
}

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

function stopCurrentGame() {
  gameActive = false;

  cancelAnimationFrame(
    animationFrameId
  );

  animationFrameId =
    null;

  stopSong();

  activeNotes.forEach(
    (activeNote) => {
      activeNote.visualNote
        .remove();
    }
  );

  activeNotes = [];
}

function endGame() {
  gameActive = false;

  cancelAnimationFrame(
    animationFrameId
  );

  animationFrameId =
    null;

  stopSong();

  activeNotes.forEach(
    (activeNote) => {
      activeNote.visualNote
        .remove();
    }
  );

  activeNotes = [];

  const stats =
    scoreTracker.getStats();

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
      stats.averageTimingError
  });
}