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

export function initialiseGame() {
  keys.forEach((key) => {
    key.addEventListener("pointerdown", handleKeyPress);
  });
}

export function startGame() {
  clearInterval(timerInterval);
  cancelAnimationFrame(animationFrameId);

  if (fallingNote) {
    fallingNote.remove();
  }

  scoreTracker.reset();

  timeLeft = GAME_DURATION;
  gameActive = true;

  fallingNote = null;
  animationFrameId = null;
  fallStartTime = 0;
  scheduledHitTime = 0;

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

  targetNote = getRandomNote();

  renderer.showTargetNote(targetNote);

  fallingNote = renderer.createFallingNote(targetNote);
  fallingNote.setPosition(0);

  fallStartTime = performance.now();

  scheduledHitTime =
    fallStartTime + NOTE_FALL_DURATION;

  cancelAnimationFrame(animationFrameId);

  animationFrameId =
    requestAnimationFrame(animateFallingNote);
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

  const hitLinePosition =
    highwayHeight * 0.88;

  const yPosition =
    progress * hitLinePosition;

  fallingNote.setPosition(yPosition);

  /*
   * Once the note has passed the Good timing window,
   * it becomes an automatic Miss.
   */
  if (currentTime > scheduledHitTime) {
    const timingError = calculateTimingError(
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
    requestAnimationFrame(animateFallingNote);
}

function handleKeyPress(event) {
  if (!gameActive || !fallingNote) {
    return;
  }

  const selectedKey = event.currentTarget;
  const selectedNote = selectedKey.dataset.note;

  if (!selectedNote) {
    return;
  }

  playNote(selectedNote);

  /*
   * Pressing the wrong piano key counts as a failed
   * attempt and resets the combo, but the falling
   * target note remains active.
   */
  if (selectedNote !== targetNote) {
    scoreTracker.recordMiss();

    renderer.showJudgement("Wrong Key");
    renderer.showFeedback(
      "Wrong note. Combo lost."
    );

    updateStats();
    return;
  }

  const playerInputTime = performance.now();

  const timingError = calculateTimingError(
    playerInputTime,
    scheduledHitTime
  );

  const judgement =
    calculateJudgement(timingError);

  if (judgement === "Perfect") {
    scoreTracker.recordPerfect(timingError);

    renderer.showJudgement("Perfect");
    renderer.showFeedback(
      formatTimingFeedback(timingError)
    );

    updateStats();
    chooseNewNote();

    return;
  }

  if (judgement === "Good") {
    scoreTracker.recordGood(timingError);

    renderer.showJudgement("Good");
    renderer.showFeedback(
      formatTimingFeedback(timingError)
    );

    updateStats();
    chooseNewNote();

    return;
  }

  /*
   * A matching key pressed too early is recorded as
   * a Miss, but the note remains available so the
   * player can still try to hit it at the correct time.
   */
  scoreTracker.recordMiss();

  renderer.showJudgement("Miss");

  if (timingError < 0) {
    renderer.showFeedback("Too early.");
  } else {
    renderer.showFeedback("Too late.");
  }

  updateStats();
}

function registerAutomaticMiss() {
  scoreTracker.recordMiss();

  renderer.showJudgement("Miss");
  renderer.showFeedback("Note missed. Combo lost.");

  updateStats();
  chooseNewNote();
}

function formatTimingFeedback(timingError) {
  const absoluteError =
    Math.round(Math.abs(timingError));

  if (timingError < 0) {
    return `${absoluteError} ms early`;
  }

  if (timingError > 0) {
    return `${absoluteError} ms late`;
  }

  return "Exact timing";
}

function updateStats() {
  const stats = scoreTracker.getStats();

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

  cancelAnimationFrame(animationFrameId);
  animationFrameId = null;

  if (fallingNote) {
    fallingNote.remove();
    fallingNote = null;
  }

  const stats = scoreTracker.getStats();

  renderer.showGameOver({
    score: stats.score,
    perfect: stats.perfect,
    good: stats.good,
    miss: stats.miss,
    accuracy: stats.accuracy,
    maxCombo: stats.maxCombo,
    averageTimingError: stats.averageTimingError
  });
}