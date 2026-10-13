import React, { useState, useEffect } from 'react';
import { 
  X, Play, Trash2, Check, Calendar, KeyRound, FileText, Edit3, RefreshCw, AlertCircle
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
  initialSelectedTeamId?: string;
  onCourseAdded?: (newCourse: Course) => void;
  onCreateSession: (sessionData: Partial<RoundSession>) => void;
  onOpenTeamManager?: () => void;
  onManualRoundLogged?: (data: Record<string, string | number | boolean | object | undefined>) => void;
  onJoinRoom?: (roomCode: string, playerName: string, handicapIndex: number, memberId?: string) => Promise<boolean>;
}

export const NewRoundModal: React.FC<NewRoundModalProps> = ({
  isOpen,
  onClose,
  courses,
  members,
  teams = [],
  activeUserId,
  initialSelectedTeamId,
  onCourseAdded,
  onCreateSession,
  onOpenTeamManager,
  onManualRoundLogged,
  onJoinRoom,
}) => {
  const [modalTab, setModalTab] = useState<'live' | 'join' | 'manual'>('live');

  const [selectedCourseId, setSelectedCourseId] = useState<string>(courses[0]?.id || '');
  const selectedCourse = courses.find((c) => c.id === selectedCourseId) || courses[0];

  const [selectedTeeId, setSelectedTeeId] = useState<string>(() => findWhiteOrEquivalentTee(selectedCourse));
  const selectedTee = selectedCourse?.tees.find((t: TeeBox) => t.id === selectedTeeId) || selectedCourse?.tees[0];

  const [format, setFormat] = useState<GameFormat>('stroke');
  const [participantMode, setParticipantMode] = useState<'golfers' | 'teams'>('golfers');
  const [selectedPlayers, setSelectedPlayers] = useState<PlayerRoundData[]>([]);
  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([]);
  const [isAddCourseModalOpen, setIsAddCourseModalOpen] = useState(false);

  const activeUser = members.find((m) => m.id === activeUserId) || members[0] || {
    id: 'guest', name: 'Guest', nickname: 'Guest', handicapIndex: 0,
  };

  const [joinRoomCode, setJoinRoomCode] = useState('');
  const [joinSelectedMemberId, setJoinSelectedMemberId] = useState<string>(activeUserId || members[0]?.id || '');
  const [joinIsGuest, setJoinIsGuest] = useState(false);
  const [joinGuestName, setJoinGuestName] = useState('');
  const [joinGuestHcp, setJoinGuestHcp] = useState('10.0');
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinErrorMsg, setJoinErrorMsg] = useState<string | null>(null);

  const [roundDate, setRoundDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [manualEntryMode, setManualEntryMode] = useState<'hole_by_hole' | 'quick_total'>('hole_by_hole');
  const [manualGrossScore, setManualGrossScore] = useState<number>(82);
  const [manualPuttsTotal, setManualPuttsTotal] = useState<number>(32);
  const [manualFirPercent, setManualFirPercent] = useState<number>(55);
  const [manualGirPercent, setManualGirPercent] = useState<number>(50);

  const [manualHoleScores, setManualHoleScores] = useState<Record<number, HoleScore>>({});
  const [isSubmittingManual, setIsSubmittingManual] = useState(false);
  const [manualSuccessMessage, setManualSuccessMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      setSelectedPlayers([]);
      setManualSuccessMessage('');
      if (initialSelectedTeamId) {
        setSelectedTeamIds([initialSelectedTeamId]);
        setParticipantMode('teams');
        setFormat('scramble');
      }
    }
  }, [isOpen, initialSelectedTeamId]);

  useEffect(() => {
    if (selectedCourse) setSelectedTeeId(findWhiteOrEquivalentTee(selectedCourse));
  }, [selectedCourseId]);

  useEffect(() => {
    if (selectedCourse && selectedCourse.holes.length === 18) {
      setManualHoleScores((prev) => {
        const updated: Record<number, HoleScore> = { ...prev };
        selectedCourse.holes.forEach((h) => {
          if (!updated[h.number] || updated[h.number].strokes === 0) {
            updated[h.number] = { strokes: h.par, putts: 2, fir: h.par === 3 ? 'none' : 'hit', gir: true };
          }
        });
        return updated;
      });
    }
  }, [selectedCourseId]);

  if (!isOpen) return null;

  const handleJoinFromModal = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!joinRoomCode.trim()) return setJoinErrorMsg('Please enter a 4-character room PIN');
    if (!onJoinRoom) return setJoinErrorMsg('PIN joining is not configured');

    setJoinLoading(true);
    setJoinErrorMsg(null);

    try {
      let pName = joinIsGuest ? joinGuestName.trim() || 'Guest' : (members.find(m => m.id === joinSelectedMemberId)?.name || 'Golfer');
      let pHcp = joinIsGuest ? parseFloat(joinGuestHcp) || 10 : (members.find(m => m.id === joinSelectedMemberId)?.handicapIndex || 10);
      let mId = joinIsGuest ? undefined : joinSelectedMemberId;

      const success = await onJoinRoom(joinRoomCode.trim().toUpperCase(), pName, pHcp, mId);
      if (success) onClose();
      else setJoinErrorMsg('Room not found or invalid PIN. Check with the host.');
    } catch (err: any) {
      setJoinErrorMsg(err.message || 'Failed to join live round');
    } finally {
      setJoinLoading(false);
    }
  };

  const handleAddPlayer = (member: MemberProfile) => {
    if (selectedPlayers.some((p) => p.playerId === member.id) || selectedPlayers.length >= 8) return;
    const courseHandicap = Math.round(member.handicapIndex * ((selectedTee?.slope || 124) / 113) + ((selectedTee?.rating || 70.2) - 72));
    setSelectedPlayers([...selectedPlayers, { playerId: member.id, name: member.name, handicapIndex: member.handicapIndex, courseHandicap, scores: {} }]);
  };

  const handleRemovePlayer = (playerId: string) => setSelectedPlayers(selectedPlayers.filter((p) => p.playerId !== playerId));

  const handleToggleTeam = (teamId: string) => {
    if (selectedTeamIds.includes(teamId)) setSelectedTeamIds(selectedTeamIds.filter((id) => id !== teamId));
    else setSelectedTeamIds(selectedTeamIds.length >= 2 ? [selectedTeamIds[0], teamId] : [...selectedTeamIds, teamId]);
  };

  const handleQuickParAllHoles = () => {
    if (!selectedCourse) return;
    const updated: Record<number, HoleScore> = {};
    selectedCourse.holes.forEach((h) => updated[h.number] = { strokes: h.par, putts: 2, fir: h.par === 3 ? 'none' : 'hit', gir: true });
    setManualHoleScores(updated);
  };

  const handleUpdateManualHole = (holeNum: number, strokes: number, putts: number = 2) => {
    const par = selectedCourse?.holes.find((h) => h.number === holeNum)?.par || 4;
    setManualHoleScores((prev) => ({
      ...prev,
      [holeNum]: { strokes: Math.max(1, strokes), putts: Math.max(0, putts), fir: par === 3 ? 'none' : strokes <= par ? 'hit' : 'left', gir: strokes <= par },
    }));
  };

  const handleStartLiveRound = () => {
    let finalPlayers: PlayerRoundData[] = participantMode === 'teams' ? [] : [...selectedPlayers];
    let finalTeams = participantMode === 'teams' ? teams.filter((t) => selectedTeamIds.includes(t.id)) : undefined;

    if (participantMode === 'teams' && finalTeams) {
      finalTeams.forEach((team) => team.playerIds.forEach((pid) => {
        const m = members.find((mem) => mem.id === pid);
        if (m && !finalPlayers.some((p) => p.playerId === m.id)) {
          finalPlayers.push({ 
            playerId: m.id, 
            name: m.name, 
            handicapIndex: m.handicapIndex, 
            courseHandicap: Math.round(m.handicapIndex * ((selectedTee?.slope || 124) / 113) + ((selectedTee?.rating || 70.2) - 72)), 
            scores: {} 
          });
        }
      }));
    }

    if (finalPlayers.length === 0) return alert('Please select at least 1 golfer or team to play.');

    onCreateSession({
      courseId: selectedCourse.id, courseName: selectedCourse.name, teeId: selectedTee.id, teeName: selectedTee.name,
      format, players: finalPlayers, teams: finalTeams, isTeamRound: participantMode === 'teams' || format === 'scramble', date: roundDate,
    });
    onClose();
  };

 const handleSubmitManualRound = async () => {
    setIsSubmittingManual(true);
    let gross = manualGrossScore, putts = manualPuttsTotal, fir = manualFirPercent, gir = manualGirPercent;

    // 1. Get exact totals if using Hole-by-Hole
    if (manualEntryMode === 'hole_by_hole') {
      gross = Object.values(manualHoleScores).reduce((acc, h) => acc + (h.strokes || 4), 0);
      putts = Object.values(manualHoleScores).reduce((acc, h) => acc + (h.putts || 2), 0);
      const eligibleFir = Object.values(manualHoleScores).filter((h) => h.fir !== 'none').length;
      fir = eligibleFir > 0 ? Math.round((Object.values(manualHoleScores).filter((h) => h.fir === 'hit').length / eligibleFir) * 100) : 50;
      gir = Math.round((Object.values(manualHoleScores).filter((h) => h.gir).length / 18) * 100);
    }

    // 2. Calculate Handicap Differential & Net Score
    const rating = selectedTee?.rating || 72;
    const slope = selectedTee?.slope || 113;
    const courseHandicap = Math.round(activeUser.handicapIndex * (slope / 113) + (rating - 72));
    const netScore = gross - courseHandicap;
    const differential = Number((((gross - rating) * 113) / slope).toFixed(1));

    // 3. Build the full payload
    const payload: Record<string, any> = {
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
      netScore, 
      differential, 
      totalPutts: putts, 
      firPercent: fir, 
      girPercent: gir,
      holeScores: manualEntryMode === 'hole_by_hole' ? manualHoleScores : undefined,
    };

    if (format === 'scramble' && participantMode === 'teams' && selectedTeamIds.length > 0) {
      const selectedSquad = teams.find(t => t.id === selectedTeamIds[0]);
      payload.teamId = selectedSquad?.id;
      payload.teamName = selectedSquad?.name;
      payload.isTeamEvent = true;
    }

    try {
      if (onManualRoundLogged) onManualRoundLogged(payload);
      setManualSuccessMessage(`Round successfully recorded!`);
      setTimeout(() => { setIsSubmittingManual(false); onClose(); }, 1200);
    } catch (err) {
      setIsSubmittingManual(false);
    }
  };

  // 4. Calculate display score for the button
  const displayGross = manualEntryMode === 'hole_by_hole' 
    ? Object.values(manualHoleScores).reduce((acc, h) => acc + (h.strokes || 4), 0)
    : manualGrossScore;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex sm:items-center justify-center p-0 sm:p-4 overflow-hidden">
        <div className="w-full sm:max-w-2xl h-[100dvh] sm:h-auto sm:max-h-[88vh] sm:rounded-3xl bg-white dark:bg-slate-900 border-0 sm:border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden text-slate-900 dark:text-slate-100 transition-colors">
          
          <div className="shrink-0 p-4 sm:p-5 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-10 h-10 rounded-2xl text-white flex items-center justify-center shrink-0 shadow-xs ${modalTab === 'live' ? 'bg-emerald-600' : modalTab === 'join' ? 'bg-amber-600' : 'bg-blue-600'}`}>
                  {modalTab === 'live' ? <Play className="w-5 h-5 fill-current" /> : modalTab === 'join' ? <KeyRound className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                </div>
                <div className="min-w-0">
                  <h3 className="font-heading font-extrabold text-lg sm:text-xl truncate">
                    {modalTab === 'live' ? 'Start Live Round' : modalTab === 'join' ? 'Join Live Round via PIN' : 'Log Past Round Manually'}
                  </h3>
                  <p className="text-xs text-slate-500 truncate">Logged in as <strong>{activeUser.nickname}</strong></p>
                </div>
              </div>
              <button onClick={onClose} className="w-9 h-9 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-3 p-1 bg-slate-200 dark:bg-slate-800 rounded-xl gap-1">
              <button onClick={() => setModalTab('live')} className={`py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${modalTab === 'live' ? 'bg-white dark:bg-slate-900 shadow-xs text-slate-900 dark:text-slate-100' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'}`}>
                <Play className="w-3.5 h-3.5" /> <span className="truncate capitalize">Start Live</span>
              </button>
              <button onClick={() => setModalTab('join')} className={`py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${modalTab === 'join' ? 'bg-white dark:bg-slate-900 shadow-xs text-slate-900 dark:text-slate-100' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'}`}>
                <KeyRound className="w-3.5 h-3.5 text-amber-500" /> <span className="truncate capitalize">Join with PIN</span>
              </button>
              <button onClick={() => setModalTab('manual')} className={`py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${modalTab === 'manual' ? 'bg-white dark:bg-slate-900 shadow-xs text-slate-900 dark:text-slate-100' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'}`}>
                <FileText className="w-3.5 h-3.5 text-blue-500" /> <span className="truncate capitalize">Log Past</span>
              </button>
            </div>
          </div>

          {manualSuccessMessage && (
            <div className="shrink-0 mx-4 sm:mx-6 mt-3 p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center gap-2 text-xs font-semibold text-emerald-800 dark:text-emerald-200 animate-fadeIn">
              <Check className="w-4 h-4 text-emerald-600" /> <span>{manualSuccessMessage}</span>
            </div>
          )}

          <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-5">
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
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase text-slate-500 block text-center">Room PIN Code *</label>
                  <input type="text" maxLength={6} value={joinRoomCode} onChange={(e) => setJoinRoomCode(e.target.value.toUpperCase())} autoFocus className="w-full max-w-xs mx-auto block px-4 py-3 text-center uppercase font-mono font-extrabold text-3xl rounded-2xl border-2 border-amber-400 dark:border-amber-600 bg-white dark:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-amber-500/20 shadow-sm" />
                </div>
              </form>
            )}

            {modalTab !== 'join' && (
              <>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase text-slate-500">Select Golf Course *</label>
                    <span className="text-[11px] text-slate-400 font-medium">{courses.length} courses loaded</span>
                  </div>
                  <SearchableCourseSelect courses={courses} selectedCourseId={selectedCourseId} onSelectCourse={(c) => setSelectedCourseId(c.id)} onOpenAddCourse={() => setIsAddCourseModalOpen(true)} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold uppercase text-slate-500">Tee Box *</label>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">White / Regular Default</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                      {selectedCourse?.tees.map((tee: TeeBox) => {
                        const isSelected = tee.id === selectedTeeId;
                        const isWhiteTee = tee.name.toLowerCase().includes('white') || tee.color.toLowerCase().includes('white') || tee.name.toLowerCase().includes('regular');
                        return (
                          <button key={tee.id} onClick={() => setSelectedTeeId(tee.id)} className={`p-2 rounded-xl border text-left cursor-pointer transition-all ${isSelected ? 'border-emerald-500 ring-2 ring-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-slate-900 dark:text-slate-100 shadow-xs' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'}`}>
                            <div className="flex items-center justify-between">
                              <span className="font-heading font-bold text-xs truncate">{tee.name}</span>
                              {isWhiteTee && <span className="text-[9px] px-1 py-0.2 bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 rounded font-bold">STD</span>}
                            </div>
                            <span className="text-[10px] text-slate-400 block font-stats mt-0.5">{tee.totalYardage}y &middot; {tee.rating}/{tee.slope}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase text-slate-500 flex justify-between">
                      <span>Round Date *</span>
                      <span className="text-[10px] font-normal">{modalTab === 'manual' ? 'Slots into history' : 'Today by default'}</span>
                    </label>
                    <div className="relative">
                      <input type="date" value={roundDate} max={new Date().toISOString().split('T')[0]} onChange={(e) => setRoundDate(e.target.value)} className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer" />
                      <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase text-slate-500">Game Format *</label>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {[
                      { id: 'stroke', label: 'Stroke Play', desc: 'Gross & Net' },
                      { id: 'scramble', label: 'Scramble', desc: 'Squad Shot' },
                      { id: 'match_play', label: 'Match Play', desc: 'Hole-by-hole' },
                      { id: 'stableford', label: 'Stableford', desc: 'Points' },
                      { id: 'skins', label: 'Skins', desc: 'Per hole pot' }
                    ].map((f) => (
                      <button key={f.id} onClick={() => { setFormat(f.id as any); setParticipantMode(f.id === 'scramble' ? 'teams' : 'golfers'); }} className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${format === f.id ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 border-slate-900 shadow-xs' : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300'}`}>
                        <span className="font-heading font-bold text-xs block leading-tight">{f.label}</span>
                        <span className="text-[10px] opacity-75 block mt-0.5">{f.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                      {format !== 'scramble' ? (
                        <span className="px-3 py-1.5 text-xs font-bold text-slate-900 dark:text-white">Individual Golfers Only</span>
                      ) : (
                        <>
                          <button onClick={() => setParticipantMode('golfers')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${participantMode === 'golfers' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xs' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}>Golfers</button>
                          <button onClick={() => setParticipantMode('teams')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${participantMode === 'teams' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xs' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}>Scramble Squads</button>
                        </>
                      )}
                    </div>
                    {participantMode === 'teams' && onOpenTeamManager && (
                      <button type="button" onClick={onOpenTeamManager} className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer shrink-0">
                        <Edit3 className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Manage Teams</span><span className="sm:hidden">Teams</span>
                      </button>
                    )}
                  </div>

                  {participantMode === 'golfers' || format !== 'scramble' ? (
                    <div className="space-y-2">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {selectedPlayers.map((player) => {
                          const memberObj = members.find((m) => m.id === player.playerId);
                          return (
                            <div key={player.playerId} className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-between gap-2 shadow-2xs">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="text-base">{memberObj?.avatarEmoji || '🏌️‍♂️'}</span>
                                <span className="font-heading font-bold text-xs truncate">{player.name}</span>
                                <span className="text-[10px] text-slate-400 font-stats shrink-0">Idx: {player.handicapIndex.toFixed(1)}</span>
                              </div>
                              <button onClick={() => handleRemovePlayer(player.playerId)} className="p-1 text-slate-400 hover:text-red-500 cursor-pointer shrink-0"><Trash2 className="w-3.5 h-3.5" /></button>
                            </div>
                          );
                        })}
                      </div>
                      <div className="pt-1 flex flex-wrap gap-1.5 items-center">
                        <span className="text-[11px] font-bold uppercase text-slate-400 mr-1">Add:</span>
                        {members.filter((m) => !selectedPlayers.some((p) => p.playerId === m.id)).map((m) => (
                          <button key={m.id} onClick={() => handleAddPlayer(m)} className="px-2.5 py-1 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 text-xs font-semibold text-slate-600 dark:text-slate-400 cursor-pointer transition-colors">+ {m.nickname || m.name}</button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {teams.map((t) => {
                        const isSelected = selectedTeamIds.includes(t.id);
                        const teamHcp = calculateTeamScrambleHandicap(t.playerIds, members);
                        return (
                          <button key={t.id} onClick={() => handleToggleTeam(t.id)} className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${isSelected ? 'border-emerald-500 ring-2 ring-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 shadow-2xs' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300'}`}>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xl">{t.avatarEmoji || '🎯'}</span>
                                <span className="font-heading font-bold text-xs text-slate-900 dark:text-slate-100">{t.name}</span>
                              </div>
                              <span className="text-[10px] text-slate-500 block mt-0.5">{t.playerIds.length} Golfers &middot; Hcp: {teamHcp.toFixed(1)}</span>
                            </div>
                            <div className={`w-5 h-5 rounded-lg border flex items-center justify-center ${isSelected ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300'}`}>
                              {isSelected && <Check className="w-3.5 h-3.5" />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {modalTab === 'manual' && (
                  <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-2">
                        <button onClick={() => setManualEntryMode('hole_by_hole')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${manualEntryMode === 'hole_by_hole' ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}>Hole-by-Hole Scorecard</button>
                        <button onClick={() => setManualEntryMode('quick_total')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${manualEntryMode === 'quick_total' ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}>Quick Total 18-Hole</button>
                      </div>
                      {manualEntryMode === 'hole_by_hole' && (
                        <button type="button" onClick={handleQuickParAllHoles} className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[11px] font-bold cursor-pointer hover:bg-emerald-100">
                          ⚡ Quick Par All Holes
                        </button>
                      )}
                    </div>

                    {manualEntryMode === 'quick_total' ? (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                        {['Gross Score', 'Total Putts', 'FIR %', 'GIR %'].map((lbl, i) => (
                          <div key={lbl}>
                            <label className="text-[11px] font-bold uppercase text-slate-500 block mb-1">{lbl}</label>
                            <input type="number" value={[manualGrossScore, manualPuttsTotal, manualFirPercent, manualGirPercent][i]} onChange={(e) => [setManualGrossScore, setManualPuttsTotal, setManualFirPercent, setManualGirPercent][i](parseInt(e.target.value) || 0)} className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-stats font-bold text-lg text-slate-900 dark:text-slate-100 text-center" />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                        {Array.from({ length: 18 }, (_, idx) => idx + 1).map((hNum) => {
                          const par = selectedCourse?.holes.find((h) => h.number === hNum)?.par || 4;
                          const score = manualHoleScores[hNum]?.strokes || par;
                          const diff = score - par;
                          return (
                            <div key={hNum} className={`p-2 rounded-xl border text-center transition-all ${diff < 0 ? 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800' : diff === 0 ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800' : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700'}`}>
                              <div className="flex items-center justify-between text-[11px] text-slate-400 font-bold mb-1">
                                <span>#{hNum}</span>
                                <span>P{par}</span>
                              </div>
                              <div className="flex justify-center gap-1">
                                <button onClick={() => handleUpdateManualHole(hNum, score - 1)} className="w-6 h-6 rounded bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs shadow-2xs cursor-pointer">-</button>
                                <span className="font-stats font-extrabold text-sm w-5 text-slate-900 dark:text-slate-100">{score}</span>
                                <button onClick={() => handleUpdateManualHole(hNum, score + 1)} className="w-6 h-6 rounded bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs shadow-2xs cursor-pointer">+</button>
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

          <div className="shrink-0 p-3.5 sm:p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex justify-between gap-3">
            <button onClick={onClose} className="btn-modern px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">Cancel</button>
            {modalTab === 'join' ? (
              <button disabled={joinLoading} onClick={handleJoinFromModal} className="btn-modern px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50">
                {joinLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
                <span>{joinLoading ? 'Connecting...' : 'Connect to Live Round (PIN)'}</span>
              </button>
            ) : modalTab === 'live' ? (
              <button onClick={handleStartLiveRound} className="btn-modern px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-xs">
                <Play className="w-4 h-4 fill-current" />
                <span>Start Live Session ({participantMode === 'teams' ? `${selectedTeamIds.length} Squads` : `${selectedPlayers.length} Golfers`})</span>
              </button>
            ) : (
              <button disabled={isSubmittingManual} onClick={handleSubmitManualRound} className="btn-modern px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50">
                <Check className="w-4 h-4" />
                <span>{isSubmittingManual ? 'Saving...' : `Save Past Round (${displayGross} Gross)`}</span>
              </button>
            )}
          </div>
        </div>
      </div>
      {isAddCourseModalOpen && <AddCourseModal isOpen={isAddCourseModalOpen} onClose={() => setIsAddCourseModalOpen(false)} onCourseAdded={(c) => { if (onCourseAdded) onCourseAdded(c); setSelectedCourseId(c.id); setIsAddCourseModalOpen(false); }} />}
    </>
  );
};
