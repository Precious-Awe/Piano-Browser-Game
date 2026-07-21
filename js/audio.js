let synth = null;

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