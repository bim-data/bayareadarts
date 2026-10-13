import React, { useState } from 'react';
import { X, Star } from 'lucide-react';
import { MemberProfile, CompletedRoundRecord, TeamEventRecord } from '../types';

interface PlayerHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: MemberProfile | null;
  rounds: CompletedRoundRecord[];
  teamEvents?: TeamEventRecord[];
  activeUserId?: string;
  onOpenEditProfile?: () => void;
}

export const PlayerHistoryModal: React.FC<PlayerHistoryModalProps> = ({
  isOpen,
  onClose,
  member,
  rounds,
  teamEvents = [],
  activeUserId,
  onOpenEditProfile,
}) => {
  const [activeTab, setActiveTab] = useState<'differentials' | 'rounds' | 'scrambles'>('differentials');

  if (!isOpen || !member) return null;

  const playerRounds = rounds.filter(
    (r) => r.playerId === member.id || (r.playerName || '').toLowerCase() === (member.name || '').toLowerCase()
  );

  const playerTeamEvents = teamEvents.filter((ev) =>
    ev.teamLeaderboard.some((t) =>
      t.playerNames.some(
        (pName) =>
          pName.toLowerCase().includes((member.name || '').toLowerCase()) ||
          (member.nickname && pName.toLowerCase().includes(member.nickname.toLowerCase()))
      )
    )
  );

  const safeDifferentials = member.differentials || [];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex sm:items-center justify-center p-0 sm:p-4 overflow-hidden">
      <div className="w-full sm:max-w-2xl h-[100dvh] sm:h-auto sm:max-h-[88vh] sm:rounded-3xl bg-white dark:bg-slate-900 border-0 sm:border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden text-slate-900 dark:text-slate-100 transition-colors">
        
        <div className="shrink-0 p-4 sm:p-5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-2xl shrink-0 shadow-sm">
              {member.avatarEmoji}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-heading font-extrabold text-xl text-slate-900 dark:text-slate-100">{member.name}</h3>
                {member.nickname && (
                  <span className="text-xs font-bold px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 rounded-md border border-emerald-200 dark:border-emerald-800">
                    "{member.nickname}"
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Official WHS Index: <strong className="text-emerald-600 dark:text-emerald-400 font-stats">{member.handicapIndex > 0 ? member.handicapIndex.toFixed(1) : `+${Math.abs(member.handicapIndex).toFixed(1)}`}</strong> · Badge: {member.badgeTitle}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {activeUserId === member.id ? (
              <button
                onClick={() => { onClose(); if (onOpenEditProfile) onOpenEditProfile(); }}
                className="btn-modern px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1 cursor-pointer"
              >
                <span>Edit My Profile</span>
              </button>
            ) : (
              <span className="hidden sm:inline-flex text-[11px] font-medium text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
                🔒 Read-Only
              </span>
            )}
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-center border border-slate-200/80 dark:border-slate-700/60">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide block">Scoring Avg</span>
              <span className="font-stats font-bold text-lg text-slate-900 dark:text-slate-100">{member.scoringAverage || 0}</span>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-center border border-slate-200/80 dark:border-slate-700/60">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide block">Avg Putts</span>
              <span className="font-stats font-bold text-lg text-emerald-600 dark:text-emerald-400">{member.avgPutts || 0}</span>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-center border border-slate-200/80 dark:border-slate-700/60">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide block">Greens Hit (GIR)</span>
              <span className="font-stats font-bold text-lg text-red-500">{member.girPercent || 0}%</span>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-center border border-slate-200/80 dark:border-slate-700/60">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide block">Career Low</span>
              <span className="font-stats font-bold text-lg text-amber-500">{member.bestRound || 0}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
            <button onClick={() => setActiveTab('differentials')} className={`btn-modern px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${activeTab === 'differentials' ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900' : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-100'}`}>
              WHS Differentials ({safeDifferentials.length})
            </button>
            <button onClick={() => setActiveTab('rounds')} className={`btn-modern px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${activeTab === 'rounds' ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900' : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-100'}`}>
              Round Records ({playerRounds.length})
            </button>
            <button onClick={() => setActiveTab('scrambles')} className={`btn-modern px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${activeTab === 'scrambles' ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900' : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-100'}`}>
              Team Events ({playerTeamEvents.length})
            </button>
          </div>

          {activeTab === 'differentials' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 dark:text-slate-400">Formula: (113 / Slope) * (Gross - Rating).</span>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                  <Star className="w-3 h-3 fill-current" /> ★ Lowest 8 count in Index
                </span>
              </div>
              <div className="card-modern rounded-2xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 max-h-64 overflow-y-auto">
                {safeDifferentials.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">No differentials recorded yet.</div>
                ) : (
                  safeDifferentials.map((diff, idx) => (
                    <div key={diff.roundId || idx} className={`p-3.5 flex items-center justify-between text-xs transition-colors ${diff.usedInIndex ? 'bg-emerald-50/50 dark:bg-emerald-950/20 font-semibold text-slate-900 dark:text-slate-100' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40'}`}>
                      <div className="flex items-center gap-3 min-w-0">
                        {diff.usedInIndex ? (
                          <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] shrink-0 font-bold">★</span>
                        ) : (
                          <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center text-[10px] shrink-0 font-stats">{idx + 1}</span>
                        )}
                        <div className="min-w-0">
                          <span className="font-medium text-slate-900 dark:text-slate-100 truncate block">{diff.courseName}</span>
                          <span className="text-[11px] text-slate-400 block">{diff.date}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-right shrink-0">
                        <span className="font-stats text-slate-800 dark:text-slate-200">{diff.grossScore} Gross</span>
                        <span className="font-stats font-bold text-emerald-600 dark:text-emerald-400 text-sm">{diff.differential} Diff</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'rounds' && (
            <div className="space-y-3">
              <div className="card-modern rounded-2xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 max-h-64 overflow-y-auto">
                {playerRounds.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">No individual round cards saved yet for this player.</div>
                ) : (
                  playerRounds.map((r) => (
                    <div key={r.id} className="p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <div className="flex items-center justify-between">
                        <span className="font-heading font-bold text-xs text-slate-900 dark:text-slate-100">{r.courseName} ({r.teeName})</span>
                        <div className="flex items-baseline gap-2">
                          <span className="font-stats font-bold text-sm text-slate-900 dark:text-slate-100">{r.grossScore} Gross</span>
                          <span className="text-xs text-slate-400 font-stats">({r.netScore} Net)</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mt-1">
                        <span>{r.date} · {r.format.toUpperCase()}</span>
                        <div className="flex items-center gap-2 font-stats">
                          <span>Putts: {r.totalPutts}</span>
                          <span>·</span>
                          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Diff: {r.differential}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'scrambles' && (
            <div className="space-y-3">
              <div className="card-modern rounded-2xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 max-h-64 overflow-y-auto">
                {playerTeamEvents.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">No scramble shootouts recorded for this player yet.</div>
                ) : (
                  playerTeamEvents.map((ev) => {
                    const playerTeam = ev.teamLeaderboard.find((t) =>
                      t.playerNames.some((p) => p.toLowerCase().includes((member.name || '').toLowerCase()) || (member.nickname && p.toLowerCase().includes(member.nickname.toLowerCase())))
                    );
                    return (
                      <div key={ev.id} className="p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                        <div className="flex items-center justify-between">
                          <span className="font-heading font-bold text-xs text-slate-900 dark:text-slate-100">{ev.eventName}</span>
                          <span className="font-stats font-bold text-xs text-emerald-600 dark:text-emerald-400">{playerTeam?.grossScore} Gross</span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mt-1">
                          <span>Team: <strong>{playerTeam?.teamName}</strong> · {ev.date}</span>
                          <span className="capitalize">{ev.format}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        <div className="shrink-0 p-3.5 sm:p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end">
          <button onClick={onClose} className="btn-modern px-5 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 rounded-xl text-xs font-semibold cursor-pointer shadow-sm">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
