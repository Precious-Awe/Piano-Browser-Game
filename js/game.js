import { playNote } from "./audio.js";
import { createRenderer } from "./renderer.js";
import { getRandomNote } from "./notes.js";
import { createScoreTracker } from "./scoring.js";

const GAME_DURATION = 30;

const keys = document.querySelectorAll(".key");

const scoreTracker = createScoreTracker();
const renderer = createRenderer();

let targetNote = "";
let timeLeft = GAME_DURATION;
let gameActive = false;
let noteStartTime = 0;
let timerInterval = null;

export function initialiseGame() {
  keys.forEach((key) => {
    key.addEventListener("pointerdown", handleKeyPress);
  });
}

export function startGame() {
  clearInterval(timerInterval);

  scoreTracker.reset();

  timeLeft = GAME_DURATION;
  gameActive = true;
  noteStartTime = 0;

  renderer.showGame();
  renderer.clearFeedback();
  renderer.createFallingNote("C4");

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
  targetNote = getRandomNote();
  renderer.showTargetNote(targetNote);
  noteStartTime = performance.now();
}

function handleKeyPress(event) {
  if (!gameActive) {
    return;
  }

  const selectedKey = event.currentTarget;
  const selectedNote = selectedKey.dataset.note;

  if (!selectedNote) {
    return;
  }

  playNote(selectedNote);

  if (selectedNote === targetNote) {
    const reactionTime = performance.now() - noteStartTime;

    scoreTracker.recordCorrectAnswer(reactionTime);
    chooseNewNote();
  } else {
    scoreTracker.recordWrongAnswer();
    renderer.showFeedback("Wrong note. Combo lost.");
  }

  updateStats();
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

  const stats = scoreTracker.getStats();

  renderer.showGameOver({
    score: stats.score,
    correct: stats.correct,
    wrong: stats.wrong,
    accuracy: stats.accuracy,
    averageReactionTime: stats.averageReactionTime
  });
}