let synth = null;


/*
 * Real piano sound (Salamander Grand
 * Piano samples hosted by Tone.js).
 * Loads in the background; the plain
 * synth is used until it is ready or
 * if it fails to load.
 */
const PIANO_SAMPLE_URL =
  "https://tonejs.github.io/audio/salamander/";

let piano = null;

let pianoLoaded = false;

let songPlayer = null;

/*
 * The audio file URL, or the song id
 * for a generated backing track.
 */
let loadedSongKey = null;


/*
 * Stores the position of the song
 * in seconds.
 *
 * This allows the song clock to stop
 * while the game is paused.
 */
let songPosition = 0;


/*
 * Stores the audio-clock time at which
 * the current playback period started.
 *
 * Playback is scheduled at Tone.now(),
 * which is slightly in the future
 * (Tone's lookAhead), so this may be
 * ahead of Tone.immediate() for the
 * first ~0.1s.
 */
let songStartedAt = null;


/*
 * Tracks whether the backing song
 * is currently paused.
 */
let songPaused = false;


/*
 * Player-set delay in milliseconds
 * between the audio clock and when
 * the player hears the music.
 *
 * Browsers under-report the delay of
 * Bluetooth headphones, so the player
 * can correct it. Saved per browser.
 */
const AUDIO_OFFSET_KEY =
  "pianoTouchAudioOffset";

let audioOffsetMs =
  loadAudioOffset();


function loadAudioOffset() {
  try {
    return (
      Number(
        localStorage.getItem(
          AUDIO_OFFSET_KEY
        )
      ) || 0
    );
  } catch (error) {
    return 0;
  }
}


export function getAudioOffset() {
  return audioOffsetMs;
}


export function setAudioOffset(
  offsetMs
) {
  audioOffsetMs =
    Math.round(
      offsetMs
    );

  try {
    localStorage.setItem(
      AUDIO_OFFSET_KEY,
      String(audioOffsetMs)
    );
  } catch (error) {
    // Storage may be unavailable.
  }
}


/*
 * Creates the instruments and starts
 * downloading the piano samples.
 *
 * Called when the page loads, so the
 * samples are decoded before a game
 * starts rather than during it.
 */
export function preloadAudio() {
  createBackingInstruments();

  if (!synth) {
    synth =
      new Tone.PolySynth(
        Tone.Synth
      ).toDestination();
  }


  if (!piano) {
    piano =
      new Tone.Sampler({
        urls: {
          C4: "C4.mp3",
          "D#4": "Ds4.mp3",
          "F#4": "Fs4.mp3",
          A4: "A4.mp3",
          C5: "C5.mp3",
          "D#5": "Ds5.mp3",
          "F#5": "Fs5.mp3",
          A5: "A5.mp3",
          C6: "C6.mp3"
        },

        baseUrl:
          PIANO_SAMPLE_URL,

        release: 1,

        onload: () => {
          pianoLoaded = true;
        },

        onerror: (error) => {
          console.warn(
            "Piano samples could not be loaded. Using synth instead.",
            error
          );
        }
      }).toDestination();
  }
}


/*
 * Initialises the Web Audio system.
 *
 * Tone.start() must happen after a user
 * interaction because of browser autoplay
 * restrictions.
 */
export async function initialiseAudio() {
  preloadAudio();

  await Tone.start();
}


/*
 * Plays the piano sound when the
 * player presses a key.
 *
 * Uses Tone.immediate() so the sound
 * starts straight away. Tone's default
 * (Tone.now()) would add ~0.1s delay.
 */
export function playNote(
  note,
  time = Tone.immediate()
) {
  if (!synth) {
    console.warn(
      "Audio has not been initialised."
    );

    return;
  }

  if (pianoLoaded) {
    piano.triggerAttackRelease(
      note,
      "2n",
      time
    );

    return;
  }


  synth.triggerAttackRelease(
    note,
    "8n",
    time
  );
}


/*
 * Starts a note and holds it until
 * stopNote(), for long notes.
 */
export function startNote(note) {
  if (!synth) {
    return;
  }

  const time =
    Tone.immediate();

  if (pianoLoaded) {
    piano.triggerAttack(
      note,
      time
    );
  } else {
    synth.triggerAttack(
      note,
      time
    );
  }
}


export function stopNote(note) {
  if (!synth) {
    return;
  }

  const time =
    Tone.immediate();

  if (pianoLoaded) {
    piano.triggerRelease(
      note,
      time
    );
  } else {
    synth.triggerRelease(
      note,
      time
    );
  }
}


/*
 * Plays a note so that the player
 * hears it at a given point in the
 * song (in seconds), in time with the
 * backing track.
 *
 * Used for the melody notes between
 * tiles on Easy and Medium.
 */
export function playNoteAtSongTime(
  note,
  songTimeSeconds
) {
  const delay =
    songTimeSeconds -
    getSongTime() -
    getOutputLatency();

  playNote(
    note,
    Tone.immediate() +
      Math.max(delay, 0)
  );
}


/*
 * =============================
 * GENERATED BACKING TRACKS
 * =============================
 *
 * Songs with a backing score (Für Elise)
 * have no MP3. Their left-hand piano and
 * drums are played live from the score,
 * scheduled a fraction of a second ahead
 * on the same clock as the game, so the
 * beat and the notes cannot drift apart.
 */

const BACKING_PIANO_SAMPLES = {
  A1: "A1.mp3",
  C2: "C2.mp3",
  "D#2": "Ds2.mp3",
  "F#2": "Fs2.mp3",
  A2: "A2.mp3",
  C3: "C3.mp3",
  "D#3": "Ds3.mp3",
  "F#3": "Fs3.mp3",
  A3: "A3.mp3",
  C4: "C4.mp3",
  "D#4": "Ds4.mp3"
};


/*
 * How far ahead events are scheduled.
 * Large enough that a slow frame or a
 * garbage-collection pause cannot make
 * the backing skip notes.
 */
const BACKING_SCHEDULE_AHEAD = 1;

// Events up to this late still play.
const BACKING_LATE_TOLERANCE = 0.05;

// How often the scheduler runs.
const BACKING_TICK_MS = 25;


/*
 * All backing instruments play through
 * this gain, so pausing can silence
 * events that were already queued.
 */
let backingBus = null;

let backingKeys = null;

let backingKeysLoaded = false;

// Used if the backing samples fail.
let backingSynth = null;

let kick = null;

let hat = null;


/*
 * The loaded song's backing events,
 * sorted by time in seconds, or null
 * when the song is an MP3.
 */
let backingEvents = null;

let backingIndex = 0;

let backingTimer = null;


function createBackingInstruments() {
  if (backingKeys) {
    return;
  }


  backingBus =
    new Tone.Gain(1)
      .toDestination();


  backingKeys =
    new Tone.Sampler({
      urls: BACKING_PIANO_SAMPLES,
      baseUrl: PIANO_SAMPLE_URL,
      release: 1,
      volume: -4,

      onload: () => {
        backingKeysLoaded = true;
      },

      onerror: (error) => {
        console.warn(
          "Backing piano samples could not be loaded. Using synth instead.",
          error
        );
      }
    }).connect(backingBus);


  backingSynth =
    new Tone.PolySynth(
      Tone.Synth,
      { volume: -10 }
    ).connect(backingBus);


  kick =
    new Tone.MembraneSynth({
      volume: -8
    }).connect(backingBus);


  const hatFilter =
    new Tone.Filter(
      7000,
      "highpass"
    ).connect(backingBus);

  hat =
    new Tone.NoiseSynth({
      volume: -26,
      envelope: {
        attack: 0.001,
        decay: 0.05,
        sustain: 0
      }
    }).connect(hatFilter);
}


/*
 * Converts the score's beats into a
 * single list of timed events.
 */
function buildBackingEvents(song) {
  const secondsPerBeat =
    60 / song.bpm;

  const timeOf =
    (beat) =>
      song.offset +
      (beat - 1) * secondsPerBeat;


  const events = [
    ...song.backing.left.map(
      ({ beat, note }) => ({
        time: timeOf(beat),
        note,
        duration: secondsPerBeat * 1.5
      })
    ),

    ...song.backing.drums.map(
      ({ beat, sound }) => ({
        time: timeOf(beat),
        sound
      })
    )
  ];


  return events.sort(
    (a, b) => a.time - b.time
  );
}


function playBackingEvent(
  event,
  time
) {
  if (event.sound === "kick") {
    kick.triggerAttackRelease(
      "C1",
      "8n",
      time
    );

    return;
  }


  if (event.sound === "hat") {
    hat.triggerAttackRelease(
      "32n",
      time
    );

    return;
  }


  if (backingKeysLoaded) {
    backingKeys.triggerAttackRelease(
      event.note,
      event.duration,
      time,
      0.6
    );
  } else {
    backingSynth.triggerAttackRelease(
      event.note,
      event.duration,
      time,
      0.6
    );
  }
}


/*
 * Schedules every backing event due in
 * the next BACKING_SCHEDULE_AHEAD
 * seconds.
 *
 * A song position maps to audio time
 * exactly as it does for Tone.Player:
 * songStartedAt + (position - songPosition).
 */
function scheduleBacking() {
  if (
    !backingEvents ||
    songStartedAt === null
  ) {
    return;
  }


  const now =
    Tone.immediate();

  const scheduleUntil =
    songPosition +
    (now - songStartedAt) +
    BACKING_SCHEDULE_AHEAD;


  while (
    backingIndex < backingEvents.length &&
    backingEvents[backingIndex].time <= scheduleUntil
  ) {
    const event =
      backingEvents[backingIndex];

    backingIndex += 1;


    const time =
      songStartedAt +
      (event.time - songPosition);


    /*
     * Skip events that are well in the
     * past (e.g. the tab was in the
     * background); play slightly late
     * ones straight away.
     */
    if (time >= now - BACKING_LATE_TOLERANCE) {
      playBackingEvent(
        event,
        Math.max(time, now)
      );
    }
  }
}


/*
 * Starts the scheduler, from the first
 * event on a new game, or from where
 * stopBacking() left off on resume.
 */
function startBacking(
  fromStart
) {
  if (!backingEvents) {
    return;
  }


  stopBacking();


  if (fromStart) {
    backingIndex = 0;
  }


  /*
   * Unmute when playback (re)starts.
   */
  backingBus.gain.cancelScheduledValues(
    Tone.immediate()
  );

  backingBus.gain.setValueAtTime(
    1,
    songStartedAt
  );


  scheduleBacking();

  backingTimer =
    setInterval(
      scheduleBacking,
      BACKING_TICK_MS
    );
}


/*
 * Stops the scheduler and silences
 * anything already queued.
 *
 * Queued events after songPosition
 * are rewound so they play again on
 * resume.
 */
function stopBacking() {
  if (backingTimer !== null) {
    clearInterval(
      backingTimer
    );
  }

  backingTimer = null;


  if (backingBus) {
    const now =
      Tone.immediate();

    backingBus.gain.cancelScheduledValues(
      now
    );

    backingBus.gain.setValueAtTime(
      0,
      now
    );
  }


  if (backingEvents) {
    while (
      backingIndex > 0 &&
      backingEvents[backingIndex - 1].time >= songPosition
    ) {
      backingIndex -= 1;
    }
  }


  if (backingKeys) {
    backingKeys.releaseAll();
  }
}


/*
 * Loads the selected song's backing
 * track from notes.js.
 *
 * Songs either have an audioPath
 * (e.g. ./audio/practice-song.mp3) or
 * a backing score that is played live
 * (e.g. Für Elise).
 */
export async function loadSong(song) {
  if (
    !song ||
    (!song.audioPath && !song.backing)
  ) {
    throw new Error(
      "The song has no audio or backing score."
    );
  }


  const songKey =
    song.audioPath || song.id;


  /*
   * If this song is already loaded,
   * there is no need to load it again.
   */
  if (loadedSongKey === songKey) {
    return;
  }


  /*
   * Stop and dispose of the previous
   * song before loading another one.
   */
  stopBacking();

  backingEvents = null;


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

  loadedSongKey = null;


  if (song.backing) {
    backingEvents =
      buildBackingEvents(song);
  } else {
    songPlayer =
      new Tone.Player()
        .toDestination();

    /*
     * Wait until the audio file has
     * completely loaded.
     *
     * This waits for the song only, not
     * Tone.loaded(), so a slow or failed
     * piano sample download cannot block
     * the game from starting.
     */
    await songPlayer.load(
      song.audioPath
    );
  }

  loadedSongKey = songKey;
}


/*
 * Starts the currently loaded song
 * from the beginning.
 *
 * This also resets any previous
 * pause position.
 */
export function startSong() {
  if (
    !songPlayer &&
    !backingEvents
  ) {
    throw new Error(
      "Song has not been loaded."
    );
  }


  /*
   * Stop the player first if it
   * happens to still be running.
   */
  if (
    songPlayer &&
    songPlayer.state === "started"
  ) {
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


  if (songPlayer) {
    songPlayer.start(
      songStartedAt,
      0
    );
  }

  startBacking(true);
}


/*
 * Pauses the currently playing song.
 *
 * The current playback position is
 * saved before stopping playback.
 *
 * This means the game's master clock
 * also freezes at exactly this point.
 */
export function pauseSong() {
  if (
    (!songPlayer && !backingEvents) ||
    songStartedAt === null ||
    songPaused
  ) {
    return;
  }


  /*
   * Add the amount of time played
   * since the last start/resume.
   */
  songPosition =
    Math.max(
      songPosition +
        (
          Tone.immediate() -
          songStartedAt
        ),
      0
    );


  if (songPlayer) {
    try {
      songPlayer.stop();
    } catch (error) {
      // Player may already be stopped.
    }
  }

  stopBacking();


  songStartedAt = null;

  songPaused = true;
}


/*
 * Resumes the backing track from the
 * exact position where it was paused.
 *
 * Tone.Player supports starting from
 * an offset within the loaded audio;
 * a generated backing restarts its
 * scheduler from the same position.
 */
export function resumeSong() {
  if (
    (!songPlayer && !backingEvents) ||
    !songPaused
  ) {
    return;
  }


  songStartedAt =
    Tone.now();


  if (songPlayer) {
    songPlayer.start(
      songStartedAt,
      songPosition
    );
  }


  songPaused = false;

  startBacking(false);
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

  stopBacking();


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
  /*
   * Playback resumes at Tone.now(),
   * which is lookAhead in the future, so
   * the lookAhead is included here to
   * stop the clock jumping back on
   * resume.
   */
  if (songPaused) {
    return (
      songPosition -
      Tone.getContext().lookAhead -
      getOutputLatency()
    );
  }


  if (songStartedAt === null) {
    return songPosition;
  }


  /*
   * Tone.immediate() is the audio clock
   * right now. Tone.now() would add the
   * lookAhead and run the game ~0.1s
   * ahead of the music.
   *
   * The output latency is subtracted so
   * the game matches what the player
   * actually hears (larger on Bluetooth
   * headphones).
   */
  return (
    songPosition +
    (
      Tone.immediate() -
      songStartedAt
    ) -
    getOutputLatency()
  );
}


/*
 * Returns the delay in seconds between
 * the audio clock and the sound coming
 * out of the speakers.
 */
function getOutputLatency() {
  const rawContext =
    Tone.getContext().rawContext;

  const reportedLatency =
    rawContext.outputLatency ||
    rawContext.baseLatency ||
    0;

  return (
    reportedLatency +
    audioOffsetMs / 1000
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
 * Returns the audio URL (or song id)
 * of the currently loaded song.
 *
 * This is useful when changing songs
 * without unnecessarily reloading the
 * same audio file.
 */
export function getLoadedSongUrl() {
  return loadedSongKey;
}