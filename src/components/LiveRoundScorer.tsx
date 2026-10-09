import React, { useState } from 'react';
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
  Clock
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Course, GameFormat, HoleScore, PlayerRoundData, RoundSession } from '../types';
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
  const [activePlayerId, setActivePlayerId] = useState<string>(
    session.players[0]?.playerId || ''
  );
  const [copiedPin, setCopiedPin] = useState(false);

  const currentHole = course.holes.find((h) => h.number === currentHoleNum) || course.holes[0];
  const activePlayer = session.players.find((p) => p.playerId === activePlayerId) || session.players[0];
  const currentScore: HoleScore = activePlayer?.scores[currentHoleNum] || {
    strokes: 0,
    putts: 0,
    fir: 'none',
    gir: false,
  };

  const updateHoleScore = (partial: Partial<HoleScore>) => {
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

    const updated: HoleScore = {
      ...currentScore,
      ...partial,
      strokes: Math.max(0, newStrokes),
      putts: Math.max(0, newPutts),
      gir: autoGir,
    };

    onUpdateScore(activePlayer.playerId, currentHoleNum, updated);

    // Trigger birdie/eagle celebratory confetti
    if (partial.strokes !== undefined && partial.strokes > 0) {
      const diff = partial.strokes - currentHole.par;
      if (diff === -1) {
        confetti({ particleCount: 30, spread: 60, origin: { y: 0.7 } });
      } else if (diff <= -2) {
        confetti({ particleCount: 70, spread: 100, origin: { y: 0.6 } });
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
    if (diff === -1) return { text: '🎯 Birdie! Pure dart!', color: 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800' };
    if (diff === 0) return { text: '⛳ Par', color: 'text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700' };
    if (diff === 1) return { text: '⚠️ Bogey', color: 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800' };
    return { text: 'Double Bogey+', color: 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700' };
  };

  const reaction = getReactionTag(currentScore.strokes, currentHole.par);

  const hcpStrokesOnHole = getHoleHandicapStrokes(activePlayer?.courseHandicap || 0, currentHole.handicapIndex);
  const netScore = currentScore.strokes > 0 ? Math.max(1, currentScore.strokes - hcpStrokesOnHole) : 0;
  const stablefordPts = currentScore.strokes > 0 ? calculateStablefordPoints(netScore, currentHole.par) : 0;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 space-y-4">
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
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 rounded">
                {session.format.toUpperCase()}
              </span>
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

      {/* 2. Hole Selector Pill Strip (1 - 18) */}
      <div className="overflow-x-auto pb-1">
        <div className="flex items-center gap-1.5 min-w-max p-0.5">
          {course.holes.map((h) => {
            const isSelected = h.number === currentHoleNum;
            const scoreForHole = activePlayer?.scores[h.number]?.strokes || 0;
            const hasScore = scoreForHole > 0;
            const diff = scoreForHole - h.par;

            let badgeStyle = 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300';
            if (hasScore) {
              if (diff < 0) badgeStyle = 'bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-400 border-red-300 dark:border-red-800 font-bold';
              else if (diff === 0) badgeStyle = 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800 font-bold';
              else badgeStyle = 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700';
            }

            return (
              <button
                key={h.number}
                onClick={() => setCurrentHoleNum(h.number)}
                className={`btn-modern flex flex-col items-center justify-center min-w-[46px] h-13 rounded-xl border text-center cursor-pointer transition-all ${
                  isSelected ? 'ring-2 ring-emerald-500 scale-105 z-10 shadow-sm' : ''
                } ${badgeStyle}`}
              >
                <span className="font-heading font-bold text-xs leading-tight">
                  #{h.number}
                </span>
                <span className="text-[10px] text-slate-400 leading-tight">
                  P{h.par}
                </span>
                {hasScore && (
                  <span className="font-stats text-[11px] font-bold leading-none mt-0.5">
                    {scoreForHole}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Player Switcher Tab */}
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
              {hcpStrokesOnHole > 0 && (
                <>
                  <span>·</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                    +{hcpStrokesOnHole} stroke
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Quick Net / Points preview */}
          <div className="text-right">
            {session.format === 'stableford' && (
              <div className="px-3 py-1 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-center">
                <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-400 uppercase block">Points</span>
                <span className="font-stats font-bold text-lg text-amber-800 dark:text-amber-300 leading-none">
                  {stablefordPts}
                </span>
              </div>
            )}
            {session.format === 'stroke' && currentScore.strokes > 0 && (
              <div className="px-3 py-1 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-center">
                <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 uppercase block">Net</span>
                <span className="font-stats font-bold text-lg text-emerald-800 dark:text-emerald-300 leading-none">
                  {netScore}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Reaction Callout Badge */}
        {reaction && (
          <div className={`p-2.5 rounded-xl border text-xs font-semibold text-center transition-all ${reaction.color}`}>
            {reaction.text}
          </div>
        )}

        {/* Total Strokes Control */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
            <span>Total Strokes</span>
            <span className="text-slate-400 font-normal">
              {currentScore.strokes > 0 ? `${currentScore.strokes} Total` : 'Tap to enter'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => updateHoleScore({ strokes: Math.max(0, currentScore.strokes - 1) })}
              className="btn-modern w-14 h-13 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-2xl font-bold text-xl flex items-center justify-center cursor-pointer"
            >
              -
            </button>
            <div className="flex-1 h-13 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl flex items-center justify-center">
              <span className="font-stats font-extrabold text-3xl text-slate-900 dark:text-slate-100">
                {currentScore.strokes > 0 ? currentScore.strokes : '—'}
              </span>
            </div>
            <button
              onClick={() => updateHoleScore({ strokes: (currentScore.strokes || currentHole.par) + 1 })}
              className="btn-modern w-14 h-13 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-xl flex items-center justify-center cursor-pointer shadow-sm"
            >
              +
            </button>
          </div>

          {/* Quick Score Presets */}
          <div className="grid grid-cols-5 gap-2 pt-1">
            {[currentHole.par - 1, currentHole.par, currentHole.par + 1, currentHole.par + 2, currentHole.par + 3].map((val) => {
              if (val < 1) return null;
              const isCurrent = currentScore.strokes === val;
              return (
                <button
                  key={val}
                  onClick={() => updateHoleScore({ strokes: val })}
                  className={`btn-modern py-2 rounded-xl font-stats font-bold text-xs cursor-pointer ${
                    isCurrent
                      ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
                      : 'bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {val}
                </button>
              );
            })}
          </div>
        </div>

        {/* Putts Control */}
        <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
            <span>Putts on Green</span>
            <span className="text-slate-400 font-normal">
              {currentScore.putts} Putts
            </span>
          </div>

          <div className="grid grid-cols-5 gap-2">
            {[0, 1, 2, 3, 4].map((pVal) => {
              const isSelected = currentScore.putts === pVal;
              return (
                <button
                  key={pVal}
                  onClick={() => updateHoleScore({ putts: pVal })}
                  className={`btn-modern py-2.5 rounded-xl font-stats font-bold text-sm cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {pVal}
                </button>
              );
            })}
          </div>
        </div>

        {/* FIR & GIR Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-100 dark:border-slate-800">
          {/* FIR */}
          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
              Fairway in Regulation {currentHole.par === 3 && '(Par 3 N/A)'}
            </span>
            {currentHole.par === 3 ? (
              <div className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-center text-xs text-slate-400">
                Par 3 — No Fairway Hit Required
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  onClick={() => updateHoleScore({ fir: 'left' })}
                  className={`btn-modern py-2 rounded-xl text-xs font-medium cursor-pointer ${
                    currentScore.fir === 'left' ? 'bg-red-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  ⬅️ Miss Left
                </button>
                <button
                  onClick={() => updateHoleScore({ fir: 'hit' })}
                  className={`btn-modern py-2 rounded-xl text-xs font-semibold cursor-pointer ${
                    currentScore.fir === 'hit' ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  🎯 Bullseye
                </button>
                <button
                  onClick={() => updateHoleScore({ fir: 'right' })}
                  className={`btn-modern py-2 rounded-xl text-xs font-medium cursor-pointer ${
                    currentScore.fir === 'right' ? 'bg-red-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  Miss Right ➡️
                </button>
              </div>
            )}
          </div>

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

        {/* Scramble Driver Selection */}
        {session.format === 'scramble' && (
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
              🏌️ Whose Drive was Chosen?
            </span>
            <div className="flex items-center gap-2 flex-wrap">
              {session.players.map((p) => {
                const isSelected = currentScore.driverPlayerId === p.playerId;
                return (
                  <button
                    key={p.playerId}
                    onClick={() => updateHoleScore({ driverPlayerId: p.playerId })}
                    className={`btn-modern px-3 py-1.5 rounded-xl text-xs font-medium cursor-pointer ${
                      isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {p.name}'s Drive
                  </button>
                );
              })}
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
      <div className="card-modern p-3 rounded-2xl flex items-center justify-between gap-2.5">
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
