import {
  initialiseAudio,
  loadSong
} from "./audio.js";

import {
  initialiseGame,
  startGame
} from "./game.js";

const startBtn =
  document.getElementById("startBtn");

initialiseGame();

startBtn.addEventListener(
  "click",
  async () => {
    try {
      await initialiseAudio();

      await loadSong(
        "./audio/practice-song.mp3"
      );

      startGame();
    } catch (error) {
      console.error(
        "The game could not be started:",
        error
      );
    }
  }
);