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
    const unsubRounds = subscribeToCollection<CompletedRoundRecord>('rounds', setCompletedRounds);
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
  const [selectedTeamEventForHistory, setSelectedTeamEventForHistory] = useState<TeamEventRecord | null>(null);
  const [selectedTeamNameForHistory, setSelectedTeamNameForHistory] = useState<string | null>(null);
  const [isTeamHistoryOpen, setIsTeamHistoryOpen] = useState(false);

  const handleOpenClubhouseHub = (tab: 'profiles' | 'teams' = 'profiles') => {
    setClubhouseHubInitialTab(tab);
    setIsClubhouseHubOpen(true);
  };

  const handleUpdateProfile = async (updatedProfile: MemberProfile) => {
    if (!updatedProfile.id) return;
    
    // Strip out undefined values (like empty phones or goals) so Firebase doesn't crash
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
    await updateRecord('teams', updatedTeam.id, updatedTeam);
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
    await addRecord('future_rounds', newRound);
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

  // Helper to recalculate a player's stats after a round is saved/edited
  const recalculatePlayerStats = async (playerId: string) => {
    const member = members.find(m => m.id === playerId);
    if (!member) return;

    // Get all rounds for this player
    const playerRounds = completedRounds.filter(r => r.playerId === playerId);
    if (playerRounds.length === 0) return;

    const roundsCount = playerRounds.length;
    const bestRound = Math.min(...playerRounds.map(r => r.grossScore || 999));
    
    // Averages
    const totalGross = playerRounds.reduce((acc, r) => acc + (r.grossScore || 0), 0);
    const scoringAverage = Number((totalGross / roundsCount).toFixed(1));
    
    // Only count putts/GIR if they were recorded
    const roundsWithPutts = playerRounds.filter(r => r.totalPutts && r.totalPutts > 0);
    const avgPutts = roundsWithPutts.length > 0 
      ? Number((roundsWithPutts.reduce((acc, r) => acc + r.totalPutts, 0) / roundsWithPutts.length).toFixed(1)) 
      : 0;

    const roundsWithGir = playerRounds.filter(r => r.girPercent !== undefined);
    const girPercent = roundsWithGir.length > 0 
      ? Math.round(roundsWithGir.reduce((acc, r) => acc + (r.girPercent || 0), 0) / roundsWithGir.length) 
      : 0;

    const updatedProfile = {
      ...member,
      roundsCount,
      bestRound: bestRound === 999 ? 0 : bestRound,
      scoringAverage,
      avgPutts,
      girPercent
    };

    await updateRecord('members', playerId, updatedProfile);
  };

  const handleSaveIndividualRound = async (roundData: any) => {
    const roundId = roundData.id || `round-${Date.now()}`;
    await setDoc(doc(db, 'rounds', roundId), { ...roundData, id: roundId });
    // Recalculate stats for the player!
    if (roundData.playerId) await recalculatePlayerStats(roundData.playerId);
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
      // Recalculate stats!
      if (data.playerId) await recalculatePlayerStats(data.playerId);
    } catch (error) {
      console.error("Failed to save past round to Firebase:", error);
    }
  };

  const handleUpdatePastRound = async (roundId: string, updatedData: Partial<CompletedRoundRecord>) => {
    try {
      const cleanData = JSON.parse(JSON.stringify(updatedData));
      await updateRecord('rounds', roundId, cleanData);
      
      // Look up the round we just edited to see whose stats we need to recalculate
      const targetRound = completedRounds.find(r => r.id === roundId);
      if (targetRound && targetRound.playerId) {
        await recalculatePlayerStats(targetRound.playerId);
      }
    } catch (error) {
      console.error("Failed to update past round:", error);
    }
  };

  const handleOpenMemberHistory = (member: MemberProfile) => {
    setSelectedMemberForHistory(member);
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
        onClose={() => setIsPlayerHistoryOpen(false)}
        member={selectedMemberForHistory}
        rounds={completedRounds}
        teamEvents={teamEvents}
        activeUserId={activeUserId}
        onOpenEditProfile={() => handleOpenClubhouseHub('profiles')}
        courses={courses}
        onUpdatePastRound={handleUpdatePastRound}
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
