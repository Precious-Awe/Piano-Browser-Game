let synth = null;

let songPlayer = null;

let loadedSongUrl = null;


/*
 * Stores the position of the song
 * in seconds.
 *
 * This allows the song clock to stop
 * while the game is paused.
 */
let songPosition = 0;


/*
 * Stores the Tone.js time at which
 * the current playback period started.
 */
let songStartedAt = null;


/*
 * Tracks whether the backing song
 * is currently paused.
 */
let songPaused = false;


/*
 * Initialises the Web Audio system.
 *
 * Tone.start() must happen after a user
 * interaction because of browser autoplay
 * restrictions.
 */
export async function initialiseAudio() {
  await Tone.start();

  if (!synth) {
    synth =
      new Tone.Synth()
        .toDestination();
  }
}


/*
 * Plays the piano sound when the
 * player presses a key.
 */
export function playNote(note) {
  if (!synth) {
    console.warn(
      "Audio has not been initialised."
    );

    return;
  }

  synth.triggerAttackRelease(
    note,
    "8n"
  );
}


/*
 * Loads the selected backing track.
 *
 * The URL comes from the selected
 * song configuration in notes.js.
 *
 * For example:
 * ./audio/practice-song.mp3
 * ./audio/shadows-behind-neon.mp3
 * ./audio/galactic-spiritual-journey.mp3
 */
export async function loadSong(url) {
  if (!url) {
    throw new Error(
      "A song URL is required."
    );
  }


  /*
   * If this song is already loaded,
   * there is no need to load it again.
   */
  if (
    songPlayer &&
    loadedSongUrl === url
  ) {
    return;
  }


  /*
   * Stop and dispose of the previous
   * song before loading another one.
   */
  if (songPlayer) {
    try {
      songPlayer.stop();
    } catch (error) {
      // Player may already be stopped.
    }

    songPlayer.dispose();

    songPlayer = null;
  }


  /*
   * Reset all playback state because
   * a new song is being loaded.
   */
  songPosition = 0;

  songStartedAt = null;

  songPaused = false;

  loadedSongUrl = null;


  /*
   * Create the new Tone.Player.
   */
  songPlayer =
    new Tone.Player({
      url,
      autostart: false
    }).toDestination();


  /*
   * Wait until the audio file has
   * completely loaded.
   */
  await Tone.loaded();

  loadedSongUrl = url;
}


/*
 * Starts the currently loaded song
 * from the beginning.
 *
 * This also resets any previous
 * pause position.
 */
export function startSong() {
  if (!songPlayer) {
    throw new Error(
      "Song has not been loaded."
    );
  }


  /*
   * Stop the player first if it
   * happens to still be running.
   */
  if (songPlayer.state === "started") {
    songPlayer.stop();
  }


  /*
   * Starting a new game always begins
   * the backing track at the start.
   */
  songPosition = 0;

  songPaused = false;

  songStartedAt =
    Tone.now();


  songPlayer.start(
    songStartedAt,
    0
  );
}


/*
 * Pauses the currently playing song.
 *
 * The current playback position is
 * saved before stopping Tone.Player.
 *
 * This means the game's master clock
 * also freezes at exactly this point.
 */
export function pauseSong() {
  if (
    !songPlayer ||
    songStartedAt === null ||
    songPaused
  ) {
    return;
  }


  /*
   * Add the amount of time played
   * since the last start/resume.
   */
  songPosition +=
    Tone.now() -
    songStartedAt;


  try {
    songPlayer.stop();
  } catch (error) {
    // Player may already be stopped.
  }


  songStartedAt = null;

  songPaused = true;
}


/*
 * Resumes the backing track from the
 * exact position where it was paused.
 *
 * Tone.Player supports starting from
 * an offset within the loaded audio.
 */
export function resumeSong() {
  if (
    !songPlayer ||
    !songPaused
  ) {
    return;
  }


  songStartedAt =
    Tone.now();


  songPlayer.start(
    songStartedAt,
    songPosition
  );


  songPaused = false;
}


/*
 * Stops the backing track completely
 * and resets its playback position.
 *
 * This is different from pauseSong()
 * because Stop means the current game
 * session has finished or been reset.
 */
export function stopSong() {
  if (songPlayer) {
    try {
      songPlayer.stop();
    } catch (error) {
      // Player may already be stopped.
    }
  }


  songPosition = 0;

  songStartedAt = null;

  songPaused = false;
}


/*
 * Returns the current position of the
 * backing track in seconds.
 *
 * game.js uses this as the master clock
 * for:
 *
 * - falling notes
 * - note timing
 * - countdown timing
 * - hit judgements
 *
 * While paused, songPosition remains
 * unchanged, so the game clock freezes.
 */
export function getSongTime() {
  if (songPaused) {
    return songPosition;
  }


  if (songStartedAt === null) {
    return songPosition;
  }


  return (
    songPosition +
    (
      Tone.now() -
      songStartedAt
    )
  );
}


/*
 * Returns whether the backing song
 * is currently paused.
 */
export function isSongPaused() {
  return songPaused;
}


/*
 * Returns the URL of the currently
 * loaded song.
 *
 * This is useful when changing songs
 * without unnecessarily reloading the
 * same audio file.
 */
export function getLoadedSongUrl() {
  return loadedSongUrl;
}