const STORAGE_KEY =
  "pianoTouchLeaderboard";

const MAX_ENTRIES = 10;


/*
 * Reads all leaderboard entries
 * from localStorage.
 */
function getAllLeaderboardEntries() {
  try {
    const storedData =
      localStorage.getItem(
        STORAGE_KEY
      );

    if (!storedData) {
      return [];
    }

    const parsedData =
      JSON.parse(
        storedData
      );

    if (!Array.isArray(parsedData)) {
      return [];
    }

    return parsedData;
  } catch (error) {
    console.error(
      "Could not load leaderboard:",
      error
    );

    return [];
  }
}


/*
 * Writes leaderboard data
 * to localStorage.
 */
function saveAllLeaderboardEntries(
  entries
) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(entries)
    );

    return true;
  } catch (error) {
    console.error(
      "Could not save leaderboard:",
      error
    );

    return false;
  }
}


/*
 * Saves a player's best result.
 *
 * Each player can only have one
 * entry per difficulty.
 *
 * If the player already exists,
 * their result is only updated
 * when their score improves.
 */
export function saveLeaderboardEntry({
  playerName,
  difficulty,
  score,
  accuracy,
  maxCombo
}) {
  const cleanName =
    playerName.trim();

  if (!cleanName) {
    return {
      saved: false,
      newBest: false
    };
  }

  if (score <= 0) {
  return {
    saved: false,
    newBest: false
  };
}

const leaderboard =
  getAllLeaderboardEntries();

  /*
   * Player names are compared
   * case-insensitively.
   *
   * "Solo" and "solo" are therefore
   * treated as the same player.
   */
  const existingIndex =
    leaderboard.findIndex(
      (entry) =>
        entry.difficulty ===
          difficulty &&
        entry.playerName
          .trim()
          .toLowerCase() ===
        cleanName.toLowerCase()
    );

  /*
   * First score for this player
   * on this difficulty.
   */
  if (existingIndex === -1) {
    leaderboard.push({
      playerName: cleanName,
      difficulty,
      score,
      accuracy,
      maxCombo,
      date:
        new Date()
          .toLocaleDateString(
            "en-GB"
          )
    });

    saveAllLeaderboardEntries(
      leaderboard
    );

    return {
      saved: true,
      newBest: true
    };
  }

  const existingEntry =
    leaderboard[
      existingIndex
    ];

  /*
   * Do not replace the player's
   * personal best with a lower
   * or equal score.
   */
  if (
    score <=
    existingEntry.score
  ) {
    return {
      saved: false,
      newBest: false
    };
  }

  /*
   * The player has beaten their
   * previous best.
   */
  leaderboard[
    existingIndex
  ] = {
    ...existingEntry,

    playerName: cleanName,
    score,
    accuracy,
    maxCombo,

    date:
      new Date()
        .toLocaleDateString(
          "en-GB"
        )
  };

  saveAllLeaderboardEntries(
    leaderboard
  );

  return {
    saved: true,
    newBest: true
  };
}


/*
 * Returns the top 10 DIFFERENT
 * players for one difficulty.
 */
export function getLeaderboard(
  difficulty
) {
  const leaderboard =
    getAllLeaderboardEntries();

  return leaderboard
    .filter(
      (entry) =>
        entry.difficulty ===
        difficulty
    )
    .sort(
      (a, b) => {
        /*
         * Highest score first.
         */
        if (
          b.score !==
          a.score
        ) {
          return (
            b.score -
            a.score
          );
        }

        /*
         * Accuracy breaks a tie.
         */
        if (
          b.accuracy !==
          a.accuracy
        ) {
          return (
            b.accuracy -
            a.accuracy
          );
        }

        /*
         * Highest combo is the
         * final tie-breaker.
         */
        return (
          b.maxCombo -
          a.maxCombo
        );
      }
    )
    .slice(
      0,
      MAX_ENTRIES
    );
}