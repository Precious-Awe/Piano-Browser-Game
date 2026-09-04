let synth = null;
let songPlayer = null;
let songStartTime = null;

export async function initialiseAudio() {
  await Tone.start();

  if (!synth) {
    synth = new Tone.Synth().toDestination();
  }
}

export function playNote(note) {
  if (!synth) {
    console.warn("Audio has not been initialised.");
    return;
  }

  synth.triggerAttackRelease(note, "8n");
}

export async function loadSong(url) {
  if (songPlayer) {
    songPlayer.dispose();
  }

  songPlayer = new Tone.Player(url).toDestination();

  await Tone.loaded();
}

export function startSong() {
  if (!songPlayer) {
    throw new Error("Song has not been loaded.");
  }

  songStartTime = Tone.now();
  songPlayer.start(songStartTime);
}

export function stopSong() {
  if (songPlayer) {
    songPlayer.stop();
  }

  songStartTime = null;
}

export function getSongTime() {
  if (songStartTime === null) {
    return 0;
  }

  return Tone.now() - songStartTime;
}