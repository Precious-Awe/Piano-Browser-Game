import {
  saveLeaderboardEntry,
  getLeaderboard
} from "./leaderboard.js";

import {
  playNote,
  startNote,
  stopNote,
  playNoteAtSongTime,
  loadSong,
  startSong,
  pauseSong,
  resumeSong,
  stopSong,
  getSongTime,
  getAudioOffset,
  setAudioOffset
} from "./audio.js";

import {
  createRenderer
} from "./renderer.js";

import {
  getSongById
} from "./notes.js";

import {
  createScoreTracker
} from "./scoring.js";

import {
  setTimingDifficulty,
  getHitWindow,
  calculateTimingError,
  calculateJudgement
} from "./timing.js";


/*
 * How long a tile takes to fall to the
 * hit line on each difficulty.
 *
 * Slower means more time to find the
 * key before the tile arrives.
 */
const NOTE_FALL_DURATIONS = {
  easy: 3600,
  medium: 2900,
  hard: 2300
};


/*
 * Tile height limits. When notes are
 * close together, tiles get shorter
 * (down to MIN_TILE_HEIGHT) rather than
 * falling faster, so they never overlap.
 */
const MAX_TILE_HEIGHT = 40;

const MIN_TILE_HEIGHT = 26;

// Space kept between two tiles.
const TILE_GAP_PX = 8;


/*
 * A long note still counts as complete
 * if the key is released this long
 * before its end.
 */
const HOLD_RELEASE_GRACE = 150;


const SONG_END_BUFFER = 1000;


/*
 * After a game, suggest an audio
 * offset change when the player was
 * consistently early or late by at
 * least this much over enough hits.
 */
const OFFSET_SUGGESTION_MIN_HITS = 10;
const OFFSET_SUGGESTION_MIN_ERROR = 20;


const keys =
  document.querySelectorAll(
    ".key"
  );


const pauseBtn =
  document.getElementById(
    "pauseBtn"
  );


const audioOffsetInput =
  document.getElementById(
    "audioOffset"
  );


const audioOffsetValueEl =
  document.getElementById(
    "audioOffsetValue"
  );


const scoreTracker =
  createScoreTracker();


const renderer =
  createRenderer();


let gameActive = false;

let gamePaused = false;

let gameLoading = false;

let animationFrameId =
  null;


let nextNoteIndex = 0;

let activeNotes = [];


let songDuration = 0;

let timeLeft = 0;


let selectedDifficulty =
  "easy";

let selectedSongId =
  "outbyte";


let currentSong =
  null;

let currentSongNotes = [];

let noteFallDuration =
  NOTE_FALL_DURATIONS.easy;

let tileHeight =
  MAX_TILE_HEIGHT;

/*
 * How far a tile moves per millisecond,
 * used to draw long notes.
 */
let tilePixelsPerMs = 0;

/*
 * Long notes currently held down,
 * keyed by note name.
 */
const heldNotes = new Map();


/*
 * Initialise keyboard controls,
 * difficulty controls and leaderboard.
 */
export function initialiseGame() {
  keys.forEach(
    (key) => {
      key.addEventListener(
        "pointerdown",
        handleKeyPress
      );
    }
  );


  /*
   * Connect the Pause / Resume button
   * to the game.
   */
  if (pauseBtn) {
    pauseBtn.addEventListener(
      "click",
      togglePauseGame
    );
  }


  /*
   * Long notes end when the player lifts
   * the mouse or finger, wherever that
   * happens.
   */
  window.addEventListener(
    "pointerup",
    releaseHolds
  );

  window.addEventListener(
    "pointercancel",
    releaseHolds
  );


  window.addEventListener(
    "resize",
    () => {
      positionBlackKeys();

      renderer.measureKeyPositions();
    }
  );


  /*
   * Audio offset slider.
   */
  if (audioOffsetInput) {
    audioOffsetInput.addEventListener(
      "input",
      () => {
        setAudioOffset(
          Number(
            audioOffsetInput.value
          )
        );

        showAudioOffset();
      }
    );
  }


  showAudioOffset();


  /*
   * Changing either the song or the
   * difficulty switches the
   * leaderboard to that combination.
   */
  const selectionOptions =
    document.querySelectorAll(
      'input[name="song"], input[name="difficulty"]'
    );


  selectionOptions.forEach(
    (option) => {
      option.addEventListener(
        "change",
        () => {
          showSelectedLeaderboard(
            getSelectedSongId(),
            getSelectedDifficulty()
          );
        }
      );
    }
  );


  /*
   * Show the leaderboard for the
   * default selection when the page
   * first loads.
   */
  showSelectedLeaderboard(
    getSelectedSongId(),
    getSelectedDifficulty()
  );
}


/*
 * Leaves the welcome screen and shows
 * the song and difficulty controls.
 */
export function showSetupScreen() {
  renderer.showSetup();
}


/*
 * Syncs the slider and its label with
 * the saved audio offset.
 */
function showAudioOffset() {
  const offset =
    getAudioOffset();


  if (audioOffsetInput) {
    audioOffsetInput.value =
      offset;
  }


  if (audioOffsetValueEl) {
    audioOffsetValueEl.textContent =
      `${offset > 0 ? "+" : ""}${offset} ms`;
  }
}


/*
 * Builds the post-game timing tip.
 *
 * Returns null when the player's
 * timing was centred, or there were
 * too few hits to tell.
 */
function getOffsetSuggestion(
  stats
) {
  const averageError =
    Math.round(
      stats.averageSignedTimingError
    );


  if (
    stats.successfulHits <
      OFFSET_SUGGESTION_MIN_HITS ||
    Math.abs(averageError) <
      OFFSET_SUGGESTION_MIN_ERROR
  ) {
    return null;
  }


  /*
   * Hitting late means the player hears
   * the music later than the game
   * expects, so the offset increases by
   * the same amount (and vice versa).
   */
  return {
    message:
      `You hit ${Math.abs(averageError)} ms ` +
      `${averageError > 0 ? "late" : "early"} ` +
      "on average. This is usually caused by " +
      "speaker or headphone delay.",

    apply() {
      setAudioOffset(
        getAudioOffset() +
        averageError
      );

      showAudioOffset();
    }
  };
}


/*
 * Displays the leaderboard for a
 * song and difficulty combination.
 */
function showSelectedLeaderboard(
  songId,
  difficulty
) {
  const song =
    getSongById(
      songId
    );


  const songTitle =
    song
      ? song.title
      : songId;


  renderer.showLeaderboard(
    getLeaderboard(
      songId,
      difficulty
    ),

    `${songTitle} — ${formatDifficulty(
      difficulty
    )}`
  );
}


/*
 * Converts a musical beat number
 * into milliseconds from the
 * beginning of the currently
 * selected track.
 *
 * Each song can have its own BPM
 * and timing offset.
 */
function beatToMilliseconds(
  beat
) {
  if (!currentSong) {
    return 0;
  }


  const secondsPerBeat =
    60 /
    currentSong.bpm;


  const hitTimeInSeconds =
    currentSong.offset +
    (beat - 1) *
      secondsPerBeat;


  return (
    hitTimeInSeconds *
    1000
  );
}


/*
 * Sets the fall duration and tile
 * height for the current chart.
 *
 * Tiles fall at the difficulty's speed.
 * If the closest two notes would make
 * tiles overlap on this screen, the
 * tiles get shorter. Only if even the
 * shortest tiles would overlap (very
 * short screens) do they fall faster.
 */
function setUpTileLayout() {
  renderer.measureKeyPositions();


  let smallestGap =
    Infinity;

  for (
    let index = 1;
    index < currentSongNotes.length;
    index += 1
  ) {
    smallestGap =
      Math.min(
        smallestGap,
        beatToMilliseconds(
          currentSongNotes[index].beat
        ) -
        beatToMilliseconds(
          currentSongNotes[index - 1].beat
        )
      );
  }


  /*
   * The distance a tile travels.
   */
  const travelDistance =
    renderer.getNoteHighwayHeight() -
    MAX_TILE_HEIGHT;


  const smallestSpacing =
    (fallDuration) =>
      smallestGap *
      travelDistance /
      fallDuration;


  noteFallDuration =
    NOTE_FALL_DURATIONS[
      selectedDifficulty
    ];


  const minimumSpacing =
    MIN_TILE_HEIGHT +
    TILE_GAP_PX;


  if (
    smallestSpacing(noteFallDuration) <
    minimumSpacing
  ) {
    noteFallDuration =
      smallestGap *
      travelDistance /
      minimumSpacing;
  }


  tileHeight =
    Math.round(
      Math.min(
        Math.max(
          smallestSpacing(noteFallDuration) -
            TILE_GAP_PX,
          MIN_TILE_HEIGHT
        ),
        MAX_TILE_HEIGHT
      )
    );


  tilePixelsPerMs =
    travelDistance /
    noteFallDuration;
}


/*
 * Reads the song selected by
 * the player.
 */
function getSelectedSongId() {
  const selectedOption =
    document.querySelector(
      'input[name="song"]:checked'
    );


  if (!selectedOption) {
    return "outbyte";
  }


  return selectedOption.value;
}


/*
 * Reads the difficulty selected
 * by the player.
 */
function getSelectedDifficulty() {
  const selectedOption =
    document.querySelector(
      'input[name="difficulty"]:checked'
    );


  if (!selectedOption) {
    return "easy";
  }


  return selectedOption.value;
}


/*
 * Reads the player's name.
 */
function getPlayerName() {
  const playerNameInput =
    document.getElementById(
      "playerName"
    );


  if (!playerNameInput) {
    return "";
  }


  return playerNameInput
    .value
    .trim();
}


/*
 * Converts:
 *
 * easy -> Easy
 * medium -> Medium
 * hard -> Hard
 */
function formatDifficulty(
  difficulty
) {
  return (
    difficulty
      .charAt(0)
      .toUpperCase() +
    difficulty.slice(1)
  );
}


/*
 * Starts a new game.
 */
export async function startGame() {
  if (gameLoading) {
    return;
  }


  const playerName =
    getPlayerName();


  if (!playerName) {
    alert(
      "Please enter your name before starting the game."
    );

    return;
  }


  stopCurrentGame();


  scoreTracker.reset();


  nextNoteIndex = 0;

  activeNotes = [];


  /*
   * Read the player's selected song.
   */
  selectedSongId =
    getSelectedSongId();


  currentSong =
    getSongById(
      selectedSongId
    );


  if (!currentSong) {
    console.error(
      `Song not found: ${selectedSongId}`
    );

    return;
  }


  /*
   * Read the player's selected
   * difficulty.
   */
  selectedDifficulty =
    getSelectedDifficulty();


  /*
   * Easy gets wider timing windows.
   */
  setTimingDifficulty(
    selectedDifficulty
  );


  /*
   * Retrieve the appropriate chart
   * from the selected song.
   */
  currentSongNotes =
    currentSong
      .difficulties[
        selectedDifficulty
      ];


  /*
   * Do not start the audio for a
   * song/difficulty with no chart.
   */
  if (
    !currentSongNotes ||
    currentSongNotes.length === 0
  ) {
    console.warn(
      `No ${selectedDifficulty} chart has been created for ${currentSong.title} yet.`
    );


    alert(
      `${currentSong.title} is not ready to play yet.`
    );


    return;
  }


  /*
   * Load the backing track belonging
   * to the selected song.
   *
   * audio.js will avoid unnecessarily
   * loading the same file again.
   *
   * gameLoading prevents a second
   * click from starting another game
   * while the audio is loading.
   */
  gameLoading = true;

  try {
    await loadSong(
      currentSong
    );
  } catch (error) {
    console.error(
      "Could not load selected song:",
      error
    );


    alert(
      "The selected song could not be loaded."
    );


    return;
  } finally {
    gameLoading = false;
  }


  /*
   * The game only becomes active once
   * the chart and audio are ready.
   */
  gameActive = true;

  gamePaused = false;

  updatePauseButton();


  /*
   * Determine the game duration from
   * the final note in this song's chart.
   */
  const finalSongNote =
    currentSongNotes[
      currentSongNotes.length -
      1
    ];


  songDuration =
    beatToMilliseconds(
      finalSongNote.beat
    ) +
    SONG_END_BUFFER;


  timeLeft =
    Math.ceil(
      songDuration /
      1000
    );


  renderer.showGame();

  setUpTileLayout();

  renderer.clearFeedback();

  renderer.clearJudgement();


  const formattedDifficulty =
    formatDifficulty(
      selectedDifficulty
    );


  /*
   * Example:
   *
   * Outbyte — Easy
   *
   * Later:
   *
   * Shadows Behind Neon — Medium
   */
  renderer.showTargetNote(
    `${currentSong.title} — ${formattedDifficulty}`
  );


  /*
   * The keyboard was hidden before
   * the game started, so position
   * the black keys once it is visible.
   */
  positionBlackKeys();


  updateStats();


  /*
   * Start the backing track.
   *
   * The backing track's audio clock
   * becomes the master clock for the
   * scheduler and falling notes.
   */
  startSong();


  animationFrameId =
    requestAnimationFrame(
      gameLoop
    );
}


/*
 * Positions each black key
 * between its neighbouring
 * white keys.
 */
function positionBlackKeys() {
  const keyboard =
    document.getElementById(
      "keyboard"
    );


  if (!keyboard) {
    return;
  }


  const keyboardRect =
    keyboard
      .getBoundingClientRect();


  if (
    keyboardRect.width === 0
  ) {
    return;
  }


  const blackKeyMap = {
    "C#4": [
      "C4",
      "D4"
    ],

    "D#4": [
      "D4",
      "E4"
    ],

    "F#4": [
      "F4",
      "G4"
    ],

    "G#4": [
      "G4",
      "A4"
    ],

    "A#4": [
      "A4",
      "B4"
    ],

    "C#5": [
      "C5",
      "D5"
    ],

    "D#5": [
      "D5",
      "E5"
    ],

    "F#5": [
      "F5",
      "G5"
    ],

    "G#5": [
      "G5",
      "A5"
    ],

    "A#5": [
      "A5",
      "B5"
    ]
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
      ] =
        neighbouringNotes;


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
        leftKey
          .getBoundingClientRect();


      const rightRect =
        rightKey
          .getBoundingClientRect();


      const boundary =
        (
          leftRect.right +
          rightRect.left
        ) /
        2;


      const relativeBoundary =
        boundary -
        keyboardRect.left;


      const blackKeyWidth =
        blackKey
          .getBoundingClientRect()
          .width;


      blackKey.style.left =
        `${
          relativeBoundary -
          blackKeyWidth / 2
        }px`;
    }
  );
}


/*
 * Main animation loop.
 *
 * The backing track's audio clock
 * is the master gameplay clock.
 */
function gameLoop() {
  /*
   * Stop the animation loop while
   * the game is inactive or paused.
   */
  if (
    !gameActive ||
    gamePaused
  ) {
    return;
  }


  const elapsedTime =
    getSongTime() *
    1000;


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
    elapsedTime >=
      songDuration &&
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


/*
 * Spawns notes from the currently
 * selected song and difficulty chart.
 */
function spawnUpcomingNotes(
  elapsedTime
) {
  while (
    nextNoteIndex <
    currentSongNotes.length
  ) {
    const songNote =
      currentSongNotes[
        nextNoteIndex
      ];


    const scheduledHitTime =
      beatToMilliseconds(
        songNote.beat
      );


    const spawnTime =
      scheduledHitTime -
      noteFallDuration;


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


/*
 * Creates a visual falling note
 * and adds it to the active list.
 */
function spawnSongNote(
  songNote,
  scheduledHitTime,
  spawnTime
) {
  /*
   * A long note is drawn as a tall tile:
   * its bottom edge reaches the hit line
   * when the note starts, and its tail
   * passes the line while it is held.
   */
  const holdDuration =
    songNote.holdBeats
      ? beatToMilliseconds(
          songNote.beat +
            songNote.holdBeats
        ) -
        scheduledHitTime
      : 0;


  /*
   * The tail is exactly as long as the
   * hold lasts, so the note ends when
   * the far end of the tile reaches the
   * hit line.
   */
  const visualNote =
    renderer
      .createFallingNote(
        songNote.note,

        Math.max(
          tileHeight,
          Math.round(
            holdDuration *
            tilePixelsPerMs
          )
        ),

        holdDuration > 0
      );


  if (!visualNote) {
    console.error(
      `Could not render song note: ${songNote.note}`
    );


    return;
  }


  visualNote.setPosition(
    0
  );


  const noteHeight =
    visualNote.getHeight();


  activeNotes.push({
    noteName:
      songNote.note,

    scheduledHitTime,

    spawnTime,

    visualNote,

    noteHeight,

    holdDuration,

    holdEndTime:
      scheduledHitTime +
      holdDuration,

    holding: false,

    /*
     * Melody notes played after this
     * tile is hit (Für Elise on Easy
     * and Medium).
     */
    fills:
      songNote.fills || [],

    judged: false
  });
}


/*
 * Updates the position and timing
 * state of every active falling note.
 */
function updateActiveNotes(
  elapsedTime
) {
  const highwayHeight =
    renderer
      .getNoteHighwayHeight();


  activeNotes.forEach(
    (activeNote) => {
      if (
        activeNote.judged
      ) {
        return;
      }


      /*
       * Every tile moves at the same
       * speed, set by the standard tile
       * height. Using each tile's own
       * height would make long notes
       * fall slower than short ones, and
       * later tiles would catch up and
       * overlap them.
       */
      const targetY =
        highwayHeight -
        tileHeight;


      const noteElapsedTime =
        elapsedTime -
        activeNote
          .spawnTime;


      /*
       * Not capped at 1: a late tile keeps
       * falling past the hit line (the
       * highway hides the overflow)
       * instead of stopping there, where
       * the next tile would catch up and
       * overlap it.
       */
      const progress =
        Math.max(
          noteElapsedTime /
            noteFallDuration,
          0
        );


      /*
       * Positioned by the tile's bottom
       * edge, which is the note itself;
       * a long tail hangs above it.
       */
      const yPosition =
        progress * targetY +
        tileHeight -
        activeNote.noteHeight;


      activeNote
        .visualNote
        .setPosition(
          yPosition
        );


      /*
       * A long note being held is judged
       * when it ends or is released,
       * not by the hit line.
       */
      if (activeNote.holding) {
        if (
          elapsedTime >=
          activeNote.holdEndTime
        ) {
          finishHold(
            activeNote,
            elapsedTime
          );
        }

        return;
      }


      const timingError =
        elapsedTime -
        activeNote
          .scheduledHitTime;


      const judgement =
        calculateJudgement(
          timingError
        );


      /*
       * Automatically register a Miss
       * once the accepted late timing
       * window has passed.
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
    }
  );


  removeJudgedNotes();
}


/*
 * Handles piano key presses.
 */
function handleKeyPress(
  event
) {
  /*
   * Keyboard input is ignored when
   * the game is inactive or paused.
   *
   * This prevents players from
   * changing their score during Pause.
   */
  if (
    !gameActive ||
    gamePaused
  ) {
    return;
  }


  const selectedNote =
    event.currentTarget
      .dataset.note;


  if (!selectedNote) {
    return;
  }


  const elapsedTime =
    getSongTime() *
    1000;


  const matchingNote =
    findClosestMatchingNote(
      selectedNote,
      elapsedTime
    );


  /*
   * No note of any pitch is near the
   * hit line, so the player is just
   * playing the piano (or pressed
   * early). Like osu!mania, a press
   * outside the timing window has no
   * effect.
   */
  const hasHittableNote =
    activeNotes.some(
      (activeNote) =>
        !activeNote.judged &&
        isWithinHitWindow(
          activeNote,
          elapsedTime
        )
    );


  if (
    !matchingNote &&
    !hasHittableNote
  ) {
    playNote(
      selectedNote
    );

    return;
  }


  /*
   * A note is at the hit line but the
   * player pressed a different key.
   */
  if (!matchingNote) {
    playNote(
      selectedNote
    );

    scoreTracker
      .recordMiss();


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


  /*
   * A long note sounds for as long as it
   * is held; a tap just sounds.
   */
  if (matchingNote.holdDuration > 0) {
    startNote(
      selectedNote
    );

    matchingNote.holding = true;

    matchingNote
      .visualNote
      .setHolding(true);

    heldNotes.set(
      selectedNote,
      matchingNote
    );
  } else {
    playNote(
      selectedNote
    );
  }


  /*
   * Like Magic Tiles, a hit tile plays
   * the rest of its melody phrase, in
   * time with the backing track.
   */
  matchingNote.fills.forEach(
    (fill) => {
      playNoteAtSongTime(
        fill.note,
        beatToMilliseconds(
          fill.beat
        ) / 1000
      );
    }
  );


  /*
   * Perfect hit.
   */
  if (
    judgement ===
    "Perfect"
  ) {
    matchingNote.judged =
      !matchingNote.holding;


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


  /*
   * Good hit.
   */
  if (
    judgement ===
    "Good"
  ) {
    matchingNote.judged =
      !matchingNote.holding;


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
}


/*
 * Returns whether a note is close
 * enough to the hit line to be hit.
 */
function isWithinHitWindow(
  activeNote,
  elapsedTime
) {
  return (
    Math.abs(
      elapsedTime -
      activeNote.scheduledHitTime
    ) <= getHitWindow()
  );
}


/*
 * Finds the closest note matching the
 * piano key pressed that is within
 * the hit window.
 */
function findClosestMatchingNote(
  selectedNote,
  elapsedTime
) {
  const candidates =
    activeNotes.filter(
      (activeNote) =>
        !activeNote.judged &&
        activeNote.noteName ===
          selectedNote &&
        isWithinHitWindow(
          activeNote,
          elapsedTime
        )
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


/*
 * Ends a long note, either because the
 * player let go or because it reached
 * its end.
 */
function finishHold(
  activeNote,
  elapsedTime
) {
  if (!activeNote.holding) {
    return;
  }


  activeNote.holding = false;

  heldNotes.delete(
    activeNote.noteName
  );

  stopNote(
    activeNote.noteName
  );

  activeNote
    .visualNote
    .setHolding(false);


  /*
   * Held to the end (or close enough).
   */
  if (
    elapsedTime >=
    activeNote.holdEndTime -
      HOLD_RELEASE_GRACE
  ) {
    activeNote.judged = true;

    scoreTracker
      .recordHoldComplete(
        activeNote.holdDuration
      );

    renderer.showJudgement(
      "Hold!"
    );

    updateStats();

    return;
  }


  /*
   * Let go too early.
   */
  scoreTracker
    .recordHoldBreak();

  registerMiss(
    activeNote,
    "Let go too early. Combo lost."
  );
}


/*
 * Called when the player lifts a finger
 * or mouse button anywhere.
 */
function releaseHolds() {
  if (
    heldNotes.size === 0 ||
    !gameActive ||
    gamePaused
  ) {
    return;
  }


  const elapsedTime =
    getSongTime() *
    1000;


  [...heldNotes.values()].forEach(
    (activeNote) => {
      finishHold(
        activeNote,
        elapsedTime
      );
    }
  );
}


/*
 * Silences any held notes without
 * scoring them, when a game stops.
 */
function abandonHolds() {
  heldNotes.forEach(
    (activeNote) => {
      activeNote.holding = false;

      stopNote(
        activeNote.noteName
      );
    }
  );

  heldNotes.clear();
}


/*
 * Registers a Miss for a
 * specific falling note.
 */
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


  scoreTracker
    .recordMiss();


  renderer.showJudgement(
    "Miss"
  );


  renderer.showFeedback(
    feedbackMessage
  );


  updateStats();
}


/*
 * Removes notes that have already
 * received a final judgement.
 */
function removeJudgedNotes() {
  activeNotes =
    activeNotes.filter(
      (activeNote) => {
        if (
          !activeNote.judged
        ) {
          return true;
        }


        activeNote
          .visualNote
          .remove();


        return false;
      }
    );
}


/*
 * Updates the countdown timer.
 */
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


/*
 * Creates readable timing
 * feedback.
 */
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
    return (
      `${absoluteError} ms early`
    );
  }


  if (
    timingError > 0
  ) {
    return (
      `${absoluteError} ms late`
    );
  }


  return "Exact timing";
}


/*
 * Updates the live scoreboard.
 */
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


/*
 * Toggles the game between
 * Pause and Resume.
 */
function togglePauseGame() {
  if (!gameActive) {
    return;
  }


  if (gamePaused) {
    resumeGame();
  } else {
    pauseGame();
  }
}


/*
 * Pauses the entire game.
 *
 * The backing track is paused first.
 * This freezes the audio-based master
 * clock used by the game scheduler.
 *
 * The animation frame is then cancelled
 * so the falling notes and countdown
 * remain frozen on screen.
 */
function pauseGame() {
  if (
    !gameActive ||
    gamePaused
  ) {
    return;
  }


  /*
   * Pausing counts as letting go of any
   * long notes being held.
   */
  releaseHolds();


  pauseSong();


  gamePaused = true;


  if (
    animationFrameId !==
    null
  ) {
    cancelAnimationFrame(
      animationFrameId
    );
  }


  animationFrameId =
    null;


  updatePauseButton();


  renderer.showJudgement(
    "Paused"
  );


  renderer.showFeedback(
    "Game paused. Press Resume to continue."
  );
}


/*
 * Resumes the entire game from
 * exactly the same position.
 *
 * audio.js resumes the backing track
 * from its saved playback position.
 *
 * The animation loop then continues
 * using the resumed audio clock.
 */
function resumeGame() {
  if (
    !gameActive ||
    !gamePaused
  ) {
    return;
  }


  resumeSong();


  gamePaused = false;


  updatePauseButton();


  renderer.clearJudgement();

  renderer.clearFeedback();


  animationFrameId =
    requestAnimationFrame(
      gameLoop
    );
}


/*
 * Updates the Pause button so that
 * the interface reflects the current
 * game state.
 */
function updatePauseButton() {
  if (!pauseBtn) {
    return;
  }


  if (gamePaused) {
    pauseBtn.textContent =
      "Resume";


    pauseBtn.setAttribute(
      "aria-label",
      "Resume game"
    );
  } else {
    pauseBtn.textContent =
      "Pause";


    pauseBtn.setAttribute(
      "aria-label",
      "Pause game"
    );
  }
}


/*
 * Stops any game that is
 * currently running before
 * a new one begins.
 */
function stopCurrentGame() {
  gameActive = false;

  gamePaused = false;


  abandonHolds();

  updatePauseButton();


  if (
    animationFrameId !==
    null
  ) {
    cancelAnimationFrame(
      animationFrameId
    );
  }


  animationFrameId =
    null;


  stopSong();


  activeNotes.forEach(
    (activeNote) => {
      activeNote
        .visualNote
        .remove();
    }
  );


  activeNotes = [];
}


/*
 * Ends the game, saves the
 * player's best leaderboard
 * result and displays the final
 * statistics.
 */
function endGame() {
  gameActive = false;

  gamePaused = false;


  abandonHolds();

  updatePauseButton();


  if (
    animationFrameId !==
    null
  ) {
    cancelAnimationFrame(
      animationFrameId
    );
  }


  animationFrameId =
    null;


  stopSong();


  activeNotes.forEach(
    (activeNote) => {
      activeNote
        .visualNote
        .remove();
    }
  );


  activeNotes = [];


  const stats =
    scoreTracker.getStats();


  const playerName =
    getPlayerName();


  /*
   * Save completed result.
   *
   * The leaderboard is separated by
   * both song and difficulty.
   */
  saveLeaderboardEntry({
    playerName,

    songId:
      selectedSongId,

    difficulty:
      selectedDifficulty,

    score:
      stats.score,

    accuracy:
      stats.accuracy,

    maxCombo:
      stats.maxCombo
  });


  showSelectedLeaderboard(
    selectedSongId,
    selectedDifficulty
  );


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
      stats
        .averageTimingError,

    holdsCompleted:
      stats.holdsCompleted,

    holdsBroken:
      stats.holdsBroken,

    offsetSuggestion:
      getOffsetSuggestion(
        stats
      )
  });
}