// ==================================================
// PLAYABLE PIANO NOTES
// ==================================================

export const NOTES =
  Object.freeze([

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


// ==================================================
// RANDOM NOTE
// ==================================================

export function getRandomNote() {

  const randomIndex =
    Math.floor(
      Math.random() *
      NOTES.length
    );

  return NOTES[
    randomIndex
  ];
}


// ==================================================
// CHART NOTE HELPER
// ==================================================

function createChartNote(
  beat,
  note
) {

  return Object.freeze({
    beat,
    note
  });
}


// ==================================================
// REPEATING PATTERN HELPER
// ==================================================

/*
 * Creates a chart by repeatedly cycling
 * through a supplied melodic pattern.
 *
 * startBeat:
 * Beat on which gameplay begins.
 *
 * endBeat:
 * Final beat in the playable chart.
 *
 * beatStep:
 * Spacing between each target.
 *
 * Examples:
 *
 * 2   = one note every two beats
 * 1   = one note every beat
 * 0.5 = one note every half beat
 */
function buildPatternChart(
  startBeat,
  endBeat,
  beatStep,
  pattern
) {

  const chart = [];

  let patternIndex = 0;


  for (
    let beat = startBeat;
    beat <= endBeat;
    beat += beatStep
  ) {

    chart.push(
      createChartNote(
        beat,
        pattern[
          patternIndex %
          pattern.length
        ]
      )
    );


    patternIndex += 1;
  }


  return Object.freeze(
    chart
  );
}


// ==================================================
// SONG 1
//
// OUTBYTE
//
// BPM: 120
// Key used for gameplay: C major
// Time signature: 4/4
//
// Primary pitch collection:
//
// C – D – E – G – A
//
// This uses the C major pentatonic scale.
// ==================================================


// ==================================================
// OUTBYTE — EASY
// ==================================================

const OUTBYTE_EASY_CHART =
  Object.freeze([

    // Phrase 1

    createChartNote(5, "A4"),
    createChartNote(7, "G4"),
    createChartNote(9, "E4"),
    createChartNote(11, "G4"),

    createChartNote(13, "A4"),
    createChartNote(15, "C5"),
    createChartNote(17, "A4"),
    createChartNote(19, "G4"),


    // Phrase 2

    createChartNote(21, "E4"),
    createChartNote(23, "G4"),
    createChartNote(25, "A4"),
    createChartNote(27, "C5"),

    createChartNote(29, "A4"),
    createChartNote(31, "G4"),
    createChartNote(33, "E4"),
    createChartNote(35, "G4"),


    // Phrase 3

    createChartNote(37, "C5"),
    createChartNote(39, "A4"),
    createChartNote(41, "G4"),
    createChartNote(43, "E4"),

    createChartNote(45, "G4"),
    createChartNote(47, "A4"),
    createChartNote(49, "C5"),
    createChartNote(51, "A4"),


    // Phrase 4

    createChartNote(53, "D4"),
    createChartNote(55, "E4"),
    createChartNote(57, "G4"),
    createChartNote(59, "A4"),

    createChartNote(61, "G4"),
    createChartNote(63, "E4"),
    createChartNote(65, "D4"),
    createChartNote(67, "E4"),


    // Phrase 5

    createChartNote(69, "A4"),
    createChartNote(71, "C5"),
    createChartNote(73, "E5"),
    createChartNote(75, "C5"),

    createChartNote(77, "A4"),
    createChartNote(79, "G4"),
    createChartNote(81, "E4"),
    createChartNote(83, "G4"),


    // Phrase 6

    createChartNote(85, "C5"),
    createChartNote(87, "D5"),
    createChartNote(89, "E5"),
    createChartNote(91, "G5"),

    createChartNote(93, "E5"),
    createChartNote(95, "D5"),
    createChartNote(97, "C5"),
    createChartNote(99, "A4"),


    // Phrase 7

    createChartNote(101, "G4"),
    createChartNote(103, "A4"),
    createChartNote(105, "C5"),
    createChartNote(107, "E5"),

    createChartNote(109, "C5"),
    createChartNote(111, "A4"),
    createChartNote(113, "G4"),
    createChartNote(115, "E4"),


    // Phrase 8

    createChartNote(117, "E4"),
    createChartNote(119, "G4"),
    createChartNote(121, "A4"),
    createChartNote(123, "C5"),

    createChartNote(125, "E5"),
    createChartNote(127, "C5"),
    createChartNote(129, "A4"),
    createChartNote(131, "G4"),


    // Final section

    createChartNote(133, "A4"),
    createChartNote(135, "C5"),
    createChartNote(137, "E5"),
    createChartNote(139, "G5"),

    createChartNote(141, "E5"),
    createChartNote(143, "C5"),
    createChartNote(145, "A4"),
    createChartNote(147, "G4"),

    createChartNote(149, "E4"),
    createChartNote(151, "G4"),
    createChartNote(153, "A4"),
    createChartNote(155, "C5"),

    createChartNote(157, "E5"),
    createChartNote(159, "D5"),
    createChartNote(161, "C5"),
    createChartNote(163, "A4")

  ]);


// ==================================================
// OUTBYTE — MEDIUM
// ==================================================

const OUTBYTE_MEDIUM_PATTERN =
  Object.freeze([

    "A4",
    "G4",
    "E4",
    "G4",

    "A4",
    "C5",
    "E5",
    "C5",

    "A4",
    "G4",
    "E4",
    "D4",

    "E4",
    "G4",
    "A4",
    "C5",

    "D5",
    "E5",
    "G5",
    "E5",

    "C5",
    "A4",
    "G4",
    "E4",

    "G4",
    "A4",
    "C5",
    "E5",

    "D5",
    "C5",
    "A4",
    "G4"

  ]);


const OUTBYTE_MEDIUM_CHART =
  buildPatternChart(
    5,
    164,
    1,
    OUTBYTE_MEDIUM_PATTERN
  );


// ==================================================
// OUTBYTE — HARD
// ==================================================
/*
 * Hard is mainly one note per beat.
 *
 * It is made harder than Medium through:
 *
 * - wider jumps
 * - less predictable movement
 * - occasional half-beat targets
 *
 * This is intentionally less extreme than
 * the original Hard chart.
 */

const OUTBYTE_HARD_BASE_PATTERN =
  Object.freeze([

    "A4",
    "C5",
    "E5",
    "G5",

    "E5",
    "C5",
    "A4",
    "G4",

    "A4",
    "E5",
    "C5",
    "G5",

    "D5",
    "A4",
    "E5",
    "C5",

    "G4",
    "C5",
    "A5",
    "E5",

    "C5",
    "G5",
    "A4",
    "D5",

    "E4",
    "A4",
    "E5",
    "G5",

    "C5",
    "A5",
    "E5",
    "A4"

  ]);


const outbyteHardBase =
  buildPatternChart(
    5,
    164,
    1,
    OUTBYTE_HARD_BASE_PATTERN
  );


const OUTBYTE_HARD_EXTRA =
  Object.freeze([

    createChartNote(
      28.5,
      "E5"
    ),

    createChartNote(
      44.5,
      "A5"
    ),

    createChartNote(
      60.5,
      "G5"
    ),

    createChartNote(
      76.5,
      "E5"
    ),

    createChartNote(
      92.5,
      "A5"
    ),

    createChartNote(
      108.5,
      "G5"
    ),

    createChartNote(
      124.5,
      "E5"
    ),

    createChartNote(
      140.5,
      "A5"
    ),

    createChartNote(
      155.5,
      "G5"
    )

  ]);


const OUTBYTE_HARD_CHART =
  Object.freeze(
    [
      ...outbyteHardBase,
      ...OUTBYTE_HARD_EXTRA
    ].sort(
      (a, b) =>
        a.beat -
        b.beat
    )
  );


// ==================================================
// SONG 2
//
// SHADOWS BEHIND NEON
//
// BPM: 105
// Key: C minor
// Time signature: 4/4
//
// C minor pentatonic:
//
// C – Eb – F – G – Bb
//
// Because the keyboard is labelled using sharps:
//
// C – D# – F – G – A#
// ==================================================


// ==================================================
// SHADOWS — EASY
// ==================================================

const SHADOWS_EASY_PATTERN =
  Object.freeze([

    "C4",
    "D#4",
    "F4",
    "G4",

    "A#4",
    "G4",
    "F4",
    "D#4",

    "C4",
    "F4",
    "G4",
    "A#4",

    "C5",
    "A#4",
    "G4",
    "F4"

  ]);


const SHADOWS_EASY_CHART =
  buildPatternChart(
    5,
    157,
    2,
    SHADOWS_EASY_PATTERN
  );


// ==================================================
// SHADOWS — MEDIUM
// ==================================================

const SHADOWS_MEDIUM_PATTERN =
  Object.freeze([

    "C4",
    "D#4",
    "F4",
    "G4",

    "A#4",
    "C5",
    "A#4",
    "G4",

    "F4",
    "G4",
    "A#4",
    "C5",

    "D#5",
    "C5",
    "A#4",
    "G4",

    "F4",
    "D#4",
    "F4",
    "G4",

    "A#4",
    "G4",
    "F4",
    "C4",

    "D#4",
    "F4",
    "A#4",
    "C5",

    "A#4",
    "G4",
    "F4",
    "D#4"

  ]);


const SHADOWS_MEDIUM_CHART =
  buildPatternChart(
    5,
    157,
    1,
    SHADOWS_MEDIUM_PATTERN
  );


// ==================================================
// SHADOWS — HARD
// ==================================================

const SHADOWS_HARD_PATTERN =
  Object.freeze([

    "C4",
    "G4",
    "D#4",
    "A#4",

    "F4",
    "C5",
    "G4",
    "D#5",

    "A#4",
    "F4",
    "C5",
    "G4",

    "D#4",
    "A#4",
    "F4",
    "C5",

    "G4",
    "A#4",
    "D#5",
    "C5",

    "A#4",
    "G4",
    "F4",
    "D#4",

    "C4",
    "A#4",
    "F4",
    "C5",

    "D#5",
    "A#4",
    "G4",
    "F4"

  ]);


const shadowsHardBase =
  buildPatternChart(
    5,
    157,
    1,
    SHADOWS_HARD_PATTERN
  );


const SHADOWS_HARD_EXTRA =
  Object.freeze([

    createChartNote(
      28.5,
      "A#4"
    ),

    createChartNote(
      44.5,
      "D#5"
    ),

    createChartNote(
      60.5,
      "C5"
    ),

    createChartNote(
      76.5,
      "A#4"
    ),

    createChartNote(
      92.5,
      "D#5"
    ),

    createChartNote(
      108.5,
      "C5"
    ),

    createChartNote(
      124.5,
      "A#4"
    ),

    createChartNote(
      140.5,
      "D#5"
    )

  ]);


const SHADOWS_HARD_CHART =
  Object.freeze(
    [
      ...shadowsHardBase,
      ...SHADOWS_HARD_EXTRA
    ].sort(
      (a, b) =>
        a.beat -
        b.beat
    )
  );


// ==================================================
// SONG 3
//
// GALACTIC SPIRITUAL JOURNEY
//
// BPM: 100
// Key: G minor
// Time signature: 4/4
//
// G minor pentatonic:
//
// G – Bb – C – D – F
//
// Bb is represented as A# on the
// game's keyboard.
//
// Therefore:
//
// G – A# – C – D – F
// ==================================================


// ==================================================
// GALACTIC — EASY
// ==================================================

const GALACTIC_EASY_PATTERN =
  Object.freeze([

    "G4",
    "A#4",
    "C5",
    "D5",

    "F5",
    "D5",
    "C5",
    "A#4",

    "G4",
    "C5",
    "D5",
    "A#4",

    "G4",
    "A#4",
    "C5",
    "G4"

  ]);


const GALACTIC_EASY_CHART =
  buildPatternChart(
    5,
    133,
    2,
    GALACTIC_EASY_PATTERN
  );


// ==================================================
// GALACTIC — MEDIUM
// ==================================================

const GALACTIC_MEDIUM_PATTERN =
  Object.freeze([

    "G4",
    "A#4",
    "C5",
    "D5",

    "F5",
    "D5",
    "C5",
    "A#4",

    "G4",
    "A#4",
    "C5",
    "D5",

    "F5",
    "G5",
    "F5",
    "D5",

    "C5",
    "A#4",
    "G4",
    "C5",

    "D5",
    "F5",
    "D5",
    "C5",

    "A#4",
    "C5",
    "D5",
    "F5",

    "D5",
    "C5",
    "A#4",
    "G4"

  ]);


const GALACTIC_MEDIUM_CHART =
  buildPatternChart(
    5,
    133,
    1,
    GALACTIC_MEDIUM_PATTERN
  );


// ==================================================
// GALACTIC — HARD
// ==================================================

const GALACTIC_HARD_PATTERN =
  Object.freeze([

    "G4",
    "D5",
    "A#4",
    "F5",

    "C5",
    "G5",
    "D5",
    "A#4",

    "G4",
    "C5",
    "F5",
    "D5",

    "A#4",
    "G5",
    "C5",
    "F5",

    "D5",
    "A#4",
    "G4",
    "C5",

    "F5",
    "D5",
    "G5",
    "C5",

    "A#4",
    "D5",
    "F5",
    "C5",

    "G4",
    "A#4",
    "D5",
    "G5"

  ]);


const galacticHardBase =
  buildPatternChart(
    5,
    133,
    1,
    GALACTIC_HARD_PATTERN
  );


const GALACTIC_HARD_EXTRA =
  Object.freeze([

    createChartNote(
      24.5,
      "F5"
    ),

    createChartNote(
      40.5,
      "D5"
    ),

    createChartNote(
      56.5,
      "G5"
    ),

    createChartNote(
      72.5,
      "F5"
    ),

    createChartNote(
      88.5,
      "D5"
    ),

    createChartNote(
      104.5,
      "G5"
    ),

    createChartNote(
      120.5,
      "F5"
    )

  ]);


const GALACTIC_HARD_CHART =
  Object.freeze(
    [
      ...galacticHardBase,
      ...GALACTIC_HARD_EXTRA
    ].sort(
      (a, b) =>
        a.beat -
        b.beat
    )
  );


// ==================================================
// SONG CONFIGURATION 1
//
// OUTBYTE
// ==================================================

export const OUTBYTE =
  Object.freeze({

    id:
      "outbyte",

    title:
      "Outbyte",

    artist:
      "Beat Mekanik",

    audioPath:
      "./audio/practice-song.mp3",

    bpm:
      120,

    key:
      "C major",

    timeSignature:
      Object.freeze([
        4,
        4
      ]),

    /*
     * First musical beat is approximately
     * 1.02 seconds into the audio.
     *
     * Gameplay begins from Beat 5,
     * providing reaction time before
     * the first target reaches the keyboard.
     */
    offset:
      1.02,

    difficulties:
      Object.freeze({

        easy:
          OUTBYTE_EASY_CHART,

        medium:
          OUTBYTE_MEDIUM_CHART,

        hard:
          OUTBYTE_HARD_CHART

      })

  });


// ==================================================
// SONG CONFIGURATION 2
//
// SHADOWS BEHIND NEON
// ==================================================

export const SHADOWS_BEHIND_NEON =
  Object.freeze({

    id:
      "shadows-behind-neon",

    title:
      "Shadows Behind Neon",

    artist:
      "StockTune",

    audioPath:
      "./audio/shadows-behind-neon.mp3",

    bpm:
      105,

    key:
      "C minor",

    timeSignature:
      Object.freeze([
        4,
        4
      ]),

    /*
     * Initial timing value.
     *
     * We will adjust this single value
     * after testing if the complete chart
     * is consistently early or late.
     */
    offset:
      0,

    difficulties:
      Object.freeze({

        easy:
          SHADOWS_EASY_CHART,

        medium:
          SHADOWS_MEDIUM_CHART,

        hard:
          SHADOWS_HARD_CHART

      })

  });


// ==================================================
// SONG CONFIGURATION 3
//
// GALACTIC SPIRITUAL JOURNEY
// ==================================================

export const GALACTIC_SPIRITUAL_JOURNEY =
  Object.freeze({

    id:
      "galactic-spiritual-journey",

    title:
      "Galactic Spiritual Journey",

    artist:
      "StockTune",

    audioPath:
      "./audio/galactic-spiritual-journey.mp3",

    bpm:
      100,

    key:
      "G minor",

    timeSignature:
      Object.freeze([
        4,
        4
      ]),

    /*
     * Initial timing value.
     *
     * This can be calibrated after
     * the first gameplay test.
     */
    offset:
      0,

    difficulties:
      Object.freeze({

        easy:
          GALACTIC_EASY_CHART,

        medium:
          GALACTIC_MEDIUM_CHART,

        hard:
          GALACTIC_HARD_CHART

      })

  });


// ==================================================
// COMPLETE SONG LIBRARY
// ==================================================

export const SONGS =
  Object.freeze({

    outbyte:
      OUTBYTE,

    "shadows-behind-neon":
      SHADOWS_BEHIND_NEON,

    "galactic-spiritual-journey":
      GALACTIC_SPIRITUAL_JOURNEY

  });


// ==================================================
// GET SONG BY ID
// ==================================================

export function getSongById(
  songId
) {

  return (
    SONGS[
      songId
    ] ||
    null
  );
}


// ==================================================
// GET ALL SONGS
// ==================================================

export function getAllSongs() {

  return Object.values(
    SONGS
  );
}


// ==================================================
// BACKWARDS COMPATIBILITY
// ==================================================

/*
 * Retained because older parts of the
 * project may still import PRACTICE_SONG.
 */
export const PRACTICE_SONG =
  OUTBYTE;