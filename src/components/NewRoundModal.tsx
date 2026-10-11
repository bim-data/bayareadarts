import React, { useState, useEffect } from 'react';
import { 
  X, 
  Play, 
  Plus, 
  Trash2, 
  Flag, 
  Shield, 
  Check, 
  Calendar, 
  Clock, 
  Users, 
  Sparkles, 
  CheckCircle2, 
  Edit3, 
  FileText, 
  Sliders, 
  ChevronRight,
  Flame,
  AlertCircle,
  KeyRound,
  RefreshCw,
  ArrowRight
} from 'lucide-react';
import { Course, GameFormat, MemberProfile, PlayerRoundData, RoundSession, TeeBox, TeamGroup, HoleScore } from '../types';
import { SearchableCourseSelect } from './SearchableCourseSelect';
import { AddCourseModal } from './AddCourseModal';
import { findWhiteOrEquivalentTee } from '../utils/teeUtils';
import { calculateTeamScrambleHandicap } from './ScrambleTeamManagerModal';

interface NewRoundModalProps {
  isOpen: boolean;
  onClose: () => void;
  courses: Course[];
  members: MemberProfile[];
  teams?: TeamGroup[];
  activeUserId?: string;
  onCourseAdded?: (newCourse: Course) => void;
  onCreateSession: (sessionData: Partial<RoundSession>) => void;
  onOpenTeamManager?: () => void;
  onManualRoundLogged?: (data: any) => void;
  onJoinRoom?: (roomCode: string, playerName: string, handicapIndex: number, memberId?: string) => Promise<boolean>;
}

export const NewRoundModal: React.FC<NewRoundModalProps> = ({
  isOpen,
  onClose,
  courses,
  members,
  teams = [],
  activeUserId,
  onCourseAdded,
  onCreateSession,
  onOpenTeamManager,
  onManualRoundLogged,
  onJoinRoom,
}) => {
  // Top tab: Live Round vs. Join PIN vs. Log Past Round
  const [modalTab, setModalTab] = useState<'live' | 'join' | 'manual'>('live');

  // Course & Tee Selection
  const [selectedCourseId, setSelectedCourseId] = useState<string>(courses[0]?.id || '');
  const selectedCourse = courses.find((c) => c.id === selectedCourseId) || courses[0];

  // Default to White tee or equivalent!
  const [selectedTeeId, setSelectedTeeId] = useState<string>(() => {
    return findWhiteOrEquivalentTee(selectedCourse);
  });
  const selectedTee = selectedCourse?.tees.find((t: TeeBox) => t.id === selectedTeeId) || selectedCourse?.tees[0];

  // Game Format Selection
  const [format, setFormat] = useState<GameFormat>('stroke');

  // Participant Mode: Individual Golfers vs. Pre-Built Scramble Teams
  const [participantMode, setParticipantMode] = useState<'golfers' | 'teams'>('golfers');
  const [selectedPlayers, setSelectedPlayers] = useState<PlayerRoundData[]>([]);
  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([]);

  // Sub-modal for custom course creation
  const [isAddCourseModalOpen, setIsAddCourseModalOpen] = useState(false);

  // Active user profile
  const activeUser = members.find((m) => m.id === activeUserId) || members[0] || {
    id: 'member-1',
    name: 'Dave Wong',
    nickname: 'Dave',
    handicapIndex: 9.4,
  };

  // Join Room via PIN State
  const [joinRoomCode, setJoinRoomCode] = useState('');
  const [joinSelectedMemberId, setJoinSelectedMemberId] = useState<string>(activeUserId || members[0]?.id || '');
  const [joinIsGuest, setJoinIsGuest] = useState(false);
  const [joinGuestName, setJoinGuestName] = useState('');
  const [joinGuestHcp, setJoinGuestHcp] = useState('10.0');
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinErrorMsg, setJoinErrorMsg] = useState<string | null>(null);

  // Manual Past Round State
  const [roundDate, setRoundDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [manualEntryMode, setManualEntryMode] = useState<'hole_by_hole' | 'quick_total'>('hole_by_hole');
  const [manualGrossScore, setManualGrossScore] = useState<number>(82);
  const [manualPuttsTotal, setManualPuttsTotal] = useState<number>(32);
  const [manualFirPercent, setManualFirPercent] = useState<number>(55);
  const [manualGirPercent, setManualGirPercent] = useState<number>(50);

  // 18-hole score record for hole-by-hole manual input
  const [manualHoleScores, setManualHoleScores] = useState<Record<number, HoleScore>>(() => {
    const initial: Record<number, HoleScore> = {};
    for (let i = 1; i <= 18; i++) {
      initial[i] = { strokes: 4, putts: 2, fir: 'hit', gir: false };
    }
    return initial;
  });

  const [isSubmittingManual, setIsSubmittingManual] = useState(false);
  const [manualSuccessMessage, setManualSuccessMessage] = useState('');

  // Update tee when course changes, ensuring White is default!
  useEffect(() => {
    if (selectedCourse) {
      const defaultTee = findWhiteOrEquivalentTee(selectedCourse);
      setSelectedTeeId(defaultTee);
    }
  }, [selectedCourseId]);

  // Sync hole-by-hole default pars when course changes
  useEffect(() => {
    if (selectedCourse && selectedCourse.holes.length === 18) {
      setManualHoleScores((prev) => {
        const updated: Record<number, HoleScore> = { ...prev };
        selectedCourse.holes.forEach((h) => {
          if (!updated[h.number] || updated[h.number].strokes === 0) {
            updated[h.number] = {
              strokes: h.par,
              putts: 2,
              fir: h.par === 3 ? 'none' : 'hit',
              gir: true,
            };
          }
        });
        return updated;
      });
    }
  }, [selectedCourseId]);

  // Initialize live round players with active user
  useEffect(() => {
    if (members.length > 0 && selectedPlayers.length === 0) {
      const p1 = activeUser || members[0];
      const p2 = members.find((m) => m.id !== p1.id) || members[1];
      const slope = selectedTee?.slope || 124;
      const rating = selectedTee?.rating || 70.2;

      const initial: PlayerRoundData[] = [
        {
          playerId: p1.id,
          name: p1.name,
          handicapIndex: p1.handicapIndex,
          courseHandicap: Math.round(p1.handicapIndex * (slope / 113) + (rating - 72)),
          scores: {},
        },
      ];

      if (p2) {
        initial.push({
          playerId: p2.id,
          name: p2.name,
          handicapIndex: p2.handicapIndex,
          courseHandicap: Math.round(p2.handicapIndex * (slope / 113) + (rating - 72)),
          scores: {},
        });
      }

      setSelectedPlayers(initial);
    }
  }, [isOpen, activeUserId]);

  if (!isOpen) return null;

  // Handle Join Live Room via PIN
  const handleJoinFromModal = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!joinRoomCode.trim()) {
      setJoinErrorMsg('Please enter a 4-character room PIN');
      return;
    }
    if (!onJoinRoom) {
      setJoinErrorMsg('PIN joining is not configured');
      return;
    }

    setJoinLoading(true);
    setJoinErrorMsg(null);

    try {
      let pName = '';
      let pHcp = 10;
      let mId: string | undefined = undefined;

      if (joinIsGuest) {
        pName = joinGuestName.trim() || 'Guest Golfer';
        pHcp = parseFloat(joinGuestHcp) || 10;
      } else {
        const mem = members.find((m) => m.id === joinSelectedMemberId) || activeUser || members[0];
        pName = mem.name;
        pHcp = mem.handicapIndex;
        mId = mem.id;
      }

      const success = await onJoinRoom(joinRoomCode.trim().toUpperCase(), pName, pHcp, mId);
      if (success) {
        onClose();
      } else {
        setJoinErrorMsg('Room not found or invalid PIN. Check with the host.');
      }
    } catch (err: any) {
      setJoinErrorMsg(err.message || 'Failed to join live round');
    } finally {
      setJoinLoading(false);
    }
  };

  // Add individual player
  const handleAddPlayer = (member: MemberProfile) => {
    if (selectedPlayers.some((p) => p.playerId === member.id)) return;
    if (selectedPlayers.length >= 8) return;

    const slope = selectedTee?.slope || 124;
    const rating = selectedTee?.rating || 70.2;
    const courseHandicap = Math.round(member.handicapIndex * (slope / 113) + (rating - 72));

    setSelectedPlayers([
      ...selectedPlayers,
      {
        playerId: member.id,
        name: member.name,
        handicapIndex: member.handicapIndex,
        courseHandicap,
        scores: {},
      },
    ]);
  };

  const handleRemovePlayer = (playerId: string) => {
    setSelectedPlayers(selectedPlayers.filter((p) => p.playerId !== playerId));
  };

  // Toggle pre-built team
  const handleToggleTeam = (teamId: string) => {
    if (selectedTeamIds.includes(teamId)) {
      setSelectedTeamIds(selectedTeamIds.filter((id) => id !== teamId));
    } else {
      if (selectedTeamIds.length >= 2) {
        setSelectedTeamIds([selectedTeamIds[0], teamId]);
      } else {
        setSelectedTeamIds([...selectedTeamIds, teamId]);
      }
    }
  };

  // Quick-Par fill all 18 holes
  const handleQuickParAllHoles = () => {
    if (!selectedCourse) return;
    const updated: Record<number, HoleScore> = {};
    selectedCourse.holes.forEach((h) => {
      updated[h.number] = {
        strokes: h.par,
        putts: 2,
        fir: h.par === 3 ? 'none' : 'hit',
        gir: true,
      };
    });
    setManualHoleScores(updated);
  };

  // Update a single hole in manual hole-by-hole mode
  const handleUpdateManualHole = (holeNum: number, strokes: number, putts: number = 2) => {
    const hole = selectedCourse?.holes.find((h) => h.number === holeNum);
    const par = hole?.par || 4;
    setManualHoleScores((prev) => ({
      ...prev,
      [holeNum]: {
        strokes: Math.max(1, strokes),
        putts: Math.max(0, putts),
        fir: par === 3 ? 'none' : strokes <= par ? 'hit' : 'left',
        gir: strokes <= par,
      },
    }));
  };

  // Start Live Round
  const handleStartLiveRound = () => {
    let finalPlayers: PlayerRoundData[] = [];
    let finalTeams: TeamGroup[] | undefined = undefined;

    if (participantMode === 'teams' && selectedTeamIds.length > 0) {
      finalTeams = teams.filter((t) => selectedTeamIds.includes(t.id));
      const slope = selectedTee?.slope || 124;
      const rating = selectedTee?.rating || 70.2;

      finalTeams.forEach((team) => {
        team.playerIds.forEach((pid) => {
          const m = members.find((mem) => mem.id === pid);
          if (m && !finalPlayers.some((p) => p.playerId === m.id)) {
            finalPlayers.push({
              playerId: m.id,
              name: m.name,
              handicapIndex: m.handicapIndex,
              courseHandicap: Math.round(m.handicapIndex * (slope / 113) + (rating - 72)),
              scores: {},
            });
          }
        });
      });
    } else {
      finalPlayers = selectedPlayers;
    }

    if (finalPlayers.length === 0) {
      alert('Please select at least 1 golfer or team to play.');
      return;
    }

    onCreateSession({
      courseId: selectedCourse.id,
      courseName: selectedCourse.name,
      teeId: selectedTee.id,
      teeName: selectedTee.name,
      format,
      players: finalPlayers,
      teams: finalTeams,
      isTeamRound: participantMode === 'teams' || format === 'scramble',
      date: roundDate,
    });
    onClose();
  };

  // Submit Manual Past Round
  const handleSubmitManualRound = async () => {
    setIsSubmittingManual(true);
    setManualSuccessMessage('');

    let gross = manualGrossScore;
    let putts = manualPuttsTotal;
    let fir = manualFirPercent;
    let gir = manualGirPercent;

    if (manualEntryMode === 'hole_by_hole') {
      gross = Object.values(manualHoleScores).reduce((acc, h) => acc + (h.strokes || 4), 0);
      putts = Object.values(manualHoleScores).reduce((acc, h) => acc + (h.putts || 2), 0);
      const hitFir = Object.values(manualHoleScores).filter((h) => h.fir === 'hit').length;
      const eligibleFir = Object.values(manualHoleScores).filter((h) => h.fir !== 'none').length;
      fir = eligibleFir > 0 ? Math.round((hitFir / eligibleFir) * 100) : 50;
      const hitGir = Object.values(manualHoleScores).filter((h) => h.gir).length;
      gir = Math.round((hitGir / 18) * 100);
    }

    const payload = {
      playerId: activeUser.id,
      playerName: activeUser.name,
      date: roundDate,
      courseId: selectedCourse.id,
      courseName: selectedCourse.name,
      teeId: selectedTee.id,
      teeName: selectedTee.name,
      format,
      entryMode: manualEntryMode,
      grossScore: gross,
      putts,
      firPercent: fir,
      girPercent: gir,
      holeScores: manualEntryMode === 'hole_by_hole' ? manualHoleScores : undefined,
    };

    try {
      const res = await fetch('/api/rounds/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Failed to record manual round');
      const data = await res.json();
      if (onManualRoundLogged) {
        onManualRoundLogged(data);
      }
      setManualSuccessMessage(`Round on ${roundDate} successfully recorded and slotted in!`);
      setTimeout(() => {
        setIsSubmittingManual(false);
        onClose();
      }, 1200);
    } catch (err) {
      console.error(err);
      setIsSubmittingManual(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex sm:items-center justify-center p-0 sm:p-4 overflow-hidden">
        <div className="w-full sm:max-w-2xl h-[100dvh] sm:h-auto sm:max-h-[88vh] sm:rounded-3xl bg-white dark:bg-slate-900 border-0 sm:border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden text-slate-900 dark:text-slate-100 transition-colors">
          
          {/* Sticky Header with Mode Switcher */}
          <div className="shrink-0 p-4 sm:p-5 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-10 h-10 rounded-2xl text-white flex items-center justify-center shrink-0 shadow-xs ${
                  modalTab === 'live' ? 'bg-emerald-600' : modalTab === 'join' ? 'bg-amber-600' : 'bg-blue-600'
                }`}>
                  {modalTab === 'live' ? <Play className="w-5 h-5 fill-current" /> : modalTab === 'join' ? <KeyRound className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                </div>
                <div className="min-w-0">
                  <h3 className="font-heading font-extrabold text-lg sm:text-xl text-slate-900 dark:text-slate-100 truncate">
                    {modalTab === 'live' ? 'Start Live Round' : modalTab === 'join' ? 'Join Live Round via PIN' : 'Log Past Round Manually'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    Logged in as <strong>{activeUser.nickname}</strong> ({activeUser.email || 'Member'})
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                aria-label="Close"
                className="w-9 h-9 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 3-Way Segmented Tab Switcher */}
            <div className="grid grid-cols-3 p-1 bg-slate-200 dark:bg-slate-800 rounded-xl gap-1">
              <button
                type="button"
                onClick={() => setModalTab('live')}
                className={`py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  modalTab === 'live'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Play className="w-3.5 h-3.5" />
                <span className="truncate">Start Live</span>
              </button>
              <button
                type="button"
                onClick={() => setModalTab('join')}
                className={`py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  modalTab === 'join'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <KeyRound className="w-3.5 h-3.5 text-amber-500" />
                <span className="truncate">Join with PIN</span>
              </button>
              <button
                type="button"
                onClick={() => setModalTab('manual')}
                className={`py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  modalTab === 'manual'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <FileText className="w-3.5 h-3.5 text-blue-500" />
                <span className="truncate">Log Past</span>
              </button>
            </div>
          </div>

          {/* Success toast */}
          {manualSuccessMessage && (
            <div className="shrink-0 mx-4 sm:mx-6 mt-3 p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center gap-2 text-xs font-semibold text-emerald-800 dark:text-emerald-200 animate-fadeIn">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{manualSuccessMessage}</span>
            </div>
          )}

          {/* Scrollable Body Content */}
          <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-5">
            
            {/* ================= MODE: JOIN WITH PIN ================= */}
            {modalTab === 'join' && (
              <form onSubmit={handleJoinFromModal} className="space-y-5">
                <div className="p-4 rounded-2xl bg-amber-500/10 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800/60 flex items-start gap-3">
                  <KeyRound className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  <div className="text-xs text-slate-600 dark:text-slate-300">
                    <strong className="text-slate-900 dark:text-slate-100 block mb-0.5">Live Multi-Device Foursome Sync</strong>
                    Enter the 4-character room code generated by your host to join the live scoring scorecard on your phone in real time.
                  </div>
                </div>

                {joinErrorMsg && (
                  <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl text-xs font-semibold text-red-700 dark:text-red-300 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{joinErrorMsg}</span>
                  </div>
                )}

                {/* PIN Input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block text-center">
                    Room PIN Code *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={joinRoomCode}
                    onChange={(e) => setJoinRoomCode(e.target.value.toUpperCase())}
                    placeholder="e.g. 7X2K"
                    autoFocus
                    className="w-full max-w-xs mx-auto block px-4 py-3 text-center tracking-widest uppercase font-mono font-extrabold text-2xl sm:text-3xl rounded-2xl border-2 border-amber-400 dark:border-amber-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-4 focus:ring-amber-500/20 shadow-sm"
                  />
                </div>

                {/* Golfer Identity Selection */}
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      I Am Scoring As *
                    </label>
                    <button
                      type="button"
                      onClick={() => setJoinIsGuest(!joinIsGuest)}
                      className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                    >
                      {joinIsGuest ? 'Choose Club Member' : 'Play as Guest Golfer'}
                    </button>
                  </div>

                  {!joinIsGuest ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {members.map((m) => {
                        const isSelected = joinSelectedMemberId === m.id;
                        return (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => setJoinSelectedMemberId(m.id)}
                            className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-400 dark:border-amber-600 shadow-2xs'
                                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <span className="text-2xl">{m.avatarEmoji}</span>
                              <div>
                                <span className="font-heading font-bold text-xs text-slate-900 dark:text-slate-100 block">
                                  {m.name}
                                </span>
                                <span className="text-[11px] text-slate-500">"{m.nickname}"</span>
                              </div>
                            </div>
                            <span className="font-stats font-bold text-xs text-slate-700 dark:text-slate-300">
                              {m.handicapIndex.toFixed(1)}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
                      <div>
                        <label className="text-[11px] font-bold uppercase text-slate-500 block mb-1">Guest Name</label>
                        <input
                          type="text"
                          value={joinGuestName}
                          onChange={(e) => setJoinGuestName(e.target.value)}
                          placeholder="e.g. Colin Morikawa"
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold uppercase text-slate-500 block mb-1">Handicap Index</label>
                        <input
                          type="number"
                          step="0.1"
                          value={joinGuestHcp}
                          onChange={(e) => setJoinGuestHcp(e.target.value)}
                          placeholder="10.0"
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </form>
            )}

            {/* ================= MODES: START LIVE OR LOG PAST ================= */}
            {modalTab !== 'join' && (
              <>
                {/* 1. Course Selection with Live Search */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Select Golf Course *
                    </label>
                    <span className="text-[11px] text-slate-400 font-medium">
                      {courses.length} courses loaded
                    </span>
                  </div>
                  <SearchableCourseSelect
                    courses={courses}
                    selectedCourseId={selectedCourseId}
                    onSelectCourse={(course) => setSelectedCourseId(course.id)}
                    onOpenAddCourse={() => setIsAddCourseModalOpen(true)}
                  />
                </div>

                {/* 2. Tee Selection & Round Date */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Tee Box */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Tee Box *
                      </label>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                        White / Regular Default
                      </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                      {selectedCourse?.tees.map((tee: TeeBox) => {
                        const isSelected = tee.id === selectedTeeId;
                        const isWhiteTee =
                          tee.name.toLowerCase().includes('white') ||
                          tee.color.toLowerCase().includes('white') ||
                          tee.name.toLowerCase().includes('regular');

                        return (
                          <button
                            key={tee.id}
                            type="button"
                            onClick={() => setSelectedTeeId(tee.id)}
                            className={`p-2 rounded-xl border text-left cursor-pointer transition-all ${
                              isSelected
                                ? 'border-emerald-500 ring-2 ring-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 text-slate-900 dark:text-slate-100 shadow-xs'
                                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-heading font-bold text-xs truncate">
                                {tee.name}
                              </span>
                              {isWhiteTee && (
                                <span className="text-[9px] px-1 py-0.2 bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 rounded font-bold">
                                  STD
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-400 block font-stats mt-0.5">
                              {tee.totalYardage}y · {tee.rating}/{tee.slope}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Round Date with Historical Date Picker */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center justify-between">
                      <span>Round Date *</span>
                      <span className="text-[10px] text-slate-400 font-normal">
                        {modalTab === 'manual' ? 'Slots into history' : 'Today by default'}
                      </span>
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        value={roundDate}
                        max={new Date().toISOString().split('T')[0]}
                        onChange={(e) => setRoundDate(e.target.value)}
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                      />
                      <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* 3. Game Format Selection */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                    Game Format *
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {[
                      { id: 'stroke', label: 'Stroke Play', desc: 'Gross & Net' },
                      { id: 'scramble', label: 'Scramble', desc: 'Squad Shot' },
                      { id: 'match_play', label: 'Match Play', desc: 'Hole-by-hole' },
                      { id: 'stableford', label: 'Stableford', desc: 'Points' },
                      { id: 'skins', label: 'Skins', desc: 'Per hole pot' },
                    ].map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => {
                          setFormat(f.id as GameFormat);
                          if (f.id === 'scramble' || f.id === 'match_play') {
                            setParticipantMode('teams');
                          }
                        }}
                        className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                          format === f.id
                            ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 border-slate-900 shadow-xs'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                        }`}
                      >
                        <span className="font-heading font-bold text-xs block leading-tight">
                          {f.label}
                        </span>
                        <span className="text-[10px] opacity-75 block mt-0.5">
                          {f.desc}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 4. LIVE ROUND: Golfers vs Pre-Built Scramble Teams Selection */}
                {modalTab === 'live' && (
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                        <button
                          type="button"
                          onClick={() => setParticipantMode('golfers')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            participantMode === 'golfers'
                              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xs'
                              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                          }`}
                        >
                          Individual Golfers ({selectedPlayers.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setParticipantMode('teams')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            participantMode === 'teams'
                              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xs'
                              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                          }`}
                        >
                          Scramble Squads ({selectedTeamIds.length})
                        </button>
                      </div>

                      {participantMode === 'teams' && onOpenTeamManager && (
                        <button
                          type="button"
                          onClick={onOpenTeamManager}
                          className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Manage Teams</span>
                        </button>
                      )}
                    </div>

                    {participantMode === 'golfers' ? (
                      <div className="space-y-2">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {selectedPlayers.map((player) => (
                            <div
                              key={player.playerId}
                              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-between gap-2 shadow-2xs"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="font-heading font-bold text-xs truncate">
                                  {player.name}
                                </span>
                                <span className="text-[10px] text-slate-400 font-stats">
                                  Index: {player.handicapIndex.toFixed(1)}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemovePlayer(player.playerId)}
                                className="p-1 text-slate-400 hover:text-red-500 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>

                        {/* Available golfers dropdown / click-add */}
                        <div className="pt-1 flex items-center gap-1.5 flex-wrap">
                          <span className="text-[11px] font-bold uppercase text-slate-400 mr-1">Add:</span>
                          {members
                            .filter((m) => !selectedPlayers.some((p) => p.playerId === m.id))
                            .map((m) => (
                              <button
                                key={m.id}
                                type="button"
                                onClick={() => handleAddPlayer(m)}
                                className="px-2.5 py-1 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400 text-xs font-semibold text-slate-600 dark:text-slate-400 cursor-pointer transition-colors"
                              >
                                + {m.nickname || m.name}
                              </button>
                            ))}
                        </div>
                      </div>
                    ) : (
                      /* Pre-Built Scramble Squads Checklist */
                      <div className="space-y-2">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {teams.map((t) => {
                            const isSelected = selectedTeamIds.includes(t.id);
                            const teamHcp = calculateTeamScrambleHandicap(t.playerIds, members);
                            return (
                              <button
                                key={t.id}
                                type="button"
                                onClick={() => handleToggleTeam(t.id)}
                                className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                                  isSelected
                                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 ring-2 ring-emerald-500 shadow-2xs'
                                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                                }`}
                              >
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xl">{t.avatarEmoji || '🎯'}</span>
                                    <span className="font-heading font-bold text-xs text-slate-900 dark:text-slate-100">
                                      {t.name}
                                    </span>
                                  </div>
                                  <span className="text-[10px] text-slate-500 block mt-0.5">
                                    {t.playerIds.length} Golfers · Hcp: {teamHcp.toFixed(1)}
                                  </span>
                                </div>
                                <div className={`w-5 h-5 rounded-lg border flex items-center justify-center ${
                                  isSelected ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300'
                                }`}>
                                  {isSelected && <Check className="w-3.5 h-3.5" />}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 5. MANUAL PAST ROUND: Hole-by-Hole or Quick Total */}
                {modalTab === 'manual' && (
                  <div className="space-y-4 pt-2">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setManualEntryMode('hole_by_hole')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            manualEntryMode === 'hole_by_hole'
                              ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-2xs'
                              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                          }`}
                        >
                          Hole-by-Hole Scorecard
                        </button>
                        <button
                          type="button"
                          onClick={() => setManualEntryMode('quick_total')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            manualEntryMode === 'quick_total'
                              ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-2xs'
                              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                          }`}
                        >
                          Quick Total 18-Hole
                        </button>
                      </div>

                      {manualEntryMode === 'hole_by_hole' && (
                        <button
                          type="button"
                          onClick={handleQuickParAllHoles}
                          className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[11px] font-bold cursor-pointer hover:bg-emerald-100"
                        >
                          ⚡ Quick Par All Holes
                        </button>
                      )}
                    </div>

                    {manualEntryMode === 'quick_total' ? (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                        <div>
                          <label className="text-[11px] font-bold uppercase text-slate-500 block mb-1">Total Gross</label>
                          <input
                            type="number"
                            min={40}
                            max={150}
                            value={manualGrossScore}
                            onChange={(e) => setManualGrossScore(parseInt(e.target.value) || 82)}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-stats font-bold text-lg text-slate-900 dark:text-slate-100 text-center"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-bold uppercase text-slate-500 block mb-1">Total Putts</label>
                          <input
                            type="number"
                            min={18}
                            max={60}
                            value={manualPuttsTotal}
                            onChange={(e) => setManualPuttsTotal(parseInt(e.target.value) || 32)}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-stats font-bold text-lg text-slate-900 dark:text-slate-100 text-center"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-bold uppercase text-slate-500 block mb-1">FIR %</label>
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={manualFirPercent}
                            onChange={(e) => setManualFirPercent(parseInt(e.target.value) || 50)}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-stats font-bold text-lg text-slate-900 dark:text-slate-100 text-center"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-bold uppercase text-slate-500 block mb-1">GIR %</label>
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={manualGirPercent}
                            onChange={(e) => setManualGirPercent(parseInt(e.target.value) || 50)}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-stats font-bold text-lg text-slate-900 dark:text-slate-100 text-center"
                          />
                        </div>
                      </div>
                    ) : (
                      /* Hole-by-Hole 18 Grid */
                      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                        {Array.from({ length: 18 }, (_, idx) => idx + 1).map((hNum) => {
                          const hole = selectedCourse?.holes.find((h) => h.number === hNum);
                          const par = hole?.par || 4;
                          const score = manualHoleScores[hNum]?.strokes || par;
                          const diff = score - par;

                          return (
                            <div
                              key={hNum}
                              className={`p-2 rounded-xl border text-center transition-all ${
                                diff < 0
                                  ? 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800'
                                  : diff === 0
                                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800'
                                  : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700'
                              }`}
                            >
                              <div className="flex items-center justify-between text-[11px] text-slate-400 font-bold mb-1">
                                <span>#{hNum}</span>
                                <span>P{par}</span>
                              </div>
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleUpdateManualHole(hNum, score - 1)}
                                  className="w-6 h-6 rounded bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs shadow-2xs cursor-pointer"
                                >
                                  -
                                </button>
                                <span className="font-stats font-extrabold text-sm w-5 text-slate-900 dark:text-slate-100">
                                  {score}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateManualHole(hNum, score + 1)}
                                  className="w-6 h-6 rounded bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs shadow-2xs cursor-pointer"
                                >
                                  +
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Sticky Action Footer */}
          <div className="shrink-0 p-3.5 sm:p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="btn-modern px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              Cancel
            </button>

            {modalTab === 'join' ? (
              <button
                type="button"
                disabled={joinLoading}
                onClick={handleJoinFromModal}
                className="btn-modern px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer flex items-center gap-2 disabled:opacity-50"
              >
                {joinLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
                <span>{joinLoading ? 'Connecting...' : 'Connect to Live Round (PIN)'}</span>
              </button>
            ) : modalTab === 'live' ? (
              <button
                type="button"
                onClick={handleStartLiveRound}
                className="btn-modern px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer flex items-center gap-2"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>
                  Start Live Session ({participantMode === 'teams' ? `${selectedTeamIds.length} Squads` : `${selectedPlayers.length} Golfers`})
                </span>
              </button>
            ) : (
              <button
                type="button"
                disabled={isSubmittingManual}
                onClick={handleSubmitManualRound}
                className="btn-modern px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer flex items-center gap-2 disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                <span>
                  {isSubmittingManual ? 'Saving...' : `Save Past Round (${manualGrossScore} Gross)`}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Add Custom Course Sub-Modal */}
      {isAddCourseModalOpen && (
        <AddCourseModal
          isOpen={isAddCourseModalOpen}
          onClose={() => setIsAddCourseModalOpen(false)}
          onCourseAdded={(newCourse) => {
            if (onCourseAdded) onCourseAdded(newCourse);
            setSelectedCourseId(newCourse.id);
            setSelectedTeeId(findWhiteOrEquivalentTee(newCourse));
            setIsAddCourseModalOpen(false);
          }}
        />
      )}
    </>
  );
};
