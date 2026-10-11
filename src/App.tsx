import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { ClubhouseDashboard } from './components/ClubhouseDashboard';
import { LiveRoundScorer } from './components/LiveRoundScorer';
import { FormatScorecardModal } from './components/FormatScorecardModal';
import { LeaderboardModal } from './components/LeaderboardModal';
import { ScorecardOcrModal } from './components/ScorecardOcrModal';
import { NewRoundModal } from './components/NewRoundModal';
import { JoinRoomModal } from './components/JoinRoomModal';
import { CourseLibraryModal } from './components/CourseLibraryModal';
import { HandicapLeaderboardModal } from './components/HandicapLeaderboardModal';
import { TeamEventsModal } from './components/TeamEventsModal';
import { ClubLogoCustomizer } from './components/ClubLogoCustomizer';
import { CreateFutureRoundModal } from './components/CreateFutureRoundModal';
import { EditNicknameModal } from './components/EditNicknameModal';
import { PlayerHistoryModal } from './components/PlayerHistoryModal';
import { TeamHistoryModal } from './components/TeamHistoryModal';
import { UserProfileModal } from './components/UserProfileModal';
import { ScrambleTeamManagerModal } from './components/ScrambleTeamManagerModal';
import { ClubhouseHubModal } from './components/ClubhouseHubModal';
import { 
  Course, 
  MemberProfile, 
  CompletedRoundRecord, 
  TeamEventRecord, 
  RoundSession, 
  HoleScore,
  FutureRound,
  TeamGroup
} from './types';
import { INITIAL_BAY_AREA_COURSES } from './data/courses';
import { INITIAL_GROUP_MEMBERS, INITIAL_COMPLETED_ROUNDS, INITIAL_TEAM_EVENTS, INITIAL_FUTURE_ROUNDS, INITIAL_SCRAMBLE_TEAMS } from './data/members';

export default function App() {
  const [currentTab, setCurrentTab] = useState<'clubhouse' | 'live' | 'rankings' | 'courses' | 'events' | 'future'>('clubhouse');

  // Dark Mode State
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('bad_dark_mode');
    if (saved !== null) return saved === 'true';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('bad_dark_mode', String(darkMode));
  }, [darkMode]);

  // Application Data Stores
  const [courses, setCourses] = useState<Course[]>(INITIAL_BAY_AREA_COURSES);
  const [members, setMembers] = useState<MemberProfile[]>(INITIAL_GROUP_MEMBERS);
  const [completedRounds, setCompletedRounds] = useState<CompletedRoundRecord[]>(INITIAL_COMPLETED_ROUNDS);
  const [teamEvents, setTeamEvents] = useState<TeamEventRecord[]>(INITIAL_TEAM_EVENTS);
  const [futureRounds, setFutureRounds] = useState<FutureRound[]>(INITIAL_FUTURE_ROUNDS);
  const [teams, setTeams] = useState<TeamGroup[]>(INITIAL_SCRAMBLE_TEAMS);
  const [activeSession, setActiveSession] = useState<RoundSession | null>(null);

  // Active Logged-in Golfer Profile (Persisted to localStorage)
  const [activeUserId, setActiveUserId] = useState<string>(() => {
    const saved = localStorage.getItem('bad_current_user_id');
    return saved || 'member-1';
  });

  const activeUser = members.find((m) => m.id === activeUserId) || members[0];

  // Modals state
  const [isClubhouseHubOpen, setIsClubhouseHubOpen] = useState(false);
  const [clubhouseHubInitialTab, setClubhouseHubInitialTab] = useState<'profiles' | 'teams'>('profiles');
  const [isUserProfileOpen, setIsUserProfileOpen] = useState(false);
  const [isNewRoundOpen, setIsNewRoundOpen] = useState(false);
  const [isTeamManagerOpen, setIsTeamManagerOpen] = useState(false);

  const handleOpenClubhouseHub = (tab: 'profiles' | 'teams' = 'profiles') => {
    setClubhouseHubInitialTab(tab);
    setIsClubhouseHubOpen(true);
  };
  const [isJoinRoomOpen, setIsJoinRoomOpen] = useState(false);
  const [isOcrOpen, setIsOcrOpen] = useState(false);
  const [isScorecardMatrixOpen, setIsScorecardMatrixOpen] = useState(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [isCourseLibraryOpen, setIsCourseLibraryOpen] = useState(false);
  const [isHandicapOpen, setIsHandicapOpen] = useState(false);
  const [isTeamEventsOpen, setIsTeamEventsOpen] = useState(false);
  const [isBadgeCustomizerOpen, setIsBadgeCustomizerOpen] = useState(false);
  const [isCreateFutureRoundOpen, setIsCreateFutureRoundOpen] = useState(false);
  const [isEditNicknameOpen, setIsEditNicknameOpen] = useState(false);

  // Score History Modals State
  const [selectedMemberForHistory, setSelectedMemberForHistory] = useState<MemberProfile | null>(null);
  const [isPlayerHistoryOpen, setIsPlayerHistoryOpen] = useState(false);
  const [selectedTeamEventForHistory, setSelectedTeamEventForHistory] = useState<TeamEventRecord | null>(null);
  const [selectedTeamNameForHistory, setSelectedTeamNameForHistory] = useState<string | null>(null);
  const [isTeamHistoryOpen, setIsTeamHistoryOpen] = useState(false);

  // Profile Management Handlers
  const handleUpdateProfile = (updatedProfile: MemberProfile) => {
    setMembers((prev) => prev.map((m) => (m.id === updatedProfile.id ? updatedProfile : m)));
  };

  const handleAddNewMember = async (newMember: MemberProfile) => {
    try {
      await fetch('/api/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMember),
      });
    } catch {}
    setMembers((prev) => [...prev, newMember]);
  };

  // Team Management Handlers
  const handleTeamCreated = (newTeam: TeamGroup) => {
    setTeams((prev) => [...prev, newTeam]);
  };

  const handleTeamUpdated = (updatedTeam: TeamGroup) => {
    setTeams((prev) => prev.map((t) => (t.id === updatedTeam.id ? updatedTeam : t)));
  };

  const handleTeamDeleted = (teamId: string) => {
    setTeams((prev) => prev.filter((t) => t.id !== teamId));
  };

  // Refresh handler when a past round is logged manually
  const handleManualRoundLogged = () => {
    fetch('/api/rounds')
      .then((res) => res.json())
      .then((data) => data.rounds && setCompletedRounds(data.rounds))
      .catch(() => {});

    fetch('/api/events')
      .then((res) => res.json())
      .then((data) => data.events && setTeamEvents(data.events))
      .catch(() => {});

    fetch('/api/members')
      .then((res) => res.json())
      .then((data) => data.members && setMembers(data.members))
      .catch(() => {});

    fetch('/api/teams')
      .then((res) => res.json())
      .then((data) => data.teams && setTeams(data.teams))
      .catch(() => {});
  };

  // SSE EventSource reference
  const sseRef = useRef<EventSource | null>(null);

  // Load Initial Data from API (with fallback)
  useEffect(() => {
    fetch('/api/courses')
      .then((res) => res.json())
      .then((data) => {
        if (data.courses && data.courses.length > 0) setCourses(data.courses);
      })
      .catch(() => {});

    fetch('/api/members')
      .then((res) => res.json())
      .then((data) => {
        if (data.members && data.members.length > 0) setMembers(data.members);
      })
      .catch(() => {});

    fetch('/api/rounds')
      .then((res) => res.json())
      .then((data) => {
        if (data.rounds && data.rounds.length > 0) setCompletedRounds(data.rounds);
      })
      .catch(() => {});

    fetch('/api/events')
      .then((res) => res.json())
      .then((data) => {
        if (data.events && data.events.length > 0) setTeamEvents(data.events);
      })
      .catch(() => {});

    fetch('/api/future-rounds')
      .then((res) => res.json())
      .then((data) => {
        if (data.futureRounds && data.futureRounds.length > 0) setFutureRounds(data.futureRounds);
      })
      .catch(() => {});

    fetch('/api/teams')
      .then((res) => res.json())
      .then((data) => {
        if (data.teams && data.teams.length > 0) setTeams(data.teams);
      })
      .catch(() => {});

    // Check localStorage for saved session
    const saved = localStorage.getItem('bad_active_session');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.status === 'active') {
          setActiveSession(parsed);
        }
      } catch {}
    }
  }, []);

  // Sync activeSession to localStorage
  useEffect(() => {
    if (activeSession) {
      localStorage.setItem('bad_active_session', JSON.stringify(activeSession));
    } else {
      localStorage.removeItem('bad_active_session');
    }
  }, [activeSession]);

  // Subscribe to Real-Time SSE stream when an active room code is present
  useEffect(() => {
    if (!activeSession || !activeSession.roomCode) {
      if (sseRef.current) {
        sseRef.current.close();
        sseRef.current = null;
      }
      return;
    }

    const roomCode = activeSession.roomCode;
    const sse = new EventSource(`/api/rooms/${roomCode}/stream`);
    sseRef.current = sse;

    sse.onmessage = (event) => {
      try {
        const updatedSession = JSON.parse(event.data);
        if (updatedSession && updatedSession.roomCode === roomCode) {
          setActiveSession(updatedSession);
        }
      } catch (err) {
        console.error('SSE Parse Error:', err);
      }
    };

    sse.onerror = () => {
      // Reconnection handled automatically by browser
    };

    return () => {
      sse.close();
      sseRef.current = null;
    };
  }, [activeSession?.roomCode]);

  // Handle Update Single Hole Score in Live Round
  const handleUpdateScore = async (playerId: string, holeNumber: number, score: HoleScore) => {
    if (!activeSession) return;

    // Optimistic local update
    const updatedPlayers = activeSession.players.map((p) => {
      if (p.playerId === playerId) {
        return {
          ...p,
          scores: {
            ...p.scores,
            [holeNumber]: score,
          },
        };
      }
      return p;
    });

    const updatedSession: RoundSession = {
      ...activeSession,
      players: updatedPlayers,
      updatedAt: Date.now(),
    };

    setActiveSession(updatedSession);

    // Push to server for SSE broadcasting
    try {
      await fetch(`/api/rooms/${activeSession.roomCode}/score`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId,
          holeNumber,
          score,
        }),
      });
    } catch (err) {
      console.warn('Offline update stored locally:', err);
    }
  };

  // Create New Live Round Session
  const handleCreateSession = async (partialData: Partial<RoundSession>) => {
    try {
      const response = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(partialData),
      });
      const json = await response.json();
      if (json.session) {
        setActiveSession(json.session);
        setCurrentTab('live');
      }
    } catch (err) {
      console.error(err);
      // Fallback local session if server unavailable
      const roomCode = `DART-${Math.floor(10 + Math.random() * 90)}`;
      const localSession: RoundSession = {
        id: `sess-${Date.now()}`,
        roomCode,
        courseId: partialData.courseId || courses[0].id,
        courseName: partialData.courseName || courses[0].name,
        teeId: partialData.teeId || courses[0].tees[0].id,
        teeName: partialData.teeName || courses[0].tees[0].name,
        rating: partialData.rating || courses[0].tees[0].rating,
        slope: partialData.slope || courses[0].tees[0].slope,
        date: partialData.date || new Date().toISOString().split('T')[0],
        format: partialData.format || 'stroke',
        isTeamRound: partialData.format === 'scramble' || partialData.format === 'best_ball',
        status: 'active',
        players: partialData.players || [],
        updatedAt: Date.now(),
      };
      setActiveSession(localSession);
      setCurrentTab('live');
    }
  };

  // Join Existing Round via PIN
  const handleJoinRoom = async (roomCode: string, playerName: string, handicapIndex: number, memberId?: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/rooms/${roomCode}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: playerName,
          handicapIndex,
          playerId: memberId,
        }),
      });

      if (!response.ok) return false;
      const json = await response.json();
      if (json.session) {
        setActiveSession(json.session);
        setCurrentTab('live');
        return true;
      }
      return false;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  // Finish Round & Save
  const handleFinishRound = async () => {
    if (!activeSession) return;
    try {
      await fetch(`/api/rooms/${activeSession.roomCode}/finish`, {
        method: 'POST',
      });
    } catch {}

    // Refresh rounds and events
    fetch('/api/rounds').then((r) => r.json()).then((d) => d.rounds && setCompletedRounds(d.rounds)).catch(() => {});
    fetch('/api/events').then((r) => r.json()).then((d) => d.events && setTeamEvents(d.events)).catch(() => {});
    fetch('/api/members').then((r) => r.json()).then((d) => d.members && setMembers(d.members)).catch(() => {});

    setActiveSession(null);
    setCurrentTab('clubhouse');
  };

  // Save Individual Round from OCR
  const handleSaveIndividualRound = async (roundData: any) => {
    try {
      const response = await fetch('/api/rounds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(roundData),
      });
      const json = await response.json();
      if (json.round) {
        setCompletedRounds((prev) => [json.round, ...prev]);
        fetch('/api/members').then((r) => r.json()).then((d) => d.members && setMembers(d.members)).catch(() => {});
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Save Team Event from OCR
  const handleSaveTeamEvent = async (eventData: any) => {
    try {
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventData),
      });
      const json = await response.json();
      if (json.event) {
        setTeamEvents((prev) => [json.event, ...prev]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Add Custom Course
  const handleAddCourse = async (course: Course) => {
    try {
      await fetch('/api/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(course),
      });
    } catch {}
    setCourses((prev) => [...prev, course]);
  };

  // Save Member Nickname & Badge
  const handleSaveMemberNickname = async (memberId: string, nickname: string, avatarEmoji: string, badgeTitle: string) => {
    try {
      await fetch(`/api/members/${memberId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname, avatarEmoji, badgeTitle }),
      });
    } catch {}

    setMembers((prev) =>
      prev.map((m) => {
        if (m.id === memberId) {
          return { ...m, nickname, avatarEmoji, badgeTitle };
        }
        return m;
      })
    );
  };

  // Create Future Round Placeholder
  const handleCreateFutureRound = async (futureRoundData: Partial<FutureRound>) => {
    try {
      const response = await fetch('/api/future-rounds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(futureRoundData),
      });
      const json = await response.json();
      if (json.futureRound) {
        setFutureRounds((prev) => [json.futureRound, ...prev]);
      }
    } catch (err) {
      console.error(err);
      // Fallback
      const newRound: FutureRound = {
        id: `future-${Date.now()}`,
        courseId: futureRoundData.courseId || courses[0].id,
        courseName: futureRoundData.courseName || courses[0].name,
        targetDate: futureRoundData.targetDate || '2026-10-18',
        targetTimeWindow: futureRoundData.targetTimeWindow || 'Morning',
        status: futureRoundData.status || 'placeholder',
        bookingOpenDaysAhead: 7,
        bookingOpensAt: futureRoundData.bookingOpensAt || '7 days out',
        format: futureRoundData.format || 'stroke',
        registeredPlayerIds: futureRoundData.registeredPlayerIds || [],
        maxPlayers: 4,
        notes: futureRoundData.notes,
      };
      setFutureRounds((prev) => [newRound, ...prev]);
    }
  };

  // RSVP Pre-Registration in Future Round
  const handleRsvpPlayer = async (futureRoundId: string, memberId: string, action: 'join' | 'leave') => {
    try {
      const response = await fetch(`/api/future-rounds/${futureRoundId}/rsvp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId, action }),
      });
      const json = await response.json();
      if (json.futureRound) {
        setFutureRounds((prev) =>
          prev.map((r) => (r.id === futureRoundId ? json.futureRound : r))
        );
      }
    } catch (err) {
      console.error(err);
      // Local fallback
      setFutureRounds((prev) =>
        prev.map((r) => {
          if (r.id === futureRoundId) {
            const updatedIds =
              action === 'leave'
                ? r.registeredPlayerIds.filter((id) => id !== memberId)
                : r.registeredPlayerIds.includes(memberId)
                ? r.registeredPlayerIds
                : [...r.registeredPlayerIds, memberId];
            return { ...r, registeredPlayerIds: updatedIds };
          }
          return r;
        })
      );
    }
  };

  // Start Live Round from Future Round Booking
  const handleStartFutureRound = async (futureRoundId: string) => {
    try {
      const response = await fetch(`/api/future-rounds/${futureRoundId}/start`, {
        method: 'POST',
      });
      const json = await response.json();
      if (json.session) {
        setActiveSession(json.session);
        setCurrentTab('live');
      }
    } catch (err) {
      console.error(err);
      const fr = futureRounds.find((r) => r.id === futureRoundId);
      if (fr) {
        const c = courses.find((item) => item.id === fr.courseId) || courses[0];
        handleCreateSession({
          courseId: c.id,
          courseName: c.name,
          date: fr.targetDate,
          format: fr.format,
          players: fr.registeredPlayerIds.map((pid) => {
            const mem = members.find((m) => m.id === pid);
            return {
              playerId: pid,
              name: mem?.name || 'Player',
              handicapIndex: mem?.handicapIndex || 10,
              courseHandicap: 10,
              scores: {},
            };
          }),
        });
      }
    }
  };

  // Delete Future Round
  const handleDeleteFutureRound = async (futureRoundId: string) => {
    try {
      await fetch(`/api/future-rounds/${futureRoundId}`, { method: 'DELETE' });
    } catch {}
    setFutureRounds((prev) => prev.filter((r) => r.id !== futureRoundId));
  };

  // Open Score History for Member
  const handleOpenMemberHistory = (member: MemberProfile) => {
    setSelectedMemberForHistory(member);
    setIsPlayerHistoryOpen(true);
  };

  // Open Score History for Scramble Team
  const handleOpenTeamHistory = (event: TeamEventRecord, teamName?: string) => {
    setSelectedTeamEventForHistory(event);
    setSelectedTeamNameForHistory(teamName || null);
    setIsTeamHistoryOpen(true);
  };

  // Active course reference for live scorer
  const activeCourse = activeSession
    ? courses.find((c) => c.id === activeSession.courseId) || courses[0]
    : courses[0];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      {/* Top Header Bar */}
      <Header
        currentTab={currentTab}
        setCurrentTab={(tab) => {
          if (tab === 'rankings') setIsHandicapOpen(true);
          else if (tab === 'courses') setIsCourseLibraryOpen(true);
          else if (tab === 'events') setIsTeamEventsOpen(true);
          else if (tab === 'future') {
            setCurrentTab('clubhouse');
            const el = document.getElementById('future-rounds-section');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          } else {
            setCurrentTab(tab);
          }
        }}
        activeSession={activeSession}
        activeUser={activeUser}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
        onOpenNewRound={() => setIsNewRoundOpen(true)}
        onOpenJoinRoom={() => setIsNewRoundOpen(true)}
        onOpenOcr={() => setIsOcrOpen(true)}
        onOpenEditNickname={() => setIsEditNicknameOpen(true)}
        onOpenProfile={() => handleOpenClubhouseHub('profiles')}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-16">
        {currentTab === 'clubhouse' && (
          <ClubhouseDashboard
            members={members}
            completedRounds={completedRounds}
            teamEvents={teamEvents}
            futureRounds={futureRounds}
            courses={courses}
            teams={teams}
            activeSession={activeSession}
            activeUser={activeUser}
            onOpenProfile={() => handleOpenClubhouseHub('profiles')}
            onStartRound={() => setIsNewRoundOpen(true)}
            onLogPastRound={() => setIsNewRoundOpen(true)}
            onOpenTeamManager={() => handleOpenClubhouseHub('teams')}
            onJoinRoom={() => setIsNewRoundOpen(true)}
            onScanScorecard={() => setIsOcrOpen(true)}
            onViewRankings={() => setIsHandicapOpen(true)}
            onViewCourses={() => setIsCourseLibraryOpen(true)}
            onResumeLiveRound={() => setCurrentTab('live')}
            onOpenBadgeCustomizer={() => setIsBadgeCustomizerOpen(true)}
            onOpenCreateFutureRound={() => setIsCreateFutureRoundOpen(true)}
            onRsvpPlayer={handleRsvpPlayer}
            onStartFutureRound={handleStartFutureRound}
            onDeleteFutureRound={handleDeleteFutureRound}
            onOpenEditNickname={() => setIsEditNicknameOpen(true)}
            onSelectMemberForHistory={handleOpenMemberHistory}
            onSelectTeamForHistory={handleOpenTeamHistory}
          />
        )}

        {currentTab === 'live' && activeSession && (
          <LiveRoundScorer
            session={activeSession}
            course={activeCourse}
            onUpdateScore={handleUpdateScore}
            onOpenScorecardMatrix={() => setIsScorecardMatrixOpen(true)}
            onOpenLeaderboard={() => setIsLeaderboardOpen(true)}
            onFinishRound={handleFinishRound}
            onExitRound={() => setCurrentTab('clubhouse')}
          />
        )}
      </main>

      {/* MODALS */}
      <ClubhouseHubModal
        isOpen={isClubhouseHubOpen}
        onClose={() => setIsClubhouseHubOpen(false)}
        initialTab={clubhouseHubInitialTab}
        members={members}
        activeUserId={activeUserId}
        onSelectActiveUser={setActiveUserId}
        onUpdateProfile={handleUpdateProfile}
        onAddNewMember={handleAddNewMember}
        completedRounds={completedRounds}
        teams={teams}
        onTeamCreated={handleTeamCreated}
        onTeamUpdated={handleTeamUpdated}
        onTeamDeleted={handleTeamDeleted}
        onSelectTeamForRound={(_team) => {
          setIsNewRoundOpen(true);
        }}
      />

      <NewRoundModal
        isOpen={isNewRoundOpen}
        onClose={() => setIsNewRoundOpen(false)}
        courses={courses}
        members={members}
        teams={teams}
        activeUserId={activeUserId}
        onCourseAdded={handleAddCourse}
        onCreateSession={handleCreateSession}
        onOpenTeamManager={() => handleOpenClubhouseHub('teams')}
        onManualRoundLogged={handleManualRoundLogged}
        onJoinRoom={handleJoinRoom}
      />

      <ScrambleTeamManagerModal
        isOpen={isTeamManagerOpen}
        onClose={() => setIsTeamManagerOpen(false)}
        teams={teams}
        members={members}
        onTeamCreated={handleTeamCreated}
        onTeamUpdated={handleTeamUpdated}
        onTeamDeleted={handleTeamDeleted}
        onSelectTeamForRound={(_team) => {
          setIsNewRoundOpen(true);
        }}
      />

      <JoinRoomModal
        isOpen={isJoinRoomOpen}
        onClose={() => setIsJoinRoomOpen(false)}
        members={members}
        onJoinRoom={handleJoinRoom}
      />

      <ScorecardOcrModal
        isOpen={isOcrOpen}
        onClose={() => setIsOcrOpen(false)}
        courses={courses}
        members={members}
        onSaveIndividualRound={handleSaveIndividualRound}
        onSaveTeamEvent={handleSaveTeamEvent}
      />

      {activeSession && (
        <>
          <FormatScorecardModal
            isOpen={isScorecardMatrixOpen}
            onClose={() => setIsScorecardMatrixOpen(false)}
            session={activeSession}
            course={activeCourse}
          />

          <LeaderboardModal
            isOpen={isLeaderboardOpen}
            onClose={() => setIsLeaderboardOpen(false)}
            session={activeSession}
            course={activeCourse}
          />
        </>
      )}

      <CourseLibraryModal
        isOpen={isCourseLibraryOpen}
        onClose={() => setIsCourseLibraryOpen(false)}
        courses={courses}
        onAddCourse={handleAddCourse}
      />

      <HandicapLeaderboardModal
        isOpen={isHandicapOpen}
        onClose={() => setIsHandicapOpen(false)}
        members={members}
        onSelectMemberForHistory={handleOpenMemberHistory}
      />

      <TeamEventsModal
        isOpen={isTeamEventsOpen}
        onClose={() => setIsTeamEventsOpen(false)}
        events={teamEvents}
        onSelectTeamForHistory={handleOpenTeamHistory}
      />

      <PlayerHistoryModal
        isOpen={isPlayerHistoryOpen}
        onClose={() => setIsPlayerHistoryOpen(false)}
        member={selectedMemberForHistory}
        rounds={completedRounds}
        teamEvents={teamEvents}
        activeUserId={activeUserId}
        onOpenEditProfile={() => handleOpenClubhouseHub('profiles')}
      />

      <TeamHistoryModal
        isOpen={isTeamHistoryOpen}
        onClose={() => setIsTeamHistoryOpen(false)}
        event={selectedTeamEventForHistory}
        selectedTeamName={selectedTeamNameForHistory}
      />

      <ClubLogoCustomizer
        isOpen={isBadgeCustomizerOpen}
        onClose={() => setIsBadgeCustomizerOpen(false)}
        members={members}
        onUpdateMemberNickname={(id, nick, badge) => handleSaveMemberNickname(id, nick, '🎯', badge)}
      />

      <CreateFutureRoundModal
        isOpen={isCreateFutureRoundOpen}
        onClose={() => setIsCreateFutureRoundOpen(false)}
        courses={courses}
        members={members}
        activeUserId={activeUserId}
        onCourseAdded={handleAddCourse}
        onCreateFutureRound={handleCreateFutureRound}
      />

      <EditNicknameModal
        isOpen={isEditNicknameOpen}
        onClose={() => setIsEditNicknameOpen(false)}
        members={members}
        onSaveMemberNickname={handleSaveMemberNickname}
      />

      <UserProfileModal
        isOpen={isUserProfileOpen}
        onClose={() => setIsUserProfileOpen(false)}
        members={members}
        activeUserId={activeUserId}
        onSelectActiveUser={(id) => {
          setActiveUserId(id);
          localStorage.setItem('bad_current_user_id', id);
        }}
        onUpdateProfile={handleUpdateProfile}
        onAddNewMember={handleAddNewMember}
        completedRounds={completedRounds}
      />
    </div>
  );
}
