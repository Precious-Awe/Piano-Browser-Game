export const NOTES = Object.freeze([
  // Octave 4
  "C4",
  "C#4",
  "D4",
  "D#4",
  "E4",
  "F4",
  "F#4",
  "G4",
  "G#4",
  "A4",
  "A#4",
  "B4",

  // Octave 5
  "C5",
  "C#5",
  "D5",
  "D#5",
  "E5",
  "F5",
  "F#5",
  "G5",
  "G#5",
  "A5",
  "A#5",
  "B5"
]);

export function getRandomNote() {
  const randomIndex =
    Math.floor(
      Math.random() *
      NOTES.length
    );

  return NOTES[randomIndex];
}

/*
 * Beat-based song chart for Outbyte.
 *
 * `beat` identifies the musical beat on which
 * the falling note should reach the hit line.
 *
 * BPM and offset are used by game.js to
 * convert each beat into an exact hit time.
 */
export const PRACTICE_SONG =
  Object.freeze({
    id: "outbyte-easy",
    title: "Outbyte",
    artist: "Beat Mekanik",

    bpm: 120,

    timeSignature:
      Object.freeze([4, 4]),

    key: "A minor",
    difficulty: "Easy",

    /*
     * Approximate time, in seconds, of the
     * first musical beat in the backing track.
     *
     * We can fine-tune this by listening and
     * testing against the actual audio.
     */
    offset: 1.02,

    notes: Object.freeze([
      { note: "A4", beat: 5 },
      { note: "C5", beat: 7 },
      { note: "E5", beat: 9 },

      { note: "F4", beat: 11 },
      { note: "A4", beat: 13 },
      { note: "C5", beat: 15 },

      { note: "G4", beat: 17 },
      { note: "B4", beat: 19 },
      { note: "D5", beat: 21 },

      { note: "A4", beat: 23 },
      { note: "C5", beat: 25 },
      { note: "E5", beat: 27 }
    ])
  });