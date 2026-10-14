import React, { useState, useMemo } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Trophy, 
  Check, 
  Copy, 
  Users, 
  Flag, 
  Grid, 
  ArrowLeft,
  Flame,
  CheckCircle2,
  Clock,
  Sparkles,
  Shield,
  Award
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Course, GameFormat, HoleScore, PlayerRoundData, RoundSession, TeamGroup } from '../types';
import { 
  calculateStablefordPoints, 
  getHoleHandicapStrokes
} from '../utils/handicap';

interface LiveRoundScorerProps {
  session: RoundSession;
  course: Course;
  onUpdateScore: (playerId: string, holeNumber: number, score: HoleScore) => void;
  onOpenScorecardMatrix: () => void;
  onOpenLeaderboard: () => void;
  onFinishRound: () => void;
  onExitRound: () => void;
}

export const LiveRoundScorer: React.FC<LiveRoundScorerProps> = ({
  session,
  course,
  onUpdateScore,
  onOpenScorecardMatrix,
  onOpenLeaderboard,
  onFinishRound,
  onExitRound,
}) => {
  const [currentHoleNum, setCurrentHoleNum] = useState<number>(1);
  const [copiedPin, setCopiedPin] = useState(false);

  const hasTeams = Boolean(session.teams && session.teams.length > 0);

  const [activeTeamId, setActiveTeamId] = useState<string>(() => {
    if (session.teams && session.teams.length > 0) return session.teams[0].id;
    return '';
  });

  const activeTeam = session.teams?.find((t) => t.id === activeTeamId) || session.teams?.[0];

  const [activePlayerId, setActivePlayerId] = useState<string>(() => {
    if (hasTeams && activeTeam) {
      const p = session.players.find((pl) => activeTeam.playerIds.includes(pl.playerId));
      return p ? p.playerId : session.players[0]?.playerId || '';
    }
    return session.players[0]?.playerId || '';
  });

  const handleSelectTeam = (team: TeamGroup) => {
    setActiveTeamId(team.id);
    const p = session.players.find((pl) => team.playerIds.includes(pl.playerId)) || session.players[0];
    if (p) {
      setActivePlayerId(p.playerId);
    }
  };

  const currentHole = course.holes.find((h) => h.number === currentHoleNum) || course.holes[0];
  const activePlayer = session.players.find((p) => p.playerId === activePlayerId) || session.players[0];
  
  const currentScore: HoleScore & { drinks?: number } = activePlayer?.scores[currentHoleNum] || {
    strokes: 0,
    putts: 0,
    fir: 'none',
    gir: false,
    drinks: 0
  };

  const currentTeamPlayers = useMemo(() => {
    if (!hasTeams || !activeTeam) return session.players;
    return session.players.filter((p) => activeTeam.playerIds.includes(p.playerId));
  }, [hasTeams, activeTeam, session.players]);

  const updateHoleScore = (partial: Partial<HoleScore & { drinks?: number }>) => {
    if (!activePlayer) return;
    const newStrokes = partial.strokes !== undefined ? partial.strokes : currentScore.strokes;
    const newPutts = partial.putts !== undefined ? partial.putts : currentScore.putts;
    
    let autoGir = currentScore.gir;
    if (partial.strokes !== undefined || partial.putts !== undefined) {
      if (newStrokes > 0) {
        autoGir = (newStrokes - newPutts) <= (currentHole.par - 2);
      }
    }
    if (partial.gir !== undefined) {
      autoGir = partial.gir;
    }

    const updated: HoleScore & { drinks?: number } = {
      ...currentScore,
      ...partial,
      strokes: Math.max(0, newStrokes),
      putts: Math.max(0, newPutts),
      gir: autoGir,
    };

    onUpdateScore(activePlayer.playerId, currentHoleNum, updated);

    if (session.format === 'scramble' || (hasTeams && activeTeam)) {
      currentTeamPlayers.forEach((tp) => {
        if (tp.playerId !== activePlayer.playerId) {
          onUpdateScore(tp.playerId, currentHoleNum, updated);
        }
      });
    }

    if (partial.strokes !== undefined && partial.strokes > 0) {
      const diff = partial.strokes - currentHole.par;
      if (diff === -1) {
        confetti({ particleCount: 35, spread: 65, origin: { y: 0.7 } });
      } else if (diff <= -2) {
        confetti({ particleCount: 80, spread: 100, origin: { y: 0.6 } });
      }
    }
  };

  const handleCopyPin = () => {
    navigator.clipboard.writeText(session.roomCode);
    setCopiedPin(true);
    setTimeout(() => setCopiedPin(false), 2000);
  };

  const getReactionTag = (strokes: number, par: number) => {
    if (strokes === 0) return null;
    if (strokes === 1) return { text: '⚡ Hole in One! 🎉', color: 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800' };
    const diff = strokes - par;
    if (diff <= -2) return { text: '🦅 Eagle!', color: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800' };
    if (diff === -1) return { text: '🎯 Birdie! Dart on target!', color: 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800' };
    if (diff === 0) return { text: '⛳ Par', color: 'text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700' };
    if (diff === 1) return { text: '⚠️ Bogey', color: 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800' };
    return { text: 'Double Bogey+', color: 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700' };
  };

  const reaction = getReactionTag(currentScore.strokes, currentHole.par);

  const hcpStrokesOnHole = getHoleHandicapStrokes(activePlayer?.courseHandicap || 0, currentHole.handicapIndex);
  const netScore = currentScore.strokes > 0 ? Math.max(1, currentScore.strokes - hcpStrokesOnHole) : 0;
  const stablefordPts = currentScore.strokes > 0 ? calculateStablefordPoints(netScore, currentHole.par) : 0;

  const matchPlayStatus = useMemo(() => {
    if (session.format !== 'match_play') return null;
    const teams = session.teams;
    if (!teams || teams.length !== 2) return null;

    const teamA = teams[0];
    const teamB = teams[1];
    const playerA = session.players.find((p) => teamA.playerIds.includes(p.playerId)) || session.players[0];
    const playerB = session.players.find((p) => teamB.playerIds.includes(p.playerId)) || session.players[1];

    if (!playerA || !playerB) return null;

    let winsA = 0;
    let winsB = 0;
    let completedHoles = 0;

    for (let h = 1; h <= 18; h++) {
      const sA = playerA.scores[h]?.strokes || 0;
      const sB = playerB.scores[h]?.strokes || 0;
      if (sA > 0 && sB > 0) {
        completedHoles++;
        if (sA < sB) winsA++;
        else if (sB < sA) winsB++;
      }
    }

    const diff = winsA - winsB;
    const remainingHoles = 18 - completedHoles;

    let leadText = 'All Square';
    let leadTeam = null;

    if (diff > 0) {
      leadText = `${teamA.name} ${diff} UP`;
      leadTeam = teamA;
    } else if (diff < 0) {
      leadText = `${teamB.name} ${Math.abs(diff)} UP`;
      leadTeam = teamB;
    }

    if (Math.abs(diff) > remainingHoles && completedHoles > 0) {
      leadText = `${leadTeam?.name} WINS (${Math.abs(diff)} & ${remainingHoles})`;
    } else if (Math.abs(diff) === remainingHoles && remainingHoles > 0) {
      leadText = `Dormie ${remainingHoles} (${leadTeam?.name})`;
    }

    return {
      leadText,
      winsA,
      winsB,
      completedHoles,
      teamAName: teamA.name,
      teamBName: teamB.name,
    };
  }, [session, currentHoleNum]);

  const getBadgeStyle = (strokes: number, par: number, isSelected: boolean) => {
    let base = `btn-modern flex flex-col items-center justify-center min-w-[46px] h-13 rounded-xl border text-center cursor-pointer transition-all ${isSelected ? 'ring-2 ring-emerald-500 scale-105 z-10 shadow-sm' : ''}`;
    
    if (strokes === 0) {
      return `${base} bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300`;
    }

    const diff = strokes - par;
    if (diff <= -2) {
      return `${base} bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border-2 border-amber-400 rounded-full font-bold relative after:absolute after:inset-[2px] after:border after:border-amber-400 after:rounded-full`;
    }
    if (diff === -1) {
      return `${base} bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-400 rounded-full font-bold`;
    }
    if (diff === 0) {
      return `${base} bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700 font-bold`;
    }
    if (diff === 1) {
      return `${base} bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 border border-slate-400 rounded-md font-bold`;
    }
    
    return `${base} bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 border-2 border-slate-500 rounded-md font-bold relative after:absolute after:inset-[2px] after:border after:border-slate-400 after:rounded-sm`;
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-4 pb-28 sm:pb-24 space-y-4">
      {/* 1. Header Bar: Course, Format, Room PIN */}
      <div className="card-modern p-3.5 sm:p-4 rounded-2xl flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onExitRound}
            className="w-9 h-9 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer shrink-0"
            title="Back to Clubhouse"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 rounded font-stats">
                {session.format.toUpperCase()}
              </span>
              {session.format === 'scramble' && (
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 rounded font-stats">
                  {session.teams && session.teams.length > 1
                    ? 'TEAM DUEL'
                    : session.teams && session.teams.length === 1
                    ? session.teams[0].playerIds.length === 1
                      ? 'SOLO SCRAMBLE (1P)'
                      : `${session.teams[0].playerIds.length}-PERSON SCRAMBLE`
                    : session.players.length === 1
                    ? 'SOLO SCRAMBLE (1P)'
                    : `${session.players.length}-PERSON SCRAMBLE`}
                </span>
              )}
              {session.format !== 'scramble' && hasTeams && session.teams && session.teams.length > 0 && (
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 rounded font-stats">
                  {session.teams.length === 1
                    ? session.teams[0].playerIds.length === 1
                      ? 'SOLO SQUAD (1P)'
                      : `${session.teams[0].playerIds.length}-PERSON TEAM`
                    : 'TEAM DUEL'}
                </span>
              )}
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate">
                {session.teeName}
              </span>
            </div>
            <h2 className="font-heading font-bold text-base sm:text-lg text-slate-900 dark:text-slate-100 truncate">
              {session.courseName}
            </h2>
          </div>
        </div>

        {/* Room PIN copy button */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleCopyPin}
            className="btn-modern px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            title="Click to copy room code"
          >
            <span className="font-stats">PIN: {session.roomCode}</span>
            {copiedPin ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
          </button>
        </div>
      </div>

      {/* Real-time Match Play Status Banner */}
      {matchPlayStatus && (
        <div className="p-3 bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-amber-500/10 dark:from-amber-950/40 dark:to-emerald-950/40 border border-amber-300 dark:border-amber-700/60 rounded-2xl flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-500 shrink-0" />
            <span className="font-heading font-extrabold text-slate-900 dark:text-slate-100">
              Match Status: <span className="text-emerald-700 dark:text-emerald-300">{matchPlayStatus.leadText}</span>
            </span>
          </div>
          <span className="text-slate-500 dark:text-slate-400 font-stats font-semibold">
            Thru Hole {matchPlayStatus.completedHoles} of 18
          </span>
        </div>
      )}

      {/* 2. Hole Selector Strip (1 - 18) */}
      <div className="overflow-x-auto pb-1">
        <div className="flex items-center gap-2 min-w-max p-1">
          {course.holes.map((h) => {
            const isSelected = h.number === currentHoleNum;
            const scoreForHole = activePlayer?.scores[h.number]?.strokes || 0;
            const badgeStyle = getBadgeStyle(scoreForHole, h.par, isSelected);

            return (
              <button
                key={h.number}
                onClick={() => setCurrentHoleNum(h.number)}
                className={badgeStyle}
              >
                <span className="font-heading font-bold text-xs leading-tight z-10">
                  #{h.number}
                </span>
                <span className="text-[10px] text-slate-400 leading-tight z-10">
                  P{h.par}
                </span>
                {scoreForHole > 0 && (
                  <span className="font-stats text-[12px] font-extrabold leading-none mt-1 z-10">
                    {scoreForHole}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Entity Switcher: Teams OR Players */}
      {hasTeams && session.teams ? (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-slate-500 px-1">
            <span className="font-bold uppercase tracking-wider text-[10px]">
              Scoring Active Team
            </span>
            <span>
              Attributing score to <strong>{activeTeam?.name}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {session.teams.map((t) => {
              const isActive = t.id === activeTeamId;
              const samplePlayer = session.players.find((p) => t.playerIds.includes(p.playerId)) || session.players[0];
              const totalScore = Object.values(samplePlayer?.scores || {}).reduce((acc, s) => acc + (s.strokes || 0), 0);
              const isFullFoursome = t.playerIds.length >= 4;

              return (
                <button
                  key={t.id}
                  onClick={() => handleSelectTeam(t)}
                  className={`btn-modern px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 whitespace-nowrap cursor-pointer transition-all ${
                    isActive
                      ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-sm ring-2 ring-emerald-500'
                      : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <span className="text-base">{t.avatarEmoji || '🎯'}</span>
                  <span>{t.name}</span>
                  <span className="text-[10px] opacity-70">
                    ({t.playerIds.length}P)
                  </span>
                  {totalScore > 0 && (
                    <span className={`font-stats px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      isActive ? 'bg-emerald-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}>
                      {totalScore}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        /* Individual Player Switcher */
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {session.players.map((p) => {
            const isActive = p.playerId === activePlayerId;
            const totalScore = Object.values(p.scores).reduce((acc, s) => acc + (s.strokes || 0), 0);
            return (
              <button
                key={p.playerId}
                onClick={() => setActivePlayerId(p.playerId)}
                className={`btn-modern px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 whitespace-nowrap cursor-pointer transition-all ${
                  isActive
                    ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-sm'
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                }`}
              >
                <span>{p.name}</span>
                {totalScore > 0 && (
                  <span className={`font-stats px-1.5 py-0.5 rounded text-[10px] font-bold ${isActive ? 'bg-emerald-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'}`}>
                    {totalScore}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* 4. Main Scoring Panel */}
      <div className="card-modern p-5 sm:p-6 rounded-3xl space-y-6">
        {/* Hole Specs Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="font-heading font-extrabold text-2xl sm:text-3xl text-slate-900 dark:text-slate-100">
                Hole {currentHole.number}
              </span>
              <span className="px-2.5 py-0.5 bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 font-heading font-bold text-xs rounded-lg border border-emerald-200 dark:border-emerald-800">
                Par {currentHole.par}
              </span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
              <span>{currentHole.yardage} yds</span>
              <span>·</span>
              <span>Index #{currentHole.handicapIndex}</span>
              {hasTeams && activeTeam && (
                <>
                  <span>·</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                    {activeTeam.name}
                  </span>
                </>
              )}
            </div>
          </div>

          {reaction && (
            <span className={`px-3 py-1 rounded-xl text-xs font-bold border ${reaction.color}`}>
              {reaction.text}
            </span>
          )}
        </div>

        {/* Strokes Counter Stepper */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              {hasTeams ? 'Team Gross Strokes' : 'Gross Strokes'}
            </span>
            <span className="font-stats font-extrabold text-4xl sm:text-5xl text-slate-900 dark:text-slate-100">
              {currentScore.strokes > 0 ? currentScore.strokes : '—'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => updateHoleScore({ strokes: Math.max(1, (currentScore.strokes || currentHole.par) - 1) })}
              className="w-12 h-12 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 text-xl font-bold flex items-center justify-center cursor-pointer transition-colors"
            >
              -
            </button>
            <button
              onClick={() => updateHoleScore({ strokes: (currentScore.strokes || currentHole.par) + 1 })}
              className="w-12 h-12 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xl font-bold flex items-center justify-center cursor-pointer shadow-sm transition-colors"
            >
              +
            </button>
          </div>
        </div>

        {/* Quick Par, Birdie, Bogey Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
          {[
            { label: 'Eagle (-2)', strokes: Math.max(1, currentHole.par - 2), cls: 'hover:border-red-400 text-red-600' },
            { label: 'Birdie (-1)', strokes: Math.max(1, currentHole.par - 1), cls: 'hover:border-emerald-500 text-emerald-600' },
            { label: 'Par (E)', strokes: currentHole.par, cls: 'hover:border-slate-500 text-slate-700 dark:text-slate-300' },
            { label: 'Bogey (+1)', strokes: currentHole.par + 1, cls: 'hover:border-amber-500 text-amber-600' },
          ].map((btn) => (
            <button
              key={btn.label}
              onClick={() => updateHoleScore({ strokes: btn.strokes })}
              className={`btn-modern py-2.5 px-2 text-center rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 cursor-pointer transition-all ${btn.cls}`}
            >
              {btn.label}
            </button>
          ))}
        </div>

        {/* Putts, FIR, GIR Details */}
        <div className="space-y-4 pt-3 border-t border-slate-100 dark:border-slate-800">
          
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Putts */}
            <div className="flex-1 space-y-1.5">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                Putts on Hole
              </span>
              <div className="flex items-center gap-1.5">
                {[0, 1, 2, 3, 4].map((p) => (
                  <button
                    key={p}
                    onClick={() => updateHoleScore({ putts: p })}
                    className={`w-8 h-8 rounded-lg text-xs font-bold border cursor-pointer transition-colors flex-1 sm:flex-none ${
                      currentScore.putts === p
                        ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 border-slate-900'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Live Drink Tracker */}
            <div className="flex-1 space-y-1.5">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <span>Drinks on Hole</span>
                <span className="text-[10px] text-amber-600 dark:text-amber-500 font-bold bg-amber-50 dark:bg-amber-900/30 px-1.5 py-0.5 rounded">
                  Round Total: {Object.values(activePlayer?.scores || {}).reduce((acc, s) => acc + (s.drinks || 0), 0)}
                </span>
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => updateHoleScore({ drinks: Math.max(0, (currentScore.drinks || 0) - 1) })}
                  className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold flex items-center justify-center cursor-pointer"
                >
                  -
                </button>
                <div className="flex-1 h-8 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/20 flex items-center justify-center gap-1.5 font-stats font-bold text-amber-700 dark:text-amber-500">
                  <span>🍹</span>
                  <span>{currentScore.drinks || 0}</span>
                </div>
                <button
                  onClick={() => updateHoleScore({ drinks: (currentScore.drinks || 0) + 1 })}
                  className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold flex items-center justify-center cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* FIR (for Par 4 and 5) */}
          {currentHole.par > 3 && (
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                Fairway in Regulation (FIR)
              </span>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'left', label: '⬅️ Left Rough' },
                  { id: 'hit', label: '🎯 Fairway Hit' },
                  { id: 'right', label: '➡️ Right Rough' },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => updateHoleScore({ fir: f.id as any })}
                    className={`btn-modern py-2 rounded-xl text-xs font-medium cursor-pointer ${
                      currentScore.fir === f.id
                        ? 'bg-emerald-600 text-white font-semibold'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* GIR */}
          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
              Green in Regulation (GIR)
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => updateHoleScore({ gir: true })}
                className={`btn-modern py-2 rounded-xl text-xs font-semibold cursor-pointer ${
                  currentScore.gir ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                ⛳ GIR Hit (Dart)
              </button>
              <button
                onClick={() => updateHoleScore({ gir: false })}
                className={`btn-modern py-2 rounded-xl text-xs font-medium cursor-pointer ${
                  !currentScore.gir && currentScore.strokes > 0 ? 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                ❌ Missed Green
              </button>
            </div>
          </div>
        </div>

        {/* Scramble Contributor Credit (Whose Drive was Chosen? + Key Approach/Putt) */}
        {(session.format === 'scramble' || hasTeams) && currentTeamPlayers.length >= 1 && (
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3.5">
            {/* Drive Selection */}
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <span>🏌️ Whose Drive was Chosen?</span>
                <span className="text-[11px] text-slate-400 font-normal">
                  {currentTeamPlayers.length === 1
                    ? 'Solo Scramble · 100% Attributed'
                    : 'Scramble rule requirement'}
                </span>
              </span>

              {currentTeamPlayers.length === 1 ? (
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-base shrink-0">🏌️</span>
                    <div className="min-w-0">
                      <span className="font-heading font-bold text-slate-900 dark:text-slate-100 block truncate">
                        Solo Drive: {currentTeamPlayers[0].name.split(' ')[0]}
                      </span>
                      <span className="text-[10px] text-slate-400 block truncate">
                        All tee shots automatically credited to solo golfer
                      </span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-stats font-bold text-[10px] shrink-0">
                    Auto-Credited
                  </span>
                </div>
              ) : (
                <div
                  className={`grid ${
                    currentTeamPlayers.length === 2
                      ? 'grid-cols-2'
                      : currentTeamPlayers.length === 3
                      ? 'grid-cols-3'
                      : 'grid-cols-2 sm:grid-cols-4'
                  } gap-1.5`}
                >
                  {currentTeamPlayers.map((p) => {
                    const isSelected = currentScore.driverPlayerId === p.playerId;
                    return (
                      <button
                        key={p.playerId}
                        onClick={() => updateHoleScore({ driverPlayerId: p.playerId })}
                        className={`btn-modern px-2 py-2 min-h-[36px] rounded-xl text-xs font-medium text-center truncate cursor-pointer transition-all flex items-center justify-center ${
                          isSelected
                            ? 'bg-emerald-600 text-white font-bold shadow-xs ring-1 ring-emerald-500'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                        title={p.name}
                      >
                        <span className="truncate">{p.name.split(' ')[0]}'s Drive</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Approach / Dart / Putt Contributor */}
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <span>🎯 Key Approach or Clutch Putt Contributor</span>
                <span className="text-[11px] text-slate-400 font-normal">
                  {currentTeamPlayers.length === 1 ? 'Solo dart honors' : 'Attribution bragging rights'}
                </span>
              </span>

              {currentTeamPlayers.length === 1 ? (
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    onClick={() =>
                      updateHoleScore({
                        shotContributorId: currentTeamPlayers[0].playerId,
                        shotContributorName: currentTeamPlayers[0].name,
                      })
                    }
                    className={`btn-modern px-2 py-2 min-h-[38px] rounded-xl text-xs font-medium text-center truncate cursor-pointer transition-all flex items-center justify-center ${
                      currentScore.shotContributorId === currentTeamPlayers[0].playerId || !currentScore.shotContributorId
                        ? 'bg-blue-600 text-white font-bold shadow-xs ring-1 ring-blue-500'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    <span className="truncate">🎯 {currentTeamPlayers[0].name.split(' ')[0]}'s Dart</span>
                  </button>
                  <button
                    onClick={() =>
                      updateHoleScore({
                        shotContributorId: 'team',
                        shotContributorName: 'Solo Dart Effort',
                      })
                    }
                    className={`btn-modern px-2 py-2 min-h-[38px] rounded-xl text-xs font-medium cursor-pointer flex items-center justify-center transition-all ${
                      currentScore.shotContributorId === 'team'
                        ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    <span className="truncate">⛳ Solo Scramble</span>
                  </button>
                </div>
              ) : (
                <div
                  className={`grid ${
                    currentTeamPlayers.length === 2
                      ? 'grid-cols-2'
                      : currentTeamPlayers.length === 3
                      ? 'grid-cols-3'
                      : 'grid-cols-2 sm:grid-cols-4'
                  } gap-1.5`}
                >
                  {currentTeamPlayers.map((p) => {
                    const isSelected = currentScore.shotContributorId === p.playerId;
                    return (
                      <button
                        key={p.playerId}
                        onClick={() =>
                          updateHoleScore({
                            shotContributorId: p.playerId,
                            shotContributorName: p.name,
                          })
                        }
                        className={`btn-modern px-2 py-2 min-h-[36px] rounded-xl text-xs font-medium text-center truncate cursor-pointer transition-all flex items-center justify-center ${
                          isSelected
                            ? 'bg-blue-600 text-white font-bold shadow-xs ring-1 ring-blue-500'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                        title={p.name}
                      >
                        <span className="truncate">{p.name.split(' ')[0]}'s Shot</span>
                      </button>
                    );
                  })}
                  <button
                    onClick={() =>
                      updateHoleScore({
                        shotContributorId: 'team',
                        shotContributorName: 'Full Team Effort',
                      })
                    }
                    className={`btn-modern ${
                      currentTeamPlayers.length === 2
                        ? 'col-span-2'
                        : currentTeamPlayers.length === 3
                        ? 'col-span-3'
                        : 'col-span-2 sm:col-span-4'
                    } px-2 py-2 min-h-[36px] rounded-xl text-xs font-medium cursor-pointer flex items-center justify-center transition-all ${
                      currentScore.shotContributorId === 'team'
                        ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    <span>🤝 Shared Squad Effort</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Prev / Next Hole Controls */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={() => setCurrentHoleNum(Math.max(1, currentHoleNum - 1))}
            disabled={currentHoleNum === 1}
            className="btn-modern px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1 disabled:opacity-40 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Prev Hole</span>
          </button>

          <span className="text-xs text-slate-400 font-medium">
            Hole {currentHoleNum} of 18
          </span>

          <button
            onClick={() => setCurrentHoleNum(Math.min(18, currentHoleNum + 1))}
            disabled={currentHoleNum === 18}
            className="btn-modern px-3.5 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 rounded-xl text-xs font-semibold flex items-center gap-1 disabled:opacity-40 cursor-pointer"
          >
            <span>Next Hole</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 5. Sticky Bottom Action Controls */}
      <div className="sticky bottom-2 z-30 card-modern p-3 rounded-2xl flex items-center justify-between gap-2.5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-lg border border-slate-200 dark:border-slate-800">
        <button
          onClick={onOpenScorecardMatrix}
          className="btn-modern flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Grid className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>Full Scorecard</span>
        </button>

        <button
          onClick={onOpenLeaderboard}
          className="btn-modern flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Trophy className="w-4 h-4 text-amber-500" />
          <span>Leaderboard</span>
        </button>

        <button
          onClick={onFinishRound}
          className="btn-modern px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
        >
          <Check className="w-4 h-4" />
          <span>Finish</span>
        </button>
      </div>
    </div>
  );
};
