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
 * Beat-based song charts for Outbyte.
 *
 * All difficulty levels share the same
 * backing track, BPM, key and offset.
 *
 * The note chart changes depending on
 * the selected difficulty.
 */
export const PRACTICE_SONG =
  Object.freeze({
    id: "outbyte",
    title: "Outbyte",
    artist: "Beat Mekanik",

    bpm: 120,

    timeSignature:
      Object.freeze([4, 4]),

    key: "A minor",

    /*
     * Approximate time, in seconds, of the
     * first musical beat in the backing track.
     */
    offset: 1.02,

    difficulties:
      Object.freeze({

        /*
         * EASY
         *
         * Notes are generally separated by
         * two beats, giving the player more
         * time to identify and press each key.
         */
        easy:
          Object.freeze([
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
          ]),

        /*
         * MEDIUM
         *
         * Notes generally occur every beat,
         * increasing the required reaction
         * speed and keyboard movement.
         */
        medium:
          Object.freeze([
            { note: "A4", beat: 5 },
            { note: "C5", beat: 6 },
            { note: "E5", beat: 7 },
            { note: "C5", beat: 8 },

            { note: "F4", beat: 9 },
            { note: "A4", beat: 10 },
            { note: "C5", beat: 11 },
            { note: "A4", beat: 12 },

            { note: "G4", beat: 13 },
            { note: "B4", beat: 14 },
            { note: "D5", beat: 15 },
            { note: "B4", beat: 16 },

            { note: "A4", beat: 17 },
            { note: "C5", beat: 18 },
            { note: "E5", beat: 19 },
            { note: "G5", beat: 20 },

            { note: "F#4", beat: 21 },
            { note: "A4", beat: 22 },
            { note: "C5", beat: 23 },
            { note: "E5", beat: 24 },

            { note: "G#4", beat: 25 },
            { note: "B4", beat: 26 },
            { note: "D5", beat: 27 }
          ]),

        /*
         * HARD
         *
         * Mostly one-beat spacing with
         * occasional half-beat bursts.
         *
         * This increases note density,
         * pitch range and rhythmic complexity
         * without making the level consistently
         * too fast for touchscreen play.
         */
        hard:
          Object.freeze([
            // Opening phrase
            { note: "A4", beat: 5 },
            { note: "C5", beat: 6 },
            { note: "E5", beat: 7 },
            { note: "A5", beat: 8 },

            // Descending response
            { note: "G5", beat: 9 },
            { note: "E5", beat: 10 },
            { note: "C5", beat: 11 },
            { note: "A4", beat: 12 },

            // First faster burst
            { note: "F4", beat: 13 },
            { note: "A4", beat: 14 },
            { note: "C5", beat: 14.5 },
            { note: "E5", beat: 15 },

            // Introduce a black key
            { note: "F#4", beat: 16 },
            { note: "A4", beat: 17 },
            { note: "C5", beat: 18 },
            { note: "E5", beat: 19 },

            // Faster two-note burst
            { note: "G4", beat: 20 },
            { note: "B4", beat: 21 },
            { note: "D5", beat: 21.5 },
            { note: "G5", beat: 22 },

            // More keyboard movement
            { note: "F#5", beat: 23 },
            { note: "D5", beat: 24 },
            { note: "B4", beat: 25 },
            { note: "G#4", beat: 26 },

            // Final challenge
            { note: "A4", beat: 27 },
            { note: "C5", beat: 27.5 },
            { note: "E5", beat: 28 },
            { note: "G5", beat: 29 },
            { note: "A5", beat: 30 }
          ])

      })
  });