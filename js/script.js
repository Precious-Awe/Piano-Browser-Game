import { initialiseAudio } from "./audio.js";
import { initialiseGame, startGame } from "./game.js";

const startBtn = document.getElementById("startBtn");

initialiseGame();

startBtn.addEventListener("click", async () => {
  try {
    await initialiseAudio();
    startGame();
  } catch (error) {
    console.error("The game could not be started:", error);
  }
});