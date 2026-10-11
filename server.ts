import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import path from 'path';
import dotenv from 'dotenv';
import { Course, GameFormat, RoundSession, HoleScore, CompletedRoundRecord, TeamEventRecord, MemberProfile, FutureRound, PlayerRoundData, TeamGroup, ManualPastRoundPayload } from './src/types';
import { INITIAL_BAY_AREA_COURSES } from './src/data/courses';
import { INITIAL_GROUP_MEMBERS, INITIAL_COMPLETED_ROUNDS, INITIAL_TEAM_EVENTS, INITIAL_FUTURE_ROUNDS, INITIAL_SCRAMBLE_TEAMS } from './src/data/members';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const isProd = process.env.NODE_ENV === 'production';

app.use(express.json({ limit: '25mb' }));

// In-Memory Data Store with Initial Seeds
let courses: Course[] = [...INITIAL_BAY_AREA_COURSES];
let members: MemberProfile[] = [...INITIAL_GROUP_MEMBERS];
let completedRounds: CompletedRoundRecord[] = [...INITIAL_COMPLETED_ROUNDS];
let teamEvents: TeamEventRecord[] = [...INITIAL_TEAM_EVENTS];
let futureRounds: FutureRound[] = [...INITIAL_FUTURE_ROUNDS];
let scrambleTeams: TeamGroup[] = [...INITIAL_SCRAMBLE_TEAMS];
const activeRooms = new Map<string, RoundSession>();
const sseClients = new Map<string, Set<Response>>();

// Initialize Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Broadcast Room Updates to all connected SSE clients
function broadcastRoomUpdate(roomCode: string, session: RoundSession) {
  const clients = sseClients.get(roomCode.toUpperCase());
  if (!clients || clients.size === 0) return;
  const payload = `data: ${JSON.stringify(session)}\n\n`;
  for (const client of clients) {
    try {
      client.write(payload);
    } catch {
      clients.delete(client);
    }
  }
}

// Helper to generate a room code like "DART-72" or "PIN-18"
function generateRoomCode(): string {
  const prefixes = ['DART', 'PIN', 'BIRDIE', 'HOLE', 'BULL'];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const num = Math.floor(10 + Math.random() * 90);
  return `${prefix}-${num}`;
}

// ==================== API ROUTES ====================

// 1. Courses
app.get('/api/courses', (_req: Request, res: Response) => {
  res.json({ courses });
});

app.get('/api/courses/recent', (_req: Request, res: Response) => {
  const recentNames = new Set<string>();
  completedRounds.forEach((r) => recentNames.add(r.courseName));
  teamEvents.forEach((e) => recentNames.add(e.courseName));
  const recent = courses.filter((c) => recentNames.has(c.name));
  res.json({ recentCourses: recent.length > 0 ? recent : courses.slice(0, 6) });
});

app.get('/api/courses/search', (req: Request, res: Response) => {
  const query = ((req.query.q as string) || '').trim().toLowerCase();
  if (!query) {
    res.json({ courses: courses.slice(0, 10) });
    return;
  }
  const matched = courses.filter(
    (c) =>
      c.name.toLowerCase().includes(query) ||
      c.city.toLowerCase().includes(query) ||
      c.region.toLowerCase().includes(query)
  );
  res.json({ courses: matched });
});

app.post('/api/courses', (req: Request, res: Response) => {
  const newCourse: Course = req.body;
  if (!newCourse.name) {
    res.status(400).json({ error: 'Course name is required' });
    return;
  }
  newCourse.id = newCourse.id || `course-${Date.now()}`;
  newCourse.city = newCourse.city || 'California, USA';
  newCourse.region = newCourse.region || 'Other';

  // Ensure tees exist with White Tee default
  if (!newCourse.tees || newCourse.tees.length === 0) {
    newCourse.tees = [
      { id: `${newCourse.id}-blue`, name: 'Blue Tees', color: '#2563EB', rating: 71.8, slope: 128, totalYardage: 6520 },
      { id: `${newCourse.id}-white`, name: 'White Tees', color: '#E5E7EB', rating: 70.2, slope: 124, totalYardage: 6140 },
      { id: `${newCourse.id}-red`, name: 'Forward (Red)', color: '#DC2626', rating: 67.5, slope: 118, totalYardage: 5380 },
    ];
  }

  // Ensure 18 holes exist
  if (!newCourse.holes || newCourse.holes.length === 0) {
    const pars = [4, 4, 3, 5, 4, 4, 4, 3, 5, 4, 3, 4, 4, 5, 4, 4, 3, 5];
    const hdcp = [7, 3, 15, 1, 9, 5, 17, 11, 13, 10, 16, 2, 8, 4, 12, 18, 14, 6];
    newCourse.holes = pars.map((p, idx) => ({
      number: idx + 1,
      par: p,
      yardage: p === 3 ? 170 : p === 5 ? 525 : 390,
      handicapIndex: hdcp[idx],
    }));
  }

  courses.push(newCourse);
  res.json({ success: true, course: newCourse });
});

// 2. Members
app.get('/api/members', (_req: Request, res: Response) => {
  res.json({ members });
});

app.post('/api/members', (req: Request, res: Response) => {
  const newMember: MemberProfile = req.body;
  if (!newMember.name) {
    res.status(400).json({ error: 'Name required' });
    return;
  }
  newMember.id = newMember.id || `member-${Date.now()}`;
  newMember.differentials = newMember.differentials || [];
  members.push(newMember);
  res.json({ success: true, member: newMember });
});

app.put('/api/members/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const index = members.findIndex((m) => m.id === id);
  if (index === -1) {
    res.status(404).json({ error: 'Member not found' });
    return;
  }
  members[index] = {
    ...members[index],
    ...req.body,
    id, // protect id
  };
  res.json({ success: true, member: members[index] });
});

// 3. Completed Rounds (Individual)
app.get('/api/rounds', (_req: Request, res: Response) => {
  res.json({ rounds: completedRounds });
});

app.post('/api/rounds', (req: Request, res: Response) => {
  const round: CompletedRoundRecord = req.body;
  round.id = round.id || `round-${Date.now()}`;
  completedRounds.unshift(round);

  // Update member stats if this is an individual round
  const member = members.find((m) => m.id === round.playerId || m.name.toLowerCase() === round.playerName.toLowerCase());
  if (member && !round.isTeamRound) {
    member.roundsCount += 1;
    member.differentials.unshift({
      roundId: round.id,
      date: round.date,
      courseName: round.courseName,
      grossScore: round.grossScore,
      differential: round.differential,
      usedInIndex: false,
    });
    // Recalculate member scoring avg
    const userRounds = completedRounds.filter((r) => r.playerId === member.id && !r.isTeamRound);
    if (userRounds.length > 0) {
      const avgScore = userRounds.reduce((acc, r) => acc + r.grossScore, 0) / userRounds.length;
      member.scoringAverage = Math.round(avgScore * 10) / 10;
      if (round.grossScore < (member.bestRound || 999)) {
        member.bestRound = round.grossScore;
      }
    }
  }

  res.json({ success: true, round });
});

// 4. Team Events (Scramble, Best Ball)
app.get('/api/events', (_req: Request, res: Response) => {
  res.json({ events: teamEvents });
});

app.post('/api/events', (req: Request, res: Response) => {
  const event: TeamEventRecord = req.body;
  event.id = event.id || `event-${Date.now()}`;
  teamEvents.unshift(event);
  res.json({ success: true, event });
});

app.put('/api/members/:id', (req: Request, res: Response) => {
  const memberId = req.params.id;
  const member = members.find((m) => m.id === memberId);
  if (!member) {
    res.status(404).json({ error: 'Member not found' });
    return;
  }
  const { nickname, avatarEmoji, badgeTitle, name, email, phone, handicapGoal } = req.body;
  if (nickname !== undefined) member.nickname = nickname;
  if (avatarEmoji !== undefined) member.avatarEmoji = avatarEmoji;
  if (badgeTitle !== undefined) member.badgeTitle = badgeTitle;
  if (name !== undefined) member.name = name;
  if (email !== undefined) member.email = email;
  if (phone !== undefined) member.phone = phone;
  if (handicapGoal !== undefined) member.handicapGoal = handicapGoal;
  res.json({ success: true, member });
});

// 5. Scramble Teams (Duos, Trios, 4-Man Squads)
app.get('/api/teams', (_req: Request, res: Response) => {
  res.json({ teams: scrambleTeams });
});

app.post('/api/teams', (req: Request, res: Response) => {
  const newTeam: TeamGroup = req.body;
  if (!newTeam.name || !newTeam.playerIds || newTeam.playerIds.length === 0) {
    res.status(400).json({ error: 'Team name and player roster are required' });
    return;
  }
  newTeam.id = newTeam.id || `team-${Date.now()}`;
  newTeam.stats = newTeam.stats || { roundsCount: 0, bestScore: 0, wins: 0 };
  scrambleTeams.push(newTeam);
  res.json({ success: true, team: newTeam });
});

app.put('/api/teams/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const idx = scrambleTeams.findIndex((t) => t.id === id);
  if (idx === -1) {
    res.status(404).json({ error: 'Team not found' });
    return;
  }
  scrambleTeams[idx] = { ...scrambleTeams[idx], ...req.body, id };
  res.json({ success: true, team: scrambleTeams[idx] });
});

app.delete('/api/teams/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  scrambleTeams = scrambleTeams.filter((t) => t.id !== id);
  res.json({ success: true });
});

// 6. Manual Past Round Entry with Historical Dates
app.post('/api/rounds/manual', (req: Request, res: Response) => {
  const payload: ManualPastRoundPayload = req.body;
  if (!payload.courseName || !payload.date || !payload.grossScore) {
    res.status(400).json({ error: 'Course, date, and gross score are required' });
    return;
  }

  if (payload.isTeamRound) {
    // Save as TeamEventRecord so individual WHS is kept clean and unskewed
    const team = scrambleTeams.find((t) => t.id === payload.teamId);
    const teamName = payload.teamName || team?.name || 'Scramble Team';
    const playerNames = (payload.playerIds && payload.playerIds.length > 0)
      ? payload.playerIds.map((pid) => members.find((m) => m.id === pid)?.name || 'Golfer')
      : (team ? team.playerIds.map((pid) => members.find((m) => m.id === pid)?.name || 'Golfer') : ['Scramble Foursome']);

    const newEvent: TeamEventRecord = {
      id: `event-${Date.now()}`,
      date: payload.date,
      eventName: `${payload.courseName} ${payload.format.toUpperCase()} (Manual)`,
      courseName: payload.courseName,
      format: (payload.format === 'scramble' || payload.format === 'best_ball' || payload.format === 'match_play') ? payload.format : 'scramble',
      winningTeamName: teamName,
      teamLeaderboard: [
        {
          teamName,
          grossScore: payload.grossScore,
          playerNames,
        },
      ],
      notes: `Recorded past round from ${payload.date} (${payload.teeName || 'White Tees'}).`,
    };

    teamEvents.unshift(newEvent);
    teamEvents.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Update team stats if pre-built team
    if (team) {
      if (!team.stats) team.stats = { roundsCount: 0, bestScore: 0, wins: 0 };
      team.stats.roundsCount += 1;
      if (!team.stats.bestScore || payload.grossScore < team.stats.bestScore) {
        team.stats.bestScore = payload.grossScore;
      }
    }

    res.json({ success: true, event: newEvent, isTeam: true });
  } else {
    // Individual round
    const member = members.find((m) => m.id === payload.playerId || m.name.toLowerCase() === (payload.playerName || '').toLowerCase()) || members[0];
    const slope = payload.slope || 113;
    const rating = payload.rating || 72;
    const diff = Math.round(((113 / slope) * (payload.grossScore - rating)) * 10) / 10;
    const courseHcp = Math.round(member.handicapIndex * (slope / 113) + (rating - 72));

    const roundRecord: CompletedRoundRecord = {
      id: `cr-manual-${Date.now()}`,
      date: payload.date,
      courseId: payload.courseId || 'custom',
      courseName: payload.courseName,
      teeName: payload.teeName || 'White',
      format: payload.format,
      isTeamRound: false,
      playerId: member.id,
      playerName: member.name,
      grossScore: payload.grossScore,
      netScore: payload.grossScore - courseHcp,
      differential: diff,
      courseRating: rating,
      slopeRating: slope,
      totalPutts: payload.putts || 32,
      firCount: payload.firCount || 9,
      girCount: payload.girCount || 8,
      scores: payload.scores || {},
    };

    completedRounds.unshift(roundRecord);
    // Sort chronologically by date descending so past round gets slotted properly!
    completedRounds.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Update member stats and differentials
    member.roundsCount += 1;
    member.differentials.unshift({
      roundId: roundRecord.id,
      date: payload.date,
      courseName: payload.courseName,
      grossScore: payload.grossScore,
      differential: diff,
      usedInIndex: false,
    });
    member.differentials.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const userRounds = completedRounds.filter((r) => r.playerId === member.id && !r.isTeamRound);
    if (userRounds.length > 0) {
      const avgScore = userRounds.reduce((acc, r) => acc + r.grossScore, 0) / userRounds.length;
      member.scoringAverage = Math.round(avgScore * 10) / 10;
      if (payload.grossScore < (member.bestRound || 999)) {
        member.bestRound = payload.grossScore;
      }
    }

    res.json({ success: true, round: roundRecord, isTeam: false });
  }
});

// 4. Future Rounds & Tee Time Placeholders
app.get('/api/future-rounds', (_req: Request, res: Response) => {
  res.json({ futureRounds });
});

app.post('/api/future-rounds', (req: Request, res: Response) => {
  const newFutureRound: FutureRound = req.body;
  newFutureRound.id = newFutureRound.id || `future-${Date.now()}`;
  newFutureRound.registeredPlayerIds = newFutureRound.registeredPlayerIds || [];
  newFutureRound.maxPlayers = newFutureRound.maxPlayers || 4;
  newFutureRound.status = newFutureRound.status || 'placeholder';
  futureRounds.unshift(newFutureRound);
  res.json({ success: true, futureRound: newFutureRound });
});

app.put('/api/future-rounds/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const index = futureRounds.findIndex((r) => r.id === id);
  if (index === -1) {
    res.status(404).json({ error: 'Future round not found' });
    return;
  }
  futureRounds[index] = { ...futureRounds[index], ...req.body };
  res.json({ success: true, futureRound: futureRounds[index] });
});

app.post('/api/future-rounds/:id/rsvp', (req: Request, res: Response) => {
  const { id } = req.params;
  const { memberId, action } = req.body; // action: 'join' | 'leave'
  const futureRound = futureRounds.find((r) => r.id === id);
  if (!futureRound) {
    res.status(404).json({ error: 'Future round not found' });
    return;
  }

  if (action === 'leave') {
    futureRound.registeredPlayerIds = futureRound.registeredPlayerIds.filter((pid) => pid !== memberId);
  } else {
    // join
    if (!futureRound.registeredPlayerIds.includes(memberId) && futureRound.registeredPlayerIds.length < futureRound.maxPlayers) {
      futureRound.registeredPlayerIds.push(memberId);
    }
  }
  res.json({ success: true, futureRound });
});

app.delete('/api/future-rounds/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  futureRounds = futureRounds.filter((r) => r.id !== id);
  res.json({ success: true });
});

// Send booking alert email notification
app.post('/api/future-rounds/:id/notify', (req: Request, res: Response) => {
  const { id } = req.params;
  const { email, recipientName, note } = req.body;
  const round = futureRounds.find((r) => r.id === id);

  if (!round) {
    res.status(404).json({ error: 'Future round not found' });
    return;
  }

  if (!email || !email.includes('@')) {
    res.status(400).json({ error: 'Valid email address required' });
    return;
  }

  const subject = `⛳ Bay Area Darts Alert: 7-Day Tee Sheet Booking Window for ${round.courseName}`;
  const messageBody = `Hello ${recipientName || 'Golfer'},\n\nThis is your automated tee time booking reminder for Bay Area Darts!\n\nRound Details:\n• Course: ${round.courseName}\n• Target Date: ${round.targetDate}\n• Tee Time Window: ${round.targetTimeWindow || 'Morning'}\n• Booking Window Opens: ${round.bookingOpensAt || '7 days prior at 6:00 AM'}\n• Format: ${round.format.toUpperCase()}\n\nPlease log onto the course tee sheet system at 6:00 AM to secure the group's foursome!\n\nGood luck and shoot darts!\n— Bay Area Darts Clubhouse`;

  console.log(`[EMAIL NOTIFICATION] Dispatched to ${email}: ${subject}`);

  res.json({
    success: true,
    email,
    subject,
    messageBody,
    sentAt: new Date().toISOString(),
    recipientName: recipientName || 'Member',
    courseName: round.courseName,
    targetDate: round.targetDate,
  });
});


// Start Live Round from a Future Round Booking
app.post('/api/future-rounds/:id/start', (req: Request, res: Response) => {
  const { id } = req.params;
  const futureRound = futureRounds.find((r) => r.id === id);
  if (!futureRound) {
    res.status(404).json({ error: 'Future round not found' });
    return;
  }

  const course = courses.find((c) => c.id === futureRound.courseId) || courses[0];
  const tee =
    course.tees.find((t) => t.name === futureRound.teeName) ||
    course.tees.find((t) => t.name.toLowerCase().includes('white') || t.color.toLowerCase().includes('white')) ||
    course.tees.find((t) => t.name.toLowerCase().includes('regular') || t.name.toLowerCase().includes('middle')) ||
    (course.tees.length >= 3 ? course.tees[1] : course.tees[0]);
  const roomCode = generateRoomCode().toUpperCase();

  // Populate pre-registered players
  const players: PlayerRoundData[] = futureRound.registeredPlayerIds.map((pid) => {
    const mem = members.find((m) => m.id === pid);
    const hcp = mem?.handicapIndex || 10;
    const courseHcp = Math.round(hcp * (tee.slope / 113) + (tee.rating - 72));
    return {
      playerId: pid,
      name: mem?.name || 'Player',
      handicapIndex: hcp,
      courseHandicap: courseHcp,
      scores: {},
    };
  });

  // If no registered players, add default
  if (players.length === 0) {
    const mem = members[0];
    players.push({
      playerId: mem.id,
      name: mem.name,
      handicapIndex: mem.handicapIndex,
      courseHandicap: Math.round(mem.handicapIndex * (tee.slope / 113) + (tee.rating - 72)),
      scores: {},
    });
  }

  const newSession: RoundSession = {
    id: `session-${Date.now()}`,
    roomCode,
    courseId: course.id,
    courseName: course.name,
    teeId: tee.id,
    teeName: tee.name,
    rating: tee.rating,
    slope: tee.slope,
    date: futureRound.targetDate || new Date().toISOString().split('T')[0],
    format: futureRound.format || 'stroke',
    isTeamRound: futureRound.format === 'scramble' || futureRound.format === 'best_ball',
    status: 'active',
    players,
    teams: [],
    updatedAt: Date.now(),
  };

  activeRooms.set(roomCode, newSession);
  res.json({ success: true, session: newSession });
});

// 5. Live Round Rooms
app.post('/api/rooms', (req: Request, res: Response) => {
  const payload: Partial<RoundSession> = req.body;
  const roomCode = (payload.roomCode || generateRoomCode()).toUpperCase();

  const newSession: RoundSession = {
    id: `session-${Date.now()}`,
    roomCode,
    courseId: payload.courseId || courses[0].id,
    courseName: payload.courseName || courses[0].name,
    teeId: payload.teeId || courses[0].tees[0].id,
    teeName: payload.teeName || courses[0].tees[0].name,
    rating: payload.rating || courses[0].tees[0].rating,
    slope: payload.slope || courses[0].tees[0].slope,
    date: payload.date || new Date().toISOString().split('T')[0],
    format: payload.format || 'stroke',
    isTeamRound: payload.format === 'scramble' || payload.format === 'best_ball',
    status: 'active',
    players: payload.players || [],
    teams: payload.teams || [],
    updatedAt: Date.now(),
  };

  activeRooms.set(roomCode, newSession);
  res.json({ success: true, session: newSession });
});

app.get('/api/rooms/:code', (req: Request, res: Response) => {
  const code = req.params.code.toUpperCase();
  const session = activeRooms.get(code);
  if (!session) {
    res.status(404).json({ error: 'Room not found' });
    return;
  }
  res.json({ session });
});

// Join Room
app.post('/api/rooms/:code/join', (req: Request, res: Response) => {
  const code = req.params.code.toUpperCase();
  const session = activeRooms.get(code);
  if (!session) {
    res.status(404).json({ error: 'Room not found' });
    return;
  }

  const { name, handicapIndex, playerId } = req.body;
  const existingPlayer = session.players.find((p) => p.playerId === playerId || p.name.toLowerCase() === (name || '').toLowerCase());

  if (!existingPlayer && name) {
    const courseHcp = Math.round((handicapIndex || 10) * (session.slope / 113) + (session.rating - 72));
    session.players.push({
      playerId: playerId || `p-${Date.now()}`,
      name,
      handicapIndex: handicapIndex || 10,
      courseHandicap: courseHcp,
      scores: {},
    });
    session.updatedAt = Date.now();
    broadcastRoomUpdate(code, session);
  }

  res.json({ success: true, session });
});

// Update Hole Score
app.put('/api/rooms/:code/score', (req: Request, res: Response) => {
  const code = req.params.code.toUpperCase();
  const session = activeRooms.get(code);
  if (!session) {
    res.status(404).json({ error: 'Room not found' });
    return;
  }

  const { playerId, holeNumber, score } = req.body;
  const player = session.players.find((p) => p.playerId === playerId);
  if (!player) {
    res.status(404).json({ error: 'Player not found in round' });
    return;
  }

  player.scores[holeNumber] = {
    strokes: score.strokes,
    putts: score.putts || 0,
    fir: score.fir || 'none',
    gir: score.gir || false,
    driverPlayerId: score.driverPlayerId,
    shotContributorId: score.shotContributorId,
    shotContributorName: score.shotContributorName,
  };

  session.updatedAt = Date.now();
  broadcastRoomUpdate(code, session);
  res.json({ success: true, session });
});

// Full Session Update
app.put('/api/rooms/:code', (req: Request, res: Response) => {
  const code = req.params.code.toUpperCase();
  const session = activeRooms.get(code);
  if (!session) {
    res.status(404).json({ error: 'Room not found' });
    return;
  }

  const updated: RoundSession = {
    ...session,
    ...req.body,
    roomCode: code,
    updatedAt: Date.now(),
  };

  activeRooms.set(code, updated);
  broadcastRoomUpdate(code, updated);
  res.json({ success: true, session: updated });
});

// Real-Time SSE Stream for Room
app.get('/api/rooms/:code/stream', (req: Request, res: Response) => {
  const code = req.params.code.toUpperCase();
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  if (!sseClients.has(code)) {
    sseClients.set(code, new Set());
  }
  const clientSet = sseClients.get(code)!;
  clientSet.add(res);

  // Send initial state immediately
  const session = activeRooms.get(code);
  if (session) {
    res.write(`data: ${JSON.stringify(session)}\n\n`);
  }

  req.on('close', () => {
    clientSet.delete(res);
  });
});

// Finish Round & Archive
app.post('/api/rooms/:code/finish', (req: Request, res: Response) => {
  const code = req.params.code.toUpperCase();
  const session = activeRooms.get(code);
  if (!session) {
    res.status(404).json({ error: 'Room not found' });
    return;
  }

  session.status = 'completed';
  session.updatedAt = Date.now();

  // If team round, save as a team event
  if (session.isTeamRound) {
    const eventLeaderboard = (session.teams && session.teams.length > 0)
      ? session.teams.map((t) => {
          // team score from team players or scramble player
          const samplePlayer = session.players.find((p) => t.playerIds.includes(p.playerId)) || session.players[0];
          const gross = Object.values(samplePlayer?.scores || {}).reduce((acc, s) => acc + (s.strokes || 0), 0);
          return {
            teamName: t.name,
            grossScore: gross,
            playerNames: t.playerIds.map((pid) => session.players.find((p) => p.playerId === pid)?.name || 'Player'),
          };
        })
      : [
          {
            teamName: `${session.courseName} Scramble Team`,
            grossScore: Object.values(session.players[0]?.scores || {}).reduce((acc, s) => acc + (s.strokes || 0), 0),
            playerNames: session.players.map((p) => p.name),
          },
        ];

    eventLeaderboard.sort((a, b) => a.grossScore - b.grossScore);

    teamEvents.unshift({
      id: `event-${Date.now()}`,
      date: session.date,
      eventName: `${session.courseName} ${session.format.toUpperCase()} Round`,
      courseName: session.courseName,
      format: session.format as 'scramble' | 'best_ball' | 'match_play',
      winningTeamName: eventLeaderboard[0]?.teamName || 'Champions',
      teamLeaderboard: eventLeaderboard,
      notes: `Live round completed via Bay Area Darts room ${code}`,
    });
  } else {
    // Individual rounds: Save completed records for each player with at least 9 holes
    for (const player of session.players) {
      const scores = player.scores;
      const holesPlayed = Object.values(scores).filter((s) => s.strokes > 0);
      if (holesPlayed.length >= 9) {
        const grossScore = holesPlayed.reduce((acc, s) => acc + s.strokes, 0);
        const totalPutts = holesPlayed.reduce((acc, s) => acc + (s.putts || 0), 0);
        const firCount = holesPlayed.filter((s) => s.fir === 'hit').length;
        const girCount = holesPlayed.filter((s) => s.gir).length;
        const diff = Math.round(((113 / session.slope) * (grossScore - session.rating)) * 10) / 10;

        completedRounds.unshift({
          id: `cr-${Date.now()}-${player.playerId}`,
          date: session.date,
          courseId: session.courseId,
          courseName: session.courseName,
          teeName: session.teeName,
          format: session.format,
          isTeamRound: false,
          playerId: player.playerId,
          playerName: player.name,
          grossScore,
          netScore: grossScore - (player.courseHandicap || 0),
          differential: diff,
          courseRating: session.rating,
          slopeRating: session.slope,
          totalPutts,
          firCount,
          girCount,
          scores: player.scores,
        });
      }
    }
  }

  broadcastRoomUpdate(code, session);
  res.json({ success: true, session });
});

// 6. AI Scorecard Photo OCR Endpoint (Gemini 3.8 Flash Multimodal)
app.post('/api/scorecard-ocr', async (req: Request, res: Response) => {
  try {
    const { imageBase64, mimeType = 'image/jpeg', selectedFormat = 'stroke' } = req.body;

    if (!imageBase64) {
      res.status(400).json({ error: 'Missing imageBase64 data' });
      return;
    }

    if (!process.env.GEMINI_API_KEY) {
      res.status(500).json({ error: 'GEMINI_API_KEY is not configured on the server.' });
      return;
    }

    // Clean base64 data if it contains a data URL prefix
    const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z+]+;base64,/, '');

    const promptText = `
You are an expert golf scorecard OCR digitizer for the "Bay Area Darts" golf group.
Carefully examine this photo of a golf scorecard.

CRITICAL TASKS:
1. Identify the Course Name (match to known Northern California or Bay Area courses if applicable, e.g. Harding Park, Presidio, Sharp Park, Corica Park, Half Moon Bay, Peacock Gap, etc., or transcribe accurately).
2. Identify the Date of the round (if written) or leave empty if not present.
3. Identify the Tee Name (e.g., Black, Blue, White, Gold, Red).
4. Identify the par for each hole (1 to 18).
5. IDENTIFY EVERY PLAYER ROW WRITTEN ON THE SCORECARD:
   - Carefully extract each golfer's name or initials (e.g., "Dave", "Mike", "Player 1", "Team 1").
   - Extract hole-by-hole scores (holes 1 through 18) for EACH player row found.
   - If putts are recorded (often written as small superscripts, second lines, or dots), extract putts per hole. If not present, set putts to 0.
   - Calculate or extract totalStrokes, front9, and back9 for each player.
6. The user indicated the round format is "${selectedFormat}".

Return structured JSON conforming to the requested schema. Ensure all player rows found on the card are represented so the golfer can choose which player's scores to import.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: {
        parts: [
          {
            inlineData: {
              data: cleanBase64,
              mimeType,
            },
          },
          {
            text: promptText,
          },
        ],
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            courseName: { type: Type.STRING },
            date: { type: Type.STRING },
            teeName: { type: Type.STRING },
            detectedPars: {
              type: Type.ARRAY,
              items: { type: Type.INTEGER },
            },
            detectedPlayers: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  cardName: { type: Type.STRING },
                  totalStrokes: { type: Type.INTEGER },
                  front9: { type: Type.INTEGER },
                  back9: { type: Type.INTEGER },
                  holes: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        holeNumber: { type: Type.INTEGER },
                        par: { type: Type.INTEGER },
                        strokes: { type: Type.INTEGER },
                        putts: { type: Type.INTEGER },
                      },
                      required: ['holeNumber', 'strokes'],
                    },
                  },
                },
                required: ['cardName', 'totalStrokes', 'holes'],
              },
            },
            confidenceScore: { type: Type.NUMBER },
            notes: { type: Type.STRING },
          },
          required: ['detectedPlayers'],
        },
      },
    });

    const jsonText = response.text || '{}';
    const parsedData = JSON.parse(jsonText);

    // Ensure each detected player has an ID
    if (parsedData.detectedPlayers && Array.isArray(parsedData.detectedPlayers)) {
      parsedData.detectedPlayers.forEach((p: any, idx: number) => {
        p.id = p.id || `p-${idx + 1}`;
      });
    }

    res.json({
      success: true,
      data: parsedData,
    });
  } catch (error: any) {
    console.error('Scorecard OCR Error:', error);
    res.status(500).json({
      error: 'Failed to process scorecard image with Gemini Vision.',
      details: error.message || String(error),
    });
  }
});

// Setup Vite or Static File Serving
async function startServer() {
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`🏌️ Bay Area Darts server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
