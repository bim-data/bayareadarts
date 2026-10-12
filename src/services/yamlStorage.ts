import { load, dump } from 'js-yaml';
import {
  Course,
  MemberProfile,
  TeamGroup,
  CompletedRoundRecord,
  FutureRound,
} from '../types';

// Direct raw imports of the flat YAML files via Vite ?raw
import coursesYamlRaw from '../../data/courses.yaml?raw';
import membersYamlRaw from '../../data/members.yaml?raw';
import teamsYamlRaw from '../../data/teams.yaml?raw';
import roundsYamlRaw from '../../data/rounds.yaml?raw';
import futureRoundsYamlRaw from '../../data/future-rounds.yaml?raw';

const STORAGE_KEYS = {
  COURSES: 'bad_yaml_courses_v1',
  MEMBERS: 'bad_yaml_members_v1',
  TEAMS: 'bad_yaml_teams_v1',
  ROUNDS: 'bad_yaml_rounds_v1',
  FUTURE_ROUNDS: 'bad_yaml_future_rounds_v1',
  LAST_EXPORT: 'bad_yaml_last_export',
} as const;

export interface ClubhouseYamlData {
  courses: Course[];
  members: MemberProfile[];
  teams: TeamGroup[];
  rounds: CompletedRoundRecord[];
  futureRounds: FutureRound[];
}

export type YamlDataType = 'courses' | 'members' | 'teams' | 'rounds' | 'future_rounds';

// Format JavaScript object to clean YAML string
export function serializeToYaml(data: unknown): string {
  return dump(data, {
    indent: 2,
    lineWidth: -1,
    noRefs: true,
  });
}

// Safely parse YAML string
export function parseFromYaml<T>(yamlStr: string): T {
  return load(yamlStr) as T;
}

// Trigger in-browser file download for a YAML string
export function downloadYamlFile(filename: string, yamlContent: string): void {
  const blob = new Blob([yamlContent], { type: 'text/yaml;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  try {
    localStorage.setItem(STORAGE_KEYS.LAST_EXPORT, new Date().toISOString());
  } catch {}
}

// Export single files
export function exportCoursesYaml(courses: Course[]): void {
  downloadYamlFile('courses.yaml', serializeToYaml(courses));
}

export function exportMembersYaml(members: MemberProfile[]): void {
  downloadYamlFile('members.yaml', serializeToYaml(members));
}

export function exportTeamsYaml(teams: TeamGroup[]): void {
  downloadYamlFile('teams.yaml', serializeToYaml(teams));
}

export function exportRoundsYaml(rounds: CompletedRoundRecord[]): void {
  downloadYamlFile('rounds.yaml', serializeToYaml(rounds));
}

export function exportFutureRoundsYaml(futureRounds: FutureRound[]): void {
  downloadYamlFile('future-rounds.yaml', serializeToYaml(futureRounds));
}

// Export all 5 YAML files in sequence
export function exportAllClubhouseYaml(data: ClubhouseYamlData): void {
  exportCoursesYaml(data.courses);
  setTimeout(() => exportMembersYaml(data.members), 250);
  setTimeout(() => exportTeamsYaml(data.teams), 500);
  setTimeout(() => exportRoundsYaml(data.rounds), 750);
  setTimeout(() => exportFutureRoundsYaml(data.futureRounds), 1000);
}

// LocalStorage Persistence Helpers
export function saveCoursesToStorage(courses: Course[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.COURSES, JSON.stringify(courses));
  } catch {}
}

export function saveMembersToStorage(members: MemberProfile[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(members));
  } catch {}
}

export function saveTeamsToStorage(teams: TeamGroup[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.TEAMS, JSON.stringify(teams));
  } catch {}
}

export function saveRoundsToStorage(rounds: CompletedRoundRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.ROUNDS, JSON.stringify(rounds));
  } catch {}
}

export function saveFutureRoundsToStorage(futureRounds: FutureRound[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.FUTURE_ROUNDS, JSON.stringify(futureRounds));
  } catch {}
}

// Load from localStorage or fall back to bundled YAML files
export function loadClubhouseData(): ClubhouseYamlData {
  let courses: Course[] | null = null;
  let members: MemberProfile[] | null = null;
  let teams: TeamGroup[] | null = null;
  let rounds: CompletedRoundRecord[] | null = null;
  let futureRounds: FutureRound[] | null = null;

  try {
    const raw = localStorage.getItem(STORAGE_KEYS.COURSES);
    if (raw) courses = JSON.parse(raw);
  } catch {}

  try {
    const raw = localStorage.getItem(STORAGE_KEYS.MEMBERS);
    if (raw) members = JSON.parse(raw);
  } catch {}

  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TEAMS);
    if (raw) teams = JSON.parse(raw);
  } catch {}

  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ROUNDS);
    if (raw) rounds = JSON.parse(raw);
  } catch {}

  try {
    const raw = localStorage.getItem(STORAGE_KEYS.FUTURE_ROUNDS);
    if (raw) futureRounds = JSON.parse(raw);
  } catch {}

  // Parse from bundled YAML if not already in localStorage
  if (!courses || courses.length === 0) {
    try {
      courses = parseFromYaml<Course[]>(coursesYamlRaw);
    } catch {
      courses = [];
    }
  }

  if (!members || members.length === 0) {
    try {
      members = parseFromYaml<MemberProfile[]>(membersYamlRaw);
    } catch {
      members = [];
    }
  }

  if (!teams || teams.length === 0) {
    try {
      teams = parseFromYaml<TeamGroup[]>(teamsYamlRaw);
    } catch {
      teams = [];
    }
  }

  if (!rounds || rounds.length === 0) {
    try {
      rounds = parseFromYaml<CompletedRoundRecord[]>(roundsYamlRaw);
    } catch {
      rounds = [];
    }
  }

  if (!futureRounds || futureRounds.length === 0) {
    try {
      futureRounds = parseFromYaml<FutureRound[]>(futureRoundsYamlRaw);
    } catch {
      futureRounds = [];
    }
  }

  return {
    courses: courses || [],
    members: members || [],
    teams: teams || [],
    rounds: rounds || [],
    futureRounds: futureRounds || [],
  };
}

// Auto-detect YAML file type upon user import
export function detectYamlType(parsedData: any): YamlDataType | 'unknown' {
  if (!Array.isArray(parsedData) || parsedData.length === 0) {
    return 'unknown';
  }
  const item = parsedData[0];
  if (!item || typeof item !== 'object') return 'unknown';

  if ('holes' in item && 'tees' in item) {
    return 'courses';
  }
  if ('handicapIndex' in item && 'avatarEmoji' in item) {
    return 'members';
  }
  if ('playerIds' in item && ('color' in item || 'stats' in item)) {
    return 'teams';
  }
  if ('grossScore' in item && ('courseRating' in item || 'differential' in item || 'slopeRating' in item)) {
    return 'rounds';
  }
  if ('bookingOpenDaysAhead' in item || 'targetDate' in item) {
    return 'future_rounds';
  }

  return 'unknown';
}

// Read and parse an uploaded file
export async function parseUploadedYamlFile(file: File): Promise<{
  filename: string;
  type: YamlDataType | 'unknown';
  count: number;
  data: any;
  rawYaml: string;
}> {
  const text = await file.text();
  const parsed = load(text);

  let type: YamlDataType | 'unknown' = detectYamlType(parsed);

  // Filename hints if array was empty or ambiguous
  if (type === 'unknown') {
    const lower = file.name.toLowerCase();
    if (lower.includes('course')) type = 'courses';
    else if (lower.includes('member')) type = 'members';
    else if (lower.includes('team')) type = 'teams';
    else if (lower.includes('round') && !lower.includes('future')) type = 'rounds';
    else if (lower.includes('future')) type = 'future_rounds';
  }

  const count = Array.isArray(parsed) ? parsed.length : 1;

  return {
    filename: file.name,
    type,
    count,
    data: parsed,
    rawYaml: text,
  };
}

// Reset clubhouse storage to defaults bundled in repository
export function resetClubhouseToBundledYaml(): ClubhouseYamlData {
  try {
    localStorage.removeItem(STORAGE_KEYS.COURSES);
    localStorage.removeItem(STORAGE_KEYS.MEMBERS);
    localStorage.removeItem(STORAGE_KEYS.TEAMS);
    localStorage.removeItem(STORAGE_KEYS.ROUNDS);
    localStorage.removeItem(STORAGE_KEYS.FUTURE_ROUNDS);
  } catch {}
  return loadClubhouseData();
}
