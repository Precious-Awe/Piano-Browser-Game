const startBtn = document.getElementById("startBtn");
const gameArea = document.getElementById("gameArea");
const targetNoteEl = document.getElementById("targetNote");
const feedbackEl = document.getElementById("feedback");
const scoreEl = document.getElementById("score");
const keys = document.querySelectorAll(".key");

const notes = ["C4", "D4", "E4", "F4", "G4", "A4", "B4", "C5"];

let targetNote = "";
let score = 0;
let correct = 0;
let wrong = 0;
let combo = 0;
let timeLeft = 30;
let gameActive = false;
let noteStartTime = 0;
let totalReactionTime = 0;
let timerInterval;

const synth = new Tone.Synth().toDestination();

startBtn.addEventListener("click", async () => {
  await Tone.start();
  startGame();
});

function startGame() {
  score = 0;
  correct = 0;
  wrong = 0;
  combo = 0;
  timeLeft = 30;
  totalReactionTime = 0;
  gameActive = true;

  startBtn.classList.add("hidden");
  gameArea.classList.remove("hidden");

  updateStats();
  chooseNewNote();

  timerInterval = setInterval(() => {
    timeLeft--;
    updateStats();

    if (timeLeft <= 0) {
      endGame();
    }
  }, 1000);
}

function chooseNewNote() {
  targetNote = notes[Math.floor(Math.random() * notes.length)];
  targetNoteEl.textContent = targetNote;
  feedbackEl.textContent = "";
  noteStartTime = performance.now();
}

function updateStats() {
  const totalAttempts = correct + wrong;
  const accuracy = totalAttempts === 0 ? 100 : Math.round((correct / totalAttempts) * 100);
  const averageReaction =
    correct === 0 ? 0 : (totalReactionTime / correct / 1000).toFixed(2);

  scoreEl.textContent = `
    ${score} | Time: ${timeLeft}s | Accuracy: ${accuracy}% | Combo: ${combo} | Avg Reaction: ${averageReaction}s
  `;
}

keys.forEach((key) => {
  key.addEventListener("pointerdown", () => {
    if (!gameActive) return;

    const selectedNote = key.dataset.note;
    synth.triggerAttackRelease(selectedNote, "8n");

    if (selectedNote === targetNote) {
      const reactionTime = performance.now() - noteStartTime;

      correct++;
      combo++;
      totalReactionTime += reactionTime;

      score += 10 + combo;

      feedbackEl.textContent = `Correct! Reaction time: ${(reactionTime / 1000).toFixed(2)}s`;
      chooseNewNote();
    } else {
      wrong++;
      combo = 0;
      feedbackEl.textContent = "Wrong note. Combo lost.";
    }

    updateStats();
  });
});

function endGame() {
  gameActive = false;
  clearInterval(timerInterval);

  const totalAttempts = correct + wrong;
  const accuracy = totalAttempts === 0 ? 0 : Math.round((correct / totalAttempts) * 100);
  const averageReaction =
    correct === 0 ? 0 : (totalReactionTime / correct / 1000).toFixed(2);

  targetNoteEl.textContent = "Game Over";

  feedbackEl.innerHTML = `
    Final Score: ${score}<br>
    Correct Notes: ${correct}<br>
    Wrong Notes: ${wrong}<br>
    Accuracy: ${accuracy}%<br>
    Average Reaction Time: ${averageReaction}s
  `;

  startBtn.textContent = "Play Again";
  startBtn.classList.remove("hidden");
}