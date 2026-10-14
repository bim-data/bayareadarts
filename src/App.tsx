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
import { AuthScreen } from './components/AuthScreen'; 
import { useAuth } from './contexts/AuthContext';
import { doc, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import { X } from 'lucide-react';
import { getAuth, signOut } from 'firebase/auth';

import { subscribeToCollection, addRecord, updateRecord, deleteRecord } from './services/db';

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

export default function App() {
  const [currentTab, setCurrentTab] = useState<'clubhouse' | 'live' | 'rankings' | 'courses' | 'events' | 'future'>('clubhouse');
  
  const { currentUser, memberProfile, loading: authLoading } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  useEffect(() => {
    if (currentUser) setIsAuthModalOpen(false);
  }, [currentUser]);

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

  const [courses, setCourses] = useState<Course[]>([]);
  const [members, setMembers] = useState<MemberProfile[]>([]);
  const [completedRounds, setCompletedRounds] = useState<CompletedRoundRecord[]>([]);
  const [teamEvents, setTeamEvents] = useState<TeamEventRecord[]>([]);
  const [futureRounds, setFutureRounds] = useState<FutureRound[]>([]);
  const [teams, setTeams] = useState<TeamGroup[]>([]);
  const [activeSession, setActiveSession] = useState<RoundSession | null>(null);

  useEffect(() => {
    const unsubCourses = subscribeToCollection<Course>('courses', setCourses);
    const unsubMembers = subscribeToCollection<MemberProfile>('members', setMembers);
    
    // Subscribe to rounds and force sort by Date descending!
    const unsubRounds = subscribeToCollection<CompletedRoundRecord>('rounds', (data) => {
      const sorted = [...data].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
      setCompletedRounds(sorted);
    });

    const unsubEvents = subscribeToCollection<TeamEventRecord>('events', setTeamEvents);
    const unsubFuture = subscribeToCollection<FutureRound>('future_rounds', setFutureRounds);
    const unsubTeams = subscribeToCollection<TeamGroup>('teams', setTeams);

    return () => {
      unsubCourses();
      unsubMembers();
      unsubRounds();
      unsubEvents();
      unsubFuture();
      unsubTeams();
    };
  }, []);

  const activeUserId = currentUser?.uid || '';
  const activeUser = memberProfile || members.find(m => m.id === activeUserId);

  const [isClubhouseHubOpen, setIsClubhouseHubOpen] = useState(false);
  const [clubhouseHubInitialTab, setClubhouseHubInitialTab] = useState<'profiles' | 'teams'>('profiles');
  const [isUserProfileOpen, setIsUserProfileOpen] = useState(false);
  const [isNewRoundOpen, setIsNewRoundOpen] = useState(false);
  const [preselectedTeamId, setPreselectedTeamId] = useState<string | undefined>(undefined);
  const [isTeamManagerOpen, setIsTeamManagerOpen] = useState(false);
  const [isJoinRoomOpen, setIsJoinRoomOpen] = useState(false);
  const [isOcrOpen, setIsOcrOpen] = useState(false);
  const [isScorecardMatrixOpen, setIsScorecardMatrixOpen] = useState(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [isCourseLibraryOpen, setIsCourseLibraryOpen] = useState(false);
  const [isHandicapOpen, setIsHandicapOpen] = useState(false);
  const [isTeamEventsOpen, setIsTeamEventsOpen] = useState(false);
  const [isBadgeCustomizerOpen, setIsBadgeCustomizerOpen] = useState(false);
  const [isCreateFutureRoundOpen, setIsCreateFutureRoundOpen] = useState(false);
  const [preselectedCourseId, setPreselectedCourseId] = useState<string | undefined>(undefined);
  const [isEditNicknameOpen, setIsEditNicknameOpen] = useState(false);

  const [selectedMemberForHistory, setSelectedMemberForHistory] = useState<MemberProfile | null>(null);
  const [isPlayerHistoryOpen, setIsPlayerHistoryOpen] = useState(false);
  const [selectedHistoryRoundId, setSelectedHistoryRoundId] = useState<string | undefined>(undefined);
  
  const [selectedTeamEventForHistory, setSelectedTeamEventForHistory] = useState<TeamEventRecord | null>(null);
  const [selectedTeamNameForHistory, setSelectedTeamNameForHistory] = useState<string | null>(null);
  const [isTeamHistoryOpen, setIsTeamHistoryOpen] = useState(false);

  const handleOpenClubhouseHub = (tab: 'profiles' | 'teams' = 'profiles') => {
    setClubhouseHubInitialTab(tab);
    setIsClubhouseHubOpen(true);
  };

  const handleUpdateProfile = async (updatedProfile: MemberProfile) => {
    if (!updatedProfile.id) return;
    const cleanProfile = Object.fromEntries(
      Object.entries(updatedProfile).filter(([_, v]) => v !== undefined)
    );
    await updateRecord('members', cleanProfile.id, cleanProfile);
  };

  const handleAddNewMember = async (newMember: MemberProfile) => {
    await addRecord('members', newMember);
  };

  const handleTeamCreated = async (newTeam: TeamGroup) => {
    try {
      const teamId = newTeam.id || `team-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const teamToSave = {
        ...newTeam,
        id: teamId,
        notes: newTeam.notes || '',
        createdAt: Date.now()
      };
      const cleanTeamToSave = Object.fromEntries(
        Object.entries(teamToSave).filter(([_, v]) => v !== undefined)
      );
      await setDoc(doc(db, 'teams', teamId), cleanTeamToSave);
    } catch (err) {
      console.error("Error saving team to Firebase:", err);
    }
  };

  const handleTeamUpdated = async (updatedTeam: TeamGroup) => {
    if (!updatedTeam.id) return;
    const cleanTeam = Object.fromEntries(
      Object.entries(updatedTeam).filter(([_, v]) => v !== undefined)
    );
    await updateRecord('teams', cleanTeam.id, cleanTeam);
  };

  const handleTeamDeleted = async (teamId: string) => {
    await deleteRecord('teams', teamId);
  };

  const handleAddCourse = async (course: Course) => {
    await addRecord('courses', course);
  };

  const handleSaveMemberNickname = async (memberId: string, nickname: string, avatarEmoji: string, badgeTitle: string) => {
    await updateRecord('members', memberId, { nickname, avatarEmoji, badgeTitle });
  };

  const handleCreateFutureRound = async (futureRoundData: Partial<FutureRound>) => {
    const newRound = {
      ...futureRoundData,
      id: `future-${Date.now()}`,
      status: futureRoundData.status || 'placeholder',
      registeredPlayerIds: futureRoundData.registeredPlayerIds || [],
    };
    
    // Strip out undefined values (like empty notes) so Firebase doesn't crash
    const cleanRound = Object.fromEntries(
      Object.entries(newRound).filter(([_, v]) => v !== undefined)
    );
    
    await addRecord('future_rounds', cleanRound);
  };

  const handleRsvpPlayer = async (futureRoundId: string, memberId: string, action: 'join' | 'leave') => {
    const round = futureRounds.find(r => r.id === futureRoundId);
    if (!round) return;

    let updatedIds = [...round.registeredPlayerIds];
    if (action === 'join' && !updatedIds.includes(memberId)) {
      updatedIds.push(memberId);
    } else if (action === 'leave') {
      updatedIds = updatedIds.filter(id => id !== memberId);
    }
    await updateRecord('future_rounds', futureRoundId, { registeredPlayerIds: updatedIds });
  };

  const handleDeleteFutureRound = async (futureRoundId: string) => {
    await deleteRecord('future_rounds', futureRoundId);
  };

  // Helper to accurately calculate WHS Index with strict Number casting
  const calculateWHSIndex = (diffs: number[]) => {
    if (diffs.length < 3) return 0;
    
    // Convert to numbers and sort lowest to highest safely
    const sorted = [...diffs].map(Number).filter(n => !isNaN(n)).sort((a, b) => a - b);
    
    let toCount = 1;
    let adjustment = 0;

    if (sorted.length === 3) { toCount = 1; adjustment = -2.0; }
    else if (sorted.length === 4) { toCount = 1; adjustment = -1.0; }
    else if (sorted.length === 5) { toCount = 1; adjustment = 0; }
    else if (sorted.length === 6) { toCount = 2; adjustment = -1.0; }
    else if (sorted.length === 7 || sorted.length === 8) { toCount = 2; adjustment = 0; }
    else if (sorted.length >= 9 && sorted.length <= 11) { toCount = 3; adjustment = 0; }
    else if (sorted.length >= 12 && sorted.length <= 14) { toCount = 4; adjustment = 0; }
    else if (sorted.length === 15 || sorted.length === 16) { toCount = 5; adjustment = 0; }
    else if (sorted.length === 17 || sorted.length === 18) { toCount = 6; adjustment = 0; }
    else if (sorted.length === 19) { toCount = 7; adjustment = 0; }
    else { toCount = 8; adjustment = 0; }

    const countingDiffs = sorted.slice(0, toCount);
    const sum = countingDiffs.reduce((acc, val) => acc + val, 0);
    const rawAvg = sum / toCount;
    
    let finalIndex = rawAvg + adjustment;
    // Cap maximum index at 54.0 and prevent negative zero
    if (finalIndex > 54.0) finalIndex = 54.0;
    if (finalIndex < 0 && finalIndex > -0.05) finalIndex = 0;
    
    // Truncate to 1 decimal place (WHS rules: don't round up)
    return Math.floor(finalIndex * 10) / 10;
  };

  // Helper to recalculate a player's stats after a round is saved/edited
  const recalculatePlayerStats = async (playerId: string, extraRound?: any) => {
    const member = members.find(m => m.id === playerId);
    if (!member) return;

    let playerRounds = completedRounds.filter(r => r.playerId === playerId);
    if (extraRound) {
      const idx = playerRounds.findIndex(r => r.id === extraRound.id);
      if (idx >= 0) playerRounds[idx] = extraRound;
      else playerRounds.push(extraRound);
    }

    // Force string-based sorting for YYYY-MM-DD dates to ensure order
    playerRounds.sort((a, b) => (b.date || '').localeCompare(a.date || ''));

    // PROTECT HANDICAP: Filter out scrambles and team events from individual stats
    const individualRounds = playerRounds.filter(r => 
      r.format !== 'scramble' && 
      r.format !== 'best_ball' && 
      !r.isTeamRound
    );

    const roundsCount = individualRounds.length;
    
    // Strictly isolate 18-hole vs 9-hole rounds
    const rounds18 = individualRounds.filter(r => r.holesPlayed === '18' || !r.holesPlayed);
    const rounds9 = individualRounds.filter(r => r.holesPlayed === 'front_9' || r.holesPlayed === 'back_9');

    const bestRound = rounds18.length > 0 ? Math.min(...rounds18.map(r => Number(r.grossScore) || 999)) : 0;
    const bestRound9 = rounds9.length > 0 ? Math.min(...rounds9.map(r => Number(r.grossScore) || 999)) : 0;
    
    const totalGross18 = rounds18.reduce((acc, r) => acc + (Number(r.grossScore) || 0), 0);
    const scoringAverage = rounds18.length > 0 ? Number((totalGross18 / rounds18.length).toFixed(1)) : 0;
    
    const roundsWithPutts = playerRounds.filter(r => r.totalPutts && Number(r.totalPutts) > 0);
    const avgPutts = roundsWithPutts.length > 0 
      ? Number((roundsWithPutts.reduce((acc, r) => acc + Number(r.totalPutts), 0) / roundsWithPutts.length).toFixed(1)) 
      : 0;

    const roundsWithGir = playerRounds.filter(r => r.girPercent !== undefined);
    const girPercent = roundsWithGir.length > 0 
      ? Math.round(roundsWithGir.reduce((acc, r) => acc + Number(r.girPercent || 0), 0) / roundsWithGir.length) 
      : 0;

    // Build the Differentials History using ONLY 18-hole rounds
    const recentDiffsRaw = rounds18
      .filter(r => r.differential !== undefined && !isNaN(Number(r.differential)))
      .slice(0, 20);

    const diffValues = recentDiffsRaw.map(r => Number(r.differential));
    const newHandicapIndex = calculateWHSIndex(diffValues);

    const sortedVals = [...diffValues].sort((a, b) => a - b);
    let toCount = 1;
    if (diffValues.length >= 20) toCount = 8;
    else if (diffValues.length >= 19) toCount = 7;
    else if (diffValues.length >= 17) toCount = 6;
    else if (diffValues.length >= 15) toCount = 5;
    else if (diffValues.length >= 12) toCount = 4;
    else if (diffValues.length >= 9) toCount = 3;
    else if (diffValues.length >= 6) toCount = 2;

    const thresholdValue = sortedVals[toCount - 1] || 999;
    let countedSoFar = 0;

    const newDifferentialsList = recentDiffsRaw.map((r) => {
      let isUsed = false;
      const diffNum = Number(r.differential);
      if (diffNum <= thresholdValue && countedSoFar < toCount) {
        isUsed = true;
        countedSoFar++;
      }
      return {
        roundId: r.id,
        courseName: r.courseName,
        date: r.date,
        grossScore: Number(r.grossScore) || 0,
        differential: diffNum || 0,
        usedInIndex: isUsed
      };
    });

    const updatedProfile = {
      ...member,
      roundsCount,
      bestRound: bestRound === 999 ? 0 : bestRound,
      bestRound9: bestRound9 === 999 ? 0 : bestRound9,
      scoringAverage,
      avgPutts,
      girPercent,
      handicapIndex: newHandicapIndex,
      differentials: newDifferentialsList
    };

    await updateRecord('members', playerId, updatedProfile);
  };

  const handleSaveIndividualRound = async (roundData: any) => {
    const roundId = roundData.id || `round-${Date.now()}`;
    await setDoc(doc(db, 'rounds', roundId), { ...roundData, id: roundId });
    if (roundData.playerId) await recalculatePlayerStats(roundData.playerId, { ...roundData, id: roundId });
  };

  const handleSaveTeamEvent = async (eventData: any) => {
    const eventId = eventData.id || `event-${Date.now()}`;
    await setDoc(doc(db, 'events', eventId), { ...eventData, id: eventId });
  };

  useEffect(() => {
    const saved = localStorage.getItem('bad_active_session');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.status === 'active') setActiveSession(parsed);
      } catch {}
    }
  }, []);

  useEffect(() => {
    if (activeSession) {
      localStorage.setItem('bad_active_session', JSON.stringify(activeSession));
    } else {
      localStorage.removeItem('bad_active_session');
    }
  }, [activeSession]);

  const handleCreateSession = async (partialData: Partial<RoundSession>) => {
    const roomCode = `DART-${Math.floor(10 + Math.random() * 90)}`;
    const newSession: RoundSession = {
      id: `sess-${Date.now()}`,
      roomCode,
      courseId: partialData.courseId || courses[0]?.id || '',
      courseName: partialData.courseName || courses[0]?.name || '',
      teeId: partialData.teeId || '',
      teeName: partialData.teeName || '',
      rating: partialData.rating || 72,
      slope: partialData.slope || 113,
      date: partialData.date || new Date().toISOString().split('T')[0],
      format: partialData.format || 'stroke',
      isTeamRound: partialData.format === 'scramble' || partialData.format === 'best_ball',
      status: 'active',
      holesPlayed: partialData.holesPlayed || '18',
      players: partialData.players || [],
      updatedAt: Date.now(),
    };
    setActiveSession(newSession);
    setCurrentTab('live');
  };

  const handleUpdateScore = async (playerId: string, holeNumber: number, score: HoleScore) => {
    if (!activeSession) return;
    const updatedPlayers = activeSession.players.map((p) => {
      if (p.playerId === playerId) {
        return { ...p, scores: { ...p.scores, [holeNumber]: score } };
      }
      return p;
    });
    setActiveSession({ ...activeSession, players: updatedPlayers, updatedAt: Date.now() });
  };

  const handleFinishRound = async () => {
    setActiveSession(null);
    setCurrentTab('clubhouse');
  };

  const handleJoinRoom = async (_roomCode: string, _playerName: string, _handicapIndex: number, _memberId?: string) => { return false; };
  const handleStartFutureRound = async (_futureRoundId: string) => {};

  const handleManualRoundLogged = async (data: Record<string, any>) => {
    try {
      const roundId = `round-${Date.now()}`;
      const newRound = {
        id: roundId,
        ...data,
        createdAt: Date.now()
      };
      await setDoc(doc(db, 'rounds', roundId), newRound);
      console.log("Successfully saved past round:", newRound);
      if (data.playerId) await recalculatePlayerStats(data.playerId, newRound);
    } catch (error) {
      console.error("Failed to save past round to Firebase:", error);
    }
  };

  const handleUpdatePastRound = async (roundId: string, updatedData: Partial<CompletedRoundRecord>) => {
    try {
      const cleanData = JSON.parse(JSON.stringify(updatedData));
      await updateRecord('rounds', roundId, cleanData);
      
      const existingRound = completedRounds.find(r => r.id === roundId);
      if (existingRound && existingRound.playerId) {
        const mergedRound = { ...existingRound, ...cleanData };
        await recalculatePlayerStats(existingRound.playerId, mergedRound);
      }
    } catch (error) {
      console.error("Failed to update past round:", error);
    }
  };

  const handleOpenMemberHistory = (member: MemberProfile, roundId?: string) => {
    setSelectedMemberForHistory(member);
    setSelectedHistoryRoundId(roundId);
    setIsPlayerHistoryOpen(true);
  };

  const handleOpenTeamHistory = (event: TeamEventRecord, teamName?: string) => {
    setSelectedTeamEventForHistory(event);
    setSelectedTeamNameForHistory(teamName || null);
    setIsTeamHistoryOpen(true);
  };

  const activeCourse = activeSession
    ? courses.find((c) => c.id === activeSession.courseId) || courses[0]
    : courses[0];

  if (authLoading) return <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center text-emerald-500 font-bold">Loading Clubhouse...</div>;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
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
        onOpenNewRound={() => {
          if (!currentUser) return setIsAuthModalOpen(true);
          setIsNewRoundOpen(true);
        }}
        onOpenOcr={() => setIsOcrOpen(true)}
        onOpenEditNickname={() => setIsEditNicknameOpen(true)}
        onOpenProfile={() => {
          if (!currentUser) return setIsAuthModalOpen(true);
          handleOpenClubhouseHub('profiles');
        }}
        onOpenLogin={() => setIsAuthModalOpen(true)}
        onLogout={async () => {
          const auth = getAuth();
          await signOut(auth);
        }}
      />

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
            onOpenProfile={() => {
              if (!currentUser) return setIsAuthModalOpen(true);
              handleOpenClubhouseHub('profiles');
            }}
            onStartRound={() => {
              if (!currentUser) return setIsAuthModalOpen(true);
              setIsNewRoundOpen(true);
            }}
            onLogPastRound={() => {
              if (!currentUser) return setIsAuthModalOpen(true);
              setIsNewRoundOpen(true);
            }}
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

      <ClubhouseHubModal
        isOpen={isClubhouseHubOpen}
        onClose={() => setIsClubhouseHubOpen(false)}
        initialTab={clubhouseHubInitialTab}
        members={members}
        activeUserId={activeUserId}
        onSelectActiveUser={() => {}}
        onUpdateProfile={handleUpdateProfile}
        onAddNewMember={handleAddNewMember}
        completedRounds={completedRounds}
        teamEvents={teamEvents}
        teams={teams}
        onTeamCreated={handleTeamCreated}
        onTeamUpdated={handleTeamUpdated}
        onTeamDeleted={handleTeamDeleted}
        onSelectTeamForRound={(team) => {
          setPreselectedTeamId(team.id);
          setIsNewRoundOpen(true);
        }}
        courses={courses}
        onUpdatePastRound={handleUpdatePastRound}
      />

      <NewRoundModal
        isOpen={isNewRoundOpen}
        onClose={() => {
          setIsNewRoundOpen(false);
          setPreselectedTeamId(undefined);
        }}
        courses={courses}
        members={members}
        teams={teams}
        activeUserId={activeUserId}
        initialSelectedTeamId={preselectedTeamId}
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
        onSelectTeamForRound={(_team) => setIsNewRoundOpen(true)}
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
        teams={teams}
        activeUserId={activeUserId}
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
        onPlanFutureRound={(courseId) => {
          setPreselectedCourseId(courseId); // Save the course!
          setIsCourseLibraryOpen(false);
          setIsCreateFutureRoundOpen(true);
        }}
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
        onClose={() => {
          setIsPlayerHistoryOpen(false);
          setSelectedHistoryRoundId(undefined);
        }}
        member={selectedMemberForHistory}
        rounds={completedRounds}
        teamEvents={teamEvents}
        activeUserId={activeUserId}
        onOpenEditProfile={() => handleOpenClubhouseHub('profiles')}
        courses={courses}
        onUpdatePastRound={handleUpdatePastRound}
        initialExpandedRoundId={selectedHistoryRoundId}
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
        onClose={() => {
          setIsCreateFutureRoundOpen(false);
          setPreselectedCourseId(undefined); // Clear it when closing
        }}
        courses={courses}
        members={members}
        activeUserId={activeUserId}
        initialSelectedCourseId={preselectedCourseId} // Pass the course!
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
        onSelectActiveUser={() => {}}
        onUpdateProfile={handleUpdateProfile}
        onAddNewMember={handleAddNewMember}
        completedRounds={completedRounds}
      />

      {(!currentUser && isAuthModalOpen) && (
        <div className="fixed inset-0 z-[100] bg-slate-50 dark:bg-slate-950 overflow-y-auto">
          <button 
            onClick={() => setIsAuthModalOpen(false)} 
            className="absolute top-4 right-4 sm:top-6 sm:right-6 p-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 rounded-full text-slate-900 dark:text-white z-50 transition-colors shadow-lg cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
          <AuthScreen />
        </div>
      )}
    </div>
  );
}
