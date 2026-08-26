import { playNote } from "./audio.js";
import { createRenderer } from "./renderer.js";
import { PRACTICE_SONG } from "./notes.js";
import { createScoreTracker } from "./scoring.js";
import {
  calculateTimingError,
  calculateJudgement
} from "./timing.js";

const NOTE_FALL_DURATION = 2500;
const SONG_END_BUFFER = 1000;

const keys = document.querySelectorAll(".key");

const scoreTracker = createScoreTracker();
const renderer = createRenderer();

let gameActive = false;
let songStartTime = 0;
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
    finalSongNote.time * 1000 +
    SONG_END_BUFFER;

  timeLeft =
    Math.ceil(songDuration / 1000);

  renderer.showGame();
  renderer.clearFeedback();
  renderer.clearJudgement();

  /*
   * The old target-note field is temporarily
   * reused to display the current song title.
   */
  renderer.showTargetNote(
    PRACTICE_SONG.title
  );

  updateStats();

  songStartTime =
    performance.now();

  animationFrameId =
    requestAnimationFrame(gameLoop);
}

function gameLoop(currentTime) {
  if (!gameActive) {
    return;
  }

  const elapsedTime =
    currentTime - songStartTime;

  spawnUpcomingNotes(elapsedTime);
  updateActiveNotes(elapsedTime);
  updateSongTimer(elapsedTime);

  if (
    elapsedTime >= songDuration &&
    activeNotes.length === 0
  ) {
    endGame();
    return;
  }

  animationFrameId =
    requestAnimationFrame(gameLoop);
}

function spawnUpcomingNotes(elapsedTime) {
  while (
    nextNoteIndex <
    PRACTICE_SONG.notes.length
  ) {
    const songNote =
      PRACTICE_SONG.notes[nextNoteIndex];

    const scheduledHitTime =
      songNote.time * 1000;

    const spawnTime =
      scheduledHitTime -
      NOTE_FALL_DURATION;

    if (elapsedTime < spawnTime) {
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
    noteName: songNote.note,
    scheduledHitTime,
    spawnTime,
    visualNote,
    judged: false
  });
}

function updateActiveNotes(elapsedTime) {
  const highwayHeight =
    renderer.getNoteHighwayHeight();

  activeNotes.forEach((activeNote) => {
    if (activeNote.judged) {
      return;
    }

    const noteHeight =
      activeNote.visualNote.getHeight();

    const targetY =
      highwayHeight - noteHeight;

    const noteElapsedTime =
      elapsedTime -
      activeNote.spawnTime;

    const progress = Math.min(
      Math.max(
        noteElapsedTime /
          NOTE_FALL_DURATION,
        0
      ),
      1
    );

    const yPosition =
      progress * targetY;

    activeNote.visualNote.setPosition(
      yPosition
    );

    const timingError =
      elapsedTime -
      activeNote.scheduledHitTime;

    const judgement =
      calculateJudgement(timingError);

    /*
     * Only an overdue note can become an
     * automatic Miss.
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
  });

  removeJudgedNotes();
}

function handleKeyPress(event) {
  if (!gameActive) {
    return;
  }

  const selectedNote =
    event.currentTarget.dataset.note;

  if (!selectedNote) {
    return;
  }

  playNote(selectedNote);

  const elapsedTime =
    performance.now() -
    songStartTime;

  const matchingNote =
    findClosestMatchingNote(
      selectedNote,
      elapsedTime
    );

  /*
   * No active falling note matches
   * the piano key that was pressed.
   */
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
      matchingNote.scheduledHitTime
    );

  const judgement =
    calculateJudgement(timingError);

  if (judgement === "Perfect") {
    matchingNote.judged = true;

    scoreTracker.recordPerfect(
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

  if (judgement === "Good") {
    matchingNote.judged = true;

    scoreTracker.recordGood(
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
   * Correct key, but outside the
   * accepted timing window.
   *
   * This is a terminal Miss.
   */
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

  if (candidates.length === 0) {
    return null;
  }

  candidates.sort((a, b) => {
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
  });

  return candidates[0];
}

function registerMiss(
  activeNote,
  feedbackMessage
) {
  if (activeNote.judged) {
    return;
  }

  activeNote.judged = true;

  scoreTracker.recordMiss();

  renderer.showJudgement("Miss");
  renderer.showFeedback(
    feedbackMessage
  );

  updateStats();
}

function removeJudgedNotes() {
  activeNotes =
    activeNotes.filter(
      (activeNote) => {
        if (!activeNote.judged) {
          return true;
        }

        activeNote.visualNote.remove();

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
      remainingTime / 1000
    );

  if (newTimeLeft !== timeLeft) {
    timeLeft = newTimeLeft;
    updateStats();
  }
}

function formatTimingFeedback(
  timingError
) {
  const absoluteError =
    Math.round(
      Math.abs(timingError)
    );

  if (timingError < 0) {
    return `${absoluteError} ms early`;
  }

  if (timingError > 0) {
    return `${absoluteError} ms late`;
  }

  return "Exact timing";
}

function updateStats() {
  const stats =
    scoreTracker.getStats();

  renderer.updateScoreboard({
    score: stats.score,
    timeLeft,
    accuracy: stats.accuracy,
    combo: stats.combo
  });
}

function stopCurrentGame() {
  gameActive = false;

  cancelAnimationFrame(
    animationFrameId
  );

  animationFrameId = null;

  activeNotes.forEach(
    (activeNote) => {
      activeNote.visualNote.remove();
    }
  );

  activeNotes = [];
}

function endGame() {
  gameActive = false;

  cancelAnimationFrame(
    animationFrameId
  );

  animationFrameId = null;

  activeNotes.forEach(
    (activeNote) => {
      activeNote.visualNote.remove();
    }
  );

  activeNotes = [];

  const stats =
    scoreTracker.getStats();

  renderer.showGameOver({
    score: stats.score,
    perfect: stats.perfect,
    good: stats.good,
    miss: stats.miss,
    accuracy: stats.accuracy,
    maxCombo: stats.maxCombo,
    averageTimingError:
      stats.averageTimingError
  });
}