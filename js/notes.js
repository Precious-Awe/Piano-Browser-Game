export const NOTES = Object.freeze([
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
  "C5"
]);

export function getRandomNote() {
  const randomIndex =
    Math.floor(Math.random() * NOTES.length);

  return NOTES[randomIndex];
}

/*
 * First structured song chart.
 *
 * `time` represents the intended hit time,
 * measured in seconds from the start of the song.
 */
export const PRACTICE_SONG = Object.freeze({
  id: "practice-song",
  title: "Practice Song",
  bpm: 120,
  difficulty: "Easy",

  notes: Object.freeze([
    { note: "C4", time: 2.0 },
    { note: "D4", time: 3.0 },
    { note: "E4", time: 4.0 },
    { note: "F4", time: 5.0 },
    { note: "G4", time: 6.0 },
    { note: "A4", time: 7.0 },
    { note: "B4", time: 8.0 },
    { note: "C5", time: 9.0 },

    { note: "B4", time: 10.0 },
    { note: "A4", time: 11.0 },
    { note: "G4", time: 12.0 },
    { note: "F4", time: 13.0 },
    { note: "E4", time: 14.0 },
    { note: "D4", time: 15.0 },
    { note: "C4", time: 16.0 }
  ])
});