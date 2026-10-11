import React, { useState } from 'react';
import { X, Trophy, Swords, Medal, Flag } from 'lucide-react';
import { Course, GameFormat, RoundSession } from '../types';
import { calculateStablefordPoints, computeMatchPlayStatus } from '../utils/handicap';

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: RoundSession;
  course: Course;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  isOpen,
  onClose,
  session,
  course,
}) => {
  const [viewMode, setViewMode] = useState<'gross' | 'net' | 'stableford'>('gross');

  if (!isOpen) return null;

  // Compute standings for each player
  const standings = session.players.map((player) => {
    let grossTotal = 0;
    let netTotal = 0;
    let stablefordTotal = 0;
    let holesPlayed = 0;
    let parTotalForPlayed = 0;

    for (let h = 1; h <= 18; h++) {
      const strokes = player.scores[h]?.strokes || 0;
      const holeInfo = course.holes.find((item) => item.number === h);
      if (strokes > 0 && holeInfo) {
        grossTotal += strokes;
        holesPlayed += 1;
        parTotalForPlayed += holeInfo.par;

        // Net Strokes
        let strokesGiven = 0;
        if (player.courseHandicap >= holeInfo.handicapIndex) strokesGiven = 1;
        if (player.courseHandicap >= holeInfo.handicapIndex + 18) strokesGiven = 2;
        const net = Math.max(1, strokes - strokesGiven);
        netTotal += net;

        // Stableford points
        stablefordTotal += calculateStablefordPoints(net, holeInfo.par);
      }
    }

    const toPar = grossTotal - parTotalForPlayed;

    return {
      player,
      grossTotal,
      netTotal,
      stablefordTotal,
      holesPlayed,
      toPar,
    };
  });

  // Sort by active view
  if (viewMode === 'gross') {
    standings.sort((a, b) => a.grossTotal - b.grossTotal);
  } else if (viewMode === 'net') {
    standings.sort((a, b) => a.netTotal - b.netTotal);
  } else if (viewMode === 'stableford') {
    standings.sort((a, b) => b.stablefordTotal - a.stablefordTotal);
  }

  // Match Play status computation if Match Play format
  let matchPlayDetails = null;
  if (session.format === 'match_play' && session.players.length >= 2) {
    const p1 = session.players[0];
    const p2 = session.players[1];
    matchPlayDetails = computeMatchPlayStatus(
      p1.playerId,
      p1.name,
      p1.scores,
      p1.courseHandicap,
      p2.playerId,
      p2.name,
      p2.scores,
      p2.courseHandicap,
      course,
      true
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex sm:items-center justify-center p-0 sm:p-4 overflow-hidden">
      <div className="w-full sm:max-w-2xl h-[100dvh] sm:h-auto sm:max-h-[88vh] sm:rounded-3xl bg-white dark:bg-slate-900 border-0 sm:border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden text-slate-900 dark:text-slate-100 transition-colors">
        {/* Sticky Header */}
        <div className="shrink-0 p-4 sm:p-5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-xs shrink-0">
              <Trophy className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="font-heading font-extrabold text-lg sm:text-xl text-slate-900 dark:text-slate-100 truncate">
                Live Leaderboard
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {session.courseName} · Room: {session.roomCode} · Tee: {session.teeName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-9 h-9 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-6">
          {/* Match Play Highlight Banner if Match Play */}
          {matchPlayDetails && (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                  <Swords className="w-4 h-4" />
                  Match Play Status
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-stats">
                  {matchPlayDetails.holesRemaining > 0 ? `${matchPlayDetails.holesRemaining} to play` : 'Match Concluded'}
                </span>
              </div>
              <div className="font-heading font-extrabold text-lg text-slate-900 dark:text-slate-100">
                {matchPlayDetails.statusText}
              </div>
              <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 pt-1 border-t border-slate-200 dark:border-slate-700">
                <span>{session.players[0]?.name} vs {session.players[1]?.name}</span>
                <span>{matchPlayDetails.isDormie ? '⚡ Dormie' : matchPlayDetails.isMatchFinished ? '🏆 Final' : 'In Progress'}</span>
              </div>
            </div>
          )}

          {/* View Mode Tabs (Gross, Net, Stableford) */}
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => setViewMode('gross')}
              className={`btn-modern p-2 rounded-xl text-xs font-semibold cursor-pointer border transition-colors ${
                viewMode === 'gross'
                  ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 border-transparent shadow-xs'
                  : 'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              Gross Score
            </button>
            <button
              onClick={() => setViewMode('net')}
              className={`btn-modern p-2 rounded-xl text-xs font-semibold cursor-pointer border transition-colors ${
                viewMode === 'net'
                  ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 border-transparent shadow-xs'
                  : 'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              Net Score (Hcp)
            </button>
            <button
              onClick={() => setViewMode('stableford')}
              className={`btn-modern p-2 rounded-xl text-xs font-semibold cursor-pointer border transition-colors ${
                viewMode === 'stableford'
                  ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 border-transparent shadow-xs'
                  : 'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              Stableford Pts
            </button>
          </div>

          {/* Standings Table */}
          <div className="card-modern rounded-2xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            {standings.map((s, idx) => {
              const isLead = idx === 0 && s.grossTotal > 0;
              return (
                <div
                  key={s.player.playerId}
                  className={`p-4 flex items-center justify-between gap-3 ${
                    isLead ? 'bg-amber-50/40 dark:bg-amber-950/20' : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center font-stats font-bold text-xs shrink-0">
                      {isLead ? '👑' : `#${idx + 1}`}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-heading font-bold text-sm text-slate-900 dark:text-slate-100 truncate">
                          {s.player.name}
                        </span>
                        {isLead && (
                          <span className="text-[10px] px-1.5 py-0.2 bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 rounded font-semibold">
                            Leader
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-stats mt-0.5">
                        <span>Thru {s.holesPlayed}</span>
                        <span>·</span>
                        <span>CH: {s.player.courseHandicap}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    {viewMode === 'gross' && (
                      <div>
                        <div className="font-stats font-extrabold text-lg text-slate-900 dark:text-slate-100">
                          {s.grossTotal > 0 ? s.grossTotal : '-'}
                        </div>
                        <div className="font-stats text-xs font-semibold text-slate-500 dark:text-slate-400">
                          {s.toPar === 0 ? 'E' : s.toPar > 0 ? `+${s.toPar}` : s.toPar}
                        </div>
                      </div>
                    )}

                    {viewMode === 'net' && (
                      <div>
                        <div className="font-stats font-extrabold text-lg text-emerald-600 dark:text-emerald-400">
                          {s.netTotal > 0 ? s.netTotal : '-'} Net
                        </div>
                        <div className="font-stats text-xs text-slate-400">
                          Gross: {s.grossTotal}
                        </div>
                      </div>
                    )}

                    {viewMode === 'stableford' && (
                      <div>
                        <div className="font-stats font-extrabold text-lg text-amber-500">
                          {s.stablefordTotal} Pts
                        </div>
                        <div className="font-stats text-xs text-slate-400">
                          {s.holesPlayed} holes
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sticky Footer */}
        <div className="shrink-0 p-3.5 sm:p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="btn-modern px-5 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 rounded-xl text-xs font-semibold cursor-pointer shadow-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
