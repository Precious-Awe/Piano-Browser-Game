import {
  initialiseAudio,
  preloadAudio
} from "./audio.js";

import {
  initialiseGame,
  startGame,
  showSetupScreen
} from "./game.js";

const startBtn =
  document.getElementById("startBtn");

const playNowBtn =
  document.getElementById("playNowBtn");


/*
 * The welcome screen's Play button opens
 * the song and difficulty controls.
 */
if (playNowBtn) {
  playNowBtn.addEventListener(
    "click",
    () => {
      showSetupScreen();

      document
        .getElementById("playerName")
        .focus();
    }
  );
}

initialiseGame();

preloadAudio();

/*
 * startGame() loads the backing track
 * for whichever song is selected.
 */
startBtn.addEventListener(
  "click",
  async () => {
    try {
      await initialiseAudio();

      await startGame();
    } catch (error) {
      console.error(
        "The game could not be started:",
        error
      );
    }
  }
);
