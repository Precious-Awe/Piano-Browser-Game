import { playNote } from "./audio.js";
import { createRenderer } from "./renderer.js";
import { getRandomNote } from "./notes.js";
import { createScoreTracker } from "./scoring.js";
import {
  calculateTimingError,
  calculateJudgement
} from "./timing.js";

const GAME_DURATION = 30;
const NOTE_FALL_DURATION = 2500;

const keys = document.querySelectorAll(".key");

const scoreTracker = createScoreTracker();
const renderer = createRenderer();

let targetNote = "";
let timeLeft = GAME_DURATION;
let gameActive = false;

let timerInterval = null;

let fallingNote = null;
let animationFrameId = null;

let fallStartTime = 0;
let scheduledHitTime = 0;

/*
 * Prevents the same falling note from being
 * scored more than once.
 */
let noteJudged = false;

export function initialiseGame() {
  keys.forEach((key) => {
    key.addEventListener(
      "pointerdown",
      handleKeyPress
    );
  });
}

export function startGame() {
  clearInterval(timerInterval);
  cancelAnimationFrame(animationFrameId);

  if (fallingNote) {
    fallingNote.remove();
    fallingNote = null;
  }

  scoreTracker.reset();

  timeLeft = GAME_DURATION;
  gameActive = true;

  animationFrameId = null;
  fallStartTime = 0;
  scheduledHitTime = 0;
  noteJudged = false;

  renderer.showGame();
  renderer.clearFeedback();
  renderer.clearJudgement();

  updateStats();
  chooseNewNote();

  timerInterval = window.setInterval(() => {
    timeLeft -= 1;

    if (timeLeft <= 0) {
      timeLeft = 0;

      updateStats();
      endGame();

      return;
    }

    updateStats();
  }, 1000);
}

function chooseNewNote() {
  if (fallingNote) {
    fallingNote.remove();
    fallingNote = null;
  }

  cancelAnimationFrame(animationFrameId);
  animationFrameId = null;

  targetNote = getRandomNote();

  /*
   * Every new note starts in an unjudged state.
   */
  noteJudged = false;

  renderer.showTargetNote(targetNote);

  fallingNote =
    renderer.createFallingNote(targetNote);

  if (!fallingNote) {
    console.error(
      `Could not create falling note: ${targetNote}`
    );

    return;
  }

  fallingNote.setPosition(0);

  fallStartTime = performance.now();

  scheduledHitTime =
    fallStartTime + NOTE_FALL_DURATION;

  animationFrameId =
    requestAnimationFrame(
      animateFallingNote
    );
}

function animateFallingNote(currentTime) {
  if (!gameActive || !fallingNote) {
    return;
  }

  const elapsedTime =
    currentTime - fallStartTime;

  const progress = Math.min(
    elapsedTime / NOTE_FALL_DURATION,
    1
  );

  const highwayHeight =
    renderer.getNoteHighwayHeight();

  const noteHeight =
    fallingNote.getHeight();

  const hitLinePosition =
    highwayHeight;

  const targetY =
    hitLinePosition - noteHeight;

  const yPosition =
    progress * targetY;

  fallingNote.setPosition(yPosition);

  /*
   * Do not automatically judge a note
   * that has already received a judgement.
   */
  if (
    !noteJudged &&
    currentTime > scheduledHitTime
  ) {
    const timingError =
      calculateTimingError(
        currentTime,
        scheduledHitTime
      );

    const judgement =
      calculateJudgement(timingError);

    if (judgement === "Miss") {
      registerAutomaticMiss();
      return;
    }
  }

  animationFrameId =
    requestAnimationFrame(
      animateFallingNote
    );
}

function handleKeyPress(event) {
  if (
    !gameActive ||
    !fallingNote ||
    noteJudged
  ) {
    return;
  }

  const selectedKey =
    event.currentTarget;

  const selectedNote =
    selectedKey.dataset.note;

  if (!selectedNote) {
    return;
  }

  playNote(selectedNote);

  /*
   * Wrong key:
   * the current note is judged once as a Miss.
   */
  if (selectedNote !== targetNote) {
    noteJudged = true;

    scoreTracker.recordMiss();

    renderer.showJudgement("Wrong Key");

    renderer.showFeedback(
      "Wrong note. Combo lost."
    );

    updateStats();

    scheduleNextNote();
    return;
  }

  const playerInputTime =
    performance.now();

  const timingError =
    calculateTimingError(
      playerInputTime,
      scheduledHitTime
    );

  const judgement =
    calculateJudgement(timingError);

  if (judgement === "Perfect") {
    noteJudged = true;

    scoreTracker.recordPerfect(
      timingError
    );

    renderer.showJudgement("Perfect");

    renderer.showFeedback(
      formatTimingFeedback(timingError)
    );

    updateStats();
    scheduleNextNote();

    return;
  }

  if (judgement === "Good") {
    noteJudged = true;

    scoreTracker.recordGood(
      timingError
    );

    renderer.showJudgement("Good");

    renderer.showFeedback(
      formatTimingFeedback(timingError)
    );

    updateStats();
    scheduleNextNote();

    return;
  }

  /*
   * Correct key, but outside the accepted
   * timing window.
   *
   * The note is judged once as a Miss.
   */
  noteJudged = true;

  scoreTracker.recordMiss();

  renderer.showJudgement("Miss");

  if (timingError < 0) {
    renderer.showFeedback("Too early.");
  } else {
    renderer.showFeedback("Too late.");
  }

  updateStats();
  scheduleNextNote();
}

function registerAutomaticMiss() {
  if (
    !gameActive ||
    noteJudged
  ) {
    return;
  }

  noteJudged = true;

  scoreTracker.recordMiss();

  renderer.showJudgement("Miss");

  renderer.showFeedback(
    "Note missed. Combo lost."
  );

  updateStats();
  scheduleNextNote();
}

function scheduleNextNote() {
  cancelAnimationFrame(animationFrameId);
  animationFrameId = null;

  if (fallingNote) {
    fallingNote.remove();
    fallingNote = null;
  }

  /*
   * Short delay lets the player see the
   * judgement before the next note appears.
   */
  window.setTimeout(() => {
    if (gameActive) {
      chooseNewNote();
    }
  }, 250);
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

function endGame() {
  gameActive = false;

  clearInterval(timerInterval);
  timerInterval = null;

  cancelAnimationFrame(
    animationFrameId
  );

  animationFrameId = null;

  if (fallingNote) {
    fallingNote.remove();
    fallingNote = null;
  }

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