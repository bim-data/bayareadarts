import { Course, GameFormat, HoleScore, PlayerRoundData } from '../types';

/**
 * Calculates USGA / WHS Handicap Differential
 * Formula: (113 / Slope Rating) * (Adjusted Gross Score - Course Rating)
 */
export function calculateDifferential(
  grossScore: number,
  courseRating: number,
  slopeRating: number
): number {
  if (slopeRating <= 0) return 0;
  const diff = (113 / slopeRating) * (grossScore - courseRating);
  return Math.round(diff * 10) / 10;
}

/**
 * Calculates Course Handicap based on player's Handicap Index
 * Formula: Handicap Index * (Slope / 113) + (Course Rating - Par)
 */
export function calculateCourseHandicap(
  handicapIndex: number,
  courseRating: number,
  slopeRating: number,
  coursePar: number
): number {
  if (slopeRating <= 0) return Math.round(handicapIndex);
  const ch = handicapIndex * (slopeRating / 113) + (courseRating - coursePar);
  return Math.round(ch);
}

/**
 * Calculates strokes given on a specific hole based on course handicap and hole handicap index (1-18)
 */
export function getHoleHandicapStrokes(courseHandicap: number, holeHandicapIndex: number): number {
  let strokes = 0;
  if (courseHandicap > 0) {
    if (courseHandicap >= holeHandicapIndex) strokes += 1;
    if (courseHandicap >= holeHandicapIndex + 18) strokes += 1;
    if (courseHandicap >= holeHandicapIndex + 36) strokes += 1;
  } else if (courseHandicap < 0) {
    // Plus handicap gives strokes back on easiest holes (18 down)
    const plusHandicap = Math.abs(courseHandicap);
    const inverseHoleRank = 19 - holeHandicapIndex;
    if (plusHandicap >= inverseHoleRank) strokes -= 1;
  }
  return strokes;
}

/**
 * Calculates net score for a hole
 */
export function calculateHoleNetScore(
  grossStrokes: number,
  courseHandicap: number,
  holeHandicapIndex: number
): number {
  if (grossStrokes <= 0) return 0;
  const hcpStrokes = getHoleHandicapStrokes(courseHandicap, holeHandicapIndex);
  return Math.max(1, grossStrokes - hcpStrokes);
}

/**
 * Calculates Official WHS Handicap Index from an array of differentials
 * Uses the lowest 8 of the last 20 differentials (with standard USGA table for fewer rounds)
 */
export function calculateHandicapIndexFromDifferentials(differentials: number[]): {
  index: number;
  usedIndices: number[];
} {
  if (!differentials || differentials.length === 0) {
    return { index: 0, usedIndices: [] };
  }

  // Take most recent 20 rounds max
  const recentDiffs = differentials.slice(0, 20);
  const indexed = recentDiffs.map((diff, originalIdx) => ({ diff, originalIdx }));
  indexed.sort((a, b) => a.diff - b.diff);

  const count = recentDiffs.length;
  let numToUse = 1;
  let adjustment = 0;

  if (count <= 3) {
    numToUse = 1;
    adjustment = -2.0;
  } else if (count === 4) {
    numToUse = 1;
    adjustment = -1.0;
  } else if (count === 5) {
    numToUse = 1;
  } else if (count === 6) {
    numToUse = 2;
    adjustment = -1.0;
  } else if (count >= 7 && count <= 8) {
    numToUse = 2;
  } else if (count >= 9 && count <= 11) {
    numToUse = 3;
  } else if (count >= 12 && count <= 14) {
    numToUse = 4;
  } else if (count >= 15 && count <= 16) {
    numToUse = 5;
  } else if (count >= 17 && count <= 18) {
    numToUse = 6;
  } else if (count === 19) {
    numToUse = 7;
  } else {
    // 20+ rounds: Best 8
    numToUse = 8;
  }

  const selected = indexed.slice(0, numToUse);
  const sum = selected.reduce((acc, curr) => acc + curr.diff, 0);
  const avg = sum / numToUse + adjustment;

  const finalIndex = Math.max(-5.0, Math.min(54.0, Math.round(avg * 10) / 10));
  const usedIndices = selected.map((s) => s.originalIdx);

  return { index: finalIndex, usedIndices };
}

/**
 * Calculates Stableford points for a hole score vs par
 * Double Bogey or worse: 0
 * Bogey: 1
 * Par: 2
 * Birdie: 3
 * Eagle: 4
 * Albatross: 5
 */
export function calculateStablefordPoints(strokes: number, par: number): number {
  if (strokes <= 0) return 0;
  const diff = strokes - par;
  if (diff >= 2) return 0;       // Double bogey or worse
  if (diff === 1) return 1;      // Bogey
  if (diff === 0) return 2;      // Par
  if (diff === -1) return 3;     // Birdie
  if (diff === -2) return 4;     // Eagle
  if (diff <= -3) return 5;      // Albatross
  return 0;
}

/**
 * Computes Match Play status between two players or teams up to a hole
 */
export interface MatchPlayStatus {
  statusText: string;
  leaderId: string | null;
  upCount: number;
  holesRemaining: number;
  isDormie: boolean;
  isMatchFinished: boolean;
  holeWinners: Record<number, string | 'halved'>;
}

export function computeMatchPlayStatus(
  playerAId: string,
  playerAName: string,
  playerAScores: Record<number, HoleScore>,
  playerACourseHcp: number,
  playerBId: string,
  playerBName: string,
  playerBScores: Record<number, HoleScore>,
  playerBCourseHcp: number,
  course: Course,
  useNet: boolean = true
): MatchPlayStatus {
  let netStrokesDiffA = 0;
  let netStrokesDiffB = 0;

  // In USGA match play, the player with the higher handicap gets strokes off the low player
  if (useNet) {
    if (playerACourseHcp > playerBCourseHcp) {
      netStrokesDiffA = playerACourseHcp - playerBCourseHcp;
    } else {
      netStrokesDiffB = playerBCourseHcp - playerACourseHcp;
    }
  }

  let aHolesWon = 0;
  let bHolesWon = 0;
  let completedHoles = 0;
  const holeWinners: Record<number, string | 'halved'> = {};

  for (let h = 1; h <= 18; h++) {
    const holeInfo = course.holes.find((hole) => hole.number === h);
    if (!holeInfo) continue;

    const scoreA = playerAScores[h]?.strokes || 0;
    const scoreB = playerBScores[h]?.strokes || 0;

    if (scoreA > 0 && scoreB > 0) {
      completedHoles++;
      const hcpStrokesA = useNet ? getHoleHandicapStrokes(netStrokesDiffA, holeInfo.handicapIndex) : 0;
      const hcpStrokesB = useNet ? getHoleHandicapStrokes(netStrokesDiffB, holeInfo.handicapIndex) : 0;

      const netA = scoreA - hcpStrokesA;
      const netB = scoreB - hcpStrokesB;

      if (netA < netB) {
        aHolesWon++;
        holeWinners[h] = playerAId;
      } else if (netB < netA) {
        bHolesWon++;
        holeWinners[h] = playerBId;
      } else {
        holeWinners[h] = 'halved';
      }
    }
  }

  const holesRemaining = 18 - completedHoles;
  const diff = Math.abs(aHolesWon - bHolesWon);
  const leaderId = aHolesWon > bHolesWon ? playerAId : bHolesWon > aHolesWon ? playerBId : null;
  const leaderName = leaderId === playerAId ? playerAName : playerBName;

  if (diff > holesRemaining) {
    return {
      statusText: `${leaderName} Won ${diff} & ${holesRemaining}`,
      leaderId,
      upCount: diff,
      holesRemaining,
      isDormie: false,
      isMatchFinished: true,
      holeWinners,
    };
  }

  if (diff === holesRemaining && holesRemaining > 0) {
    return {
      statusText: `${leaderName} Dormie ${diff} UP (${holesRemaining} to play)`,
      leaderId,
      upCount: diff,
      holesRemaining,
      isDormie: true,
      isMatchFinished: false,
      holeWinners,
    };
  }

  if (completedHoles === 18 && diff === 0) {
    return {
      statusText: 'Match Halved (All Square)',
      leaderId: null,
      upCount: 0,
      holesRemaining: 0,
      isDormie: false,
      isMatchFinished: true,
      holeWinners,
    };
  }

  if (leaderId === null) {
    return {
      statusText: 'All Square (AS)',
      leaderId: null,
      upCount: 0,
      holesRemaining,
      isDormie: false,
      isMatchFinished: false,
      holeWinners,
    };
  }

  return {
    statusText: `${leaderName} ${diff} UP (${holesRemaining} to play)`,
    leaderId,
    upCount: diff,
    holesRemaining,
    isDormie: false,
    isMatchFinished: false,
    holeWinners,
  };
}

/**
 * Calculates Best Ball (Four-Ball) team score for a given hole
 */
export function getBestBallScoreForHole(
  holeNumber: number,
  players: PlayerRoundData[],
  useNet: boolean,
  holeHandicapIndex: number
): { bestStrokes: number; bestPlayerId: string; bestPlayerName: string } {
  let best = 999;
  let bestPlayerId = '';
  let bestPlayerName = '';

  for (const player of players) {
    const strokes = player.scores[holeNumber]?.strokes || 0;
    if (strokes > 0) {
      const net = useNet ? calculateHoleNetScore(strokes, player.courseHandicap, holeHandicapIndex) : strokes;
      if (net < best) {
        best = net;
        bestPlayerId = player.playerId;
        bestPlayerName = player.name;
      }
    }
  }

  return {
    bestStrokes: best === 999 ? 0 : best,
    bestPlayerId,
    bestPlayerName,
  };
}
