// ==================================================
// LEADERBOARD
// ==================================================
//
// Scores are separated by:
//
// 1. Song
// 2. Difficulty
//
// Example:
//
// outbyte
//   easy
//   medium
//   hard
//
// shadows-behind-neon
//   easy
//   medium
//   hard
//
// galactic-spiritual-journey
//   easy
//   medium
//   hard
//
// Only the player's BEST score is retained
// for each song/difficulty combination.
//
// Player names are compared case-insensitively.
//
// Maximum:
// Top 10 players per song/difficulty.
// ==================================================


const STORAGE_KEY =
  "pianoTouchLeaderboardV2";


const MAX_ENTRIES =
  10;


// ==================================================
// READ ALL LEADERBOARD DATA
// ==================================================

function loadLeaderboardData() {

  try {

    const storedData =
      localStorage.getItem(
        STORAGE_KEY
      );


    if (!storedData) {

      return {};

    }


    const parsedData =
      JSON.parse(
        storedData
      );


    if (
      !parsedData ||
      typeof parsedData !==
        "object"
    ) {

      return {};

    }


    return parsedData;

  } catch (error) {

    console.error(
      "Could not read leaderboard:",
      error
    );


    return {};

  }
}


// ==================================================
// SAVE ALL LEADERBOARD DATA
// ==================================================

function saveLeaderboardData(
  leaderboardData
) {

  try {

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(
        leaderboardData
      )
    );

  } catch (error) {

    console.error(
      "Could not save leaderboard:",
      error
    );

  }
}


// ==================================================
// NORMALISE PLAYER NAME
// ==================================================

function normalisePlayerName(
  playerName
) {

  return playerName
    .trim()
    .toLowerCase();
}


// ==================================================
// GET LEADERBOARD
// ==================================================

export function getLeaderboard(
  songId,
  difficulty
) {

  if (
    !songId ||
    !difficulty
  ) {

    return [];

  }


  const leaderboardData =
    loadLeaderboardData();


  const songData =
    leaderboardData[
      songId
    ];


  if (!songData) {

    return [];

  }


  const entries =
    songData[
      difficulty
    ];


  if (
    !Array.isArray(
      entries
    )
  ) {

    return [];

  }


  return [
    ...entries
  ].sort(
    (a, b) =>
      b.score -
      a.score
  );
}


// ==================================================
// SAVE LEADERBOARD ENTRY
// ==================================================

export function saveLeaderboardEntry({
  playerName,
  songId,
  difficulty,
  score,
  accuracy,
  maxCombo
}) {

  if (
    !playerName ||
    !songId ||
    !difficulty
  ) {

    console.warn(
      "Leaderboard entry was not saved because required information was missing."
    );

    return;

  }


  const leaderboardData =
    loadLeaderboardData();


  // ----------------------------------------------
  // Create song section if required.
  // ----------------------------------------------

  if (
    !leaderboardData[
      songId
    ]
  ) {

    leaderboardData[
      songId
    ] = {};

  }


  // ----------------------------------------------
  // Create difficulty section if required.
  // ----------------------------------------------

  if (
    !Array.isArray(
      leaderboardData[
        songId
      ][
        difficulty
      ]
    )
  ) {

    leaderboardData[
      songId
    ][
      difficulty
    ] = [];

  }


  const entries =
    leaderboardData[
      songId
    ][
      difficulty
    ];


  const normalisedName =
    normalisePlayerName(
      playerName
    );


  // ----------------------------------------------
  // Find an existing entry for this player.
  //
  // Solomon and SOLOMON should be treated
  // as the same player.
  // ----------------------------------------------

  const existingEntryIndex =
    entries.findIndex(
      (entry) => {

        if (
          !entry.playerName
        ) {

          return false;

        }


        return (
          normalisePlayerName(
            entry.playerName
          ) ===
          normalisedName
        );

      }
    );


  const newEntry = {

    playerName:
      playerName.trim(),

    score:
      Number(
        score
      ) || 0,

    accuracy:
      Number(
        accuracy
      ) || 0,

    maxCombo:
      Number(
        maxCombo
      ) || 0

  };


  // ----------------------------------------------
  // Existing player.
  //
  // Only replace their entry if their new
  // score is better than their old one.
  // ----------------------------------------------

  if (
    existingEntryIndex !==
    -1
  ) {

    const existingEntry =
      entries[
        existingEntryIndex
      ];


    if (
      newEntry.score >
      existingEntry.score
    ) {

      entries[
        existingEntryIndex
      ] =
        newEntry;

    }

  } else {

    // New player.

    entries.push(
      newEntry
    );

  }


  // ----------------------------------------------
  // Highest score first.
  // ----------------------------------------------

  entries.sort(
    (a, b) =>
      b.score -
      a.score
  );


  // ----------------------------------------------
  // Keep only the top 10.
  // ----------------------------------------------

  leaderboardData[
    songId
  ][
    difficulty
  ] =
    entries.slice(
      0,
      MAX_ENTRIES
    );


  saveLeaderboardData(
    leaderboardData
  );
}


// ==================================================
// OPTIONAL CLEAR FUNCTION
// ==================================================

export function clearLeaderboard() {

  try {

    localStorage.removeItem(
      STORAGE_KEY
    );

  } catch (error) {

    console.error(
      "Could not clear leaderboard:",
      error
    );

  }

}