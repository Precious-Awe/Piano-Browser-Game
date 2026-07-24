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
  const randomIndex = Math.floor(Math.random() * NOTES.length);
  return NOTES[randomIndex];
}