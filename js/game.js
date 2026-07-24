import { playNote } from "./audio.js";
import { getRandomNote } from "./notes.js";
import { createScoreTracker } from "./scoring.js";

const GAME_DURATION = 30;

const startBtn = document.getElementById("startBtn");
const gameArea = document.getElementById("gameArea");
const targetNoteEl = document.getElementById("targetNote");
const feedbackEl = document.getElementById("feedback");

const scoreValueEl = document.getElementById("scoreValue");
const timeValueEl = document.getElementById("timeValue");
const accuracyValueEl = document.getElementById("accuracyValue");
const comboValueEl = document.getElementById("comboValue");

const keys = document.querySelectorAll(".key");

const scoreTracker = createScoreTracker();

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

  targetNote = "";
  timeLeft = GAME_DURATION;
  gameActive = true;
  noteStartTime = 0;

  startBtn.classList.add("hidden");
  gameArea.classList.remove("hidden");

  feedbackEl.textContent = "";

  updateStats();
  chooseNewNote();

  timerInterval = window.setInterval(() => {
    timeLeft--;

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
  targetNoteEl.textContent = targetNote;
  feedbackEl.textContent = "";
  noteStartTime = performance.now();
}

function handleKeyPress(event) {
  if (!gameActive) {
    return;
  }

  const selectedKey = event.currentTarget;
  const selectedNote = selectedKey.dataset.note;

  playNote(selectedNote);

  if (selectedNote === targetNote) {
    const reactionTime = performance.now() - noteStartTime;

    scoreTracker.recordCorrectAnswer(reactionTime);
    chooseNewNote();
  } else {
    scoreTracker.recordWrongAnswer();
    feedbackEl.textContent = "Wrong note. Combo lost.";
  }

  updateStats();
}

function updateStats() {
  const stats = scoreTracker.getStats();

  scoreValueEl.textContent = stats.score;
  timeValueEl.textContent = `${timeLeft}s`;
  accuracyValueEl.textContent = `${stats.accuracy}%`;
  comboValueEl.textContent = `×${stats.combo}`;
}

function endGame() {
  gameActive = false;
  clearInterval(timerInterval);
  timerInterval = null;

  const stats = scoreTracker.getStats();

  targetNoteEl.textContent = "Game Over";

  feedbackEl.innerHTML = `
    Final Score: ${stats.score}<br>
    Correct Notes: ${stats.correct}<br>
    Wrong Notes: ${stats.wrong}<br>
    Accuracy: ${stats.accuracy}%<br>
    Average Reaction Time: ${stats.averageReactionTime}s
  `;

  startBtn.textContent = "Play Again";
  startBtn.classList.remove("hidden");
}