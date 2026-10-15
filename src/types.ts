export type GameFormat = 'stroke' | 'stableford' | 'match_play' | 'scramble' | 'best_ball';

export interface HoleInfo {
  number: number;
  par: number;
  yardage: number;
  handicapIndex: number; // 1 to 18 stroke difficulty rating
}

export interface TeeBox {
  id: string;
  name: string;
  color: string;
  rating: number; // e.g. 71.4
  slope: number;  // e.g. 128
  totalYardage: number;
}

export interface Course {
  id: string;
  name: string;
  city: string;
  region: 'SF' | 'East Bay' | 'Peninsula' | 'South Bay' | 'North Bay' | 'Other';
  holes: HoleInfo[];
  tees: TeeBox[];
  notes?: string;
}

export type FirDirection = 'left' | 'hit' | 'right' | 'none';

export interface HoleScore {
  strokes: number;
  putts: number;
  fir: FirDirection; // Fairways in regulation (none for par 3)
  gir: boolean;      // Green in regulation
  drinks?: number;
  driverPlayerId?: string; // For Scramble format: whose drive was chosen
  shotContributorId?: string; // For Scramble format: who contributed the key approach/putt
  shotContributorName?: string;
}

export interface PlayerRoundData {
  playerId: string;
  name: string;
  handicapIndex: number;
  courseHandicap: number;
  scores: Record<number, HoleScore>; // 1 to 18
  teamId?: string; // If player belongs to a specific scramble team
}

export interface TeamGroup {
  id: string;
  name: string;
  playerIds: string[]; // 2 to 4 player IDs for full group or duo scrambles
  color?: string;
  colorTag?: string;
  avatarEmoji?: string;
  notes?: string;
  stats?: {
    roundsCount: number;
    bestScore?: number;
    wins?: number;
  };
}

export type Team = TeamGroup;

export interface ManualPastRoundPayload {
  courseId: string;
  courseName: string;
  teeId: string;
  teeName: string;
  rating: number;
  slope: number;
  date: string;
  format: GameFormat;
  isTeamRound: boolean;
  entryMode: 'hole_by_hole' | 'quick_total';
  playerId?: string;
  playerName?: string;
  teamId?: string;
  teamName?: string;
  playerIds?: string[];
  grossScore: number;
  front9Score?: number;
  back9Score?: number;
  putts?: number;
  firCount?: number;
  girCount?: number;
  scores?: Record<number, HoleScore>;
}

export interface RoundSession {
  id: string;
  roomCode: string; // e.g. "DART-18"
  courseId: string;
  courseName: string;
  teeId: string;
  teeName: string;
  rating: number;
  slope: number;
  date: string;
  format: GameFormat;
  isTeamRound: boolean; // True for Scramble & Best Ball
  holesPlayed?: '18' | 'front9' | 'back9' | string;
  status: 'active' | 'completed';
  players: PlayerRoundData[];
  teams?: TeamGroup[];
  matchPlayMatch?: {
    playerOrTeamAId: string;
    playerOrTeamBId: string;
  };
  notes?: string;
  updatedAt: number;
}

export interface MemberProfile {
  id: string;
  name: string;
  nickname: string;
  email?: string;
  phone?: string;
  avatarEmoji: string;
  badgeTitle: string;
  handicapIndex: number;
  handicapGoal?: number;
  roundsCount: number;
  scoringAverage: number;
  avgPutts: number;
  firPercent: number;
  girPercent: number;
  bestRound: number;
  bestRound9?: number;
  differentials: {
    roundId: string;
    date: string;
    courseName: string;
    grossScore: number;
    differential: number;
    usedInIndex: boolean;
  }[];
}

export interface FutureRound {
  id: string;
  courseId: string;
  courseName: string;
  targetDate: string; // YYYY-MM-DD
  targetTimeWindow?: string; // e.g. "8:00 AM - 9:30 AM"
  status: 'placeholder' | 'window_open' | 'confirmed';
  bookingOpenDaysAhead: number; // usually 7 days out
  bookingOpensAt?: string; // e.g. "Sunday, Oct 12 at 7:00 PM"
  teeName?: string;
  format: GameFormat;
  registeredPlayerIds: string[];
  maxPlayers: number; // default 4
  notes?: string;
}

export interface CompletedRoundRecord {
  id: string;
  date: string;
  courseId: string;
  courseName: string;
  teeId?: string;
  teeName: string;
  format: GameFormat;
  isTeamRound: boolean;
  holesPlayed?: '18' | 'front9' | 'back9' | string;
  playerId: string;
  playerName: string;
  grossScore: number;
  netScore: number;
  differential: number;
  courseRating: number;
  slopeRating: number;
  totalPutts: number;
  firCount: number;
  girCount: number;
  girPercent?: number;
  buzzballCount?: number;
  scores: Record<number, HoleScore>;
  holeScores?: Record<number, HoleScore>;
}

export interface TeamEventRecord {
  id: string;
  date: string;
  eventName: string;
  courseName: string;
  format: 'scramble' | 'best_ball' | 'match_play';
  winningTeamName: string;
  teamLeaderboard: {
    teamName: string;
    grossScore: number;
    netScore?: number;
    playerNames: string[];
  }[];
  notes?: string;
}

export interface OcrHoleDetail {
  holeNumber: number;
  par?: number;
  strokes: number;
  putts?: number;
}

export interface OcrDetectedPlayer {
  id: string;
  cardName: string;
  totalStrokes: number;
  front9: number;
  back9: number;
  holes: OcrHoleDetail[];
}

export interface OcrScorecardResponse {
  courseName?: string;
  date?: string;
  teeName?: string;
  detectedPars?: number[];
  detectedPlayers: OcrDetectedPlayer[];
  confidenceScore: number;
  notes?: string;
}
