import React, { useState } from 'react';
import { X, ShieldCheck, Trophy, Target, ChevronRight, HelpCircle, Star, ArrowRight } from 'lucide-react';
import { MemberProfile } from '../types';

interface HandicapLeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: MemberProfile[];
  onSelectMemberForHistory?: (member: MemberProfile) => void;
}

export const HandicapLeaderboardModal: React.FC<HandicapLeaderboardModalProps> = ({
  isOpen,
  onClose,
  members,
  onSelectMemberForHistory,
}) => {
  const [selectedMemberId, setSelectedMemberId] = useState<string>(members[0]?.id || '');

  if (!isOpen) return null;

  const sortedMembers = [...members].sort((a, b) => a.handicapIndex - b.handicapIndex);
  const selectedMember = members.find((m) => m.id === selectedMemberId) || members[0];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="card-elevated max-w-4xl w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden my-6 shadow-2xl text-slate-900 dark:text-slate-100 transition-colors">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-extrabold text-xl text-slate-900 dark:text-slate-100">
                Bay Area Darts — Official WHS Rankings
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                World Handicap System (USGA) index calculation & differential breakdown
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 sm:p-6 grid grid-cols-1 md:grid-cols-3 gap-6 max-h-[80vh] overflow-y-auto">
          {/* Member Roster List (Left Column) */}
          <div className="md:col-span-1 space-y-2 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 pb-4 md:pb-0 md:pr-4">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 block">
              Club Members ({members.length})
            </label>
            <div className="space-y-1.5">
              {sortedMembers.map((m, idx) => {
                const isSelected = m.id === selectedMemberId;
                return (
                  <button
                    key={m.id}
                    onClick={() => setSelectedMemberId(m.id)}
                    className={`btn-modern w-full p-2.5 rounded-xl text-left flex items-center justify-between gap-2 cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-xs'
                        : 'bg-white dark:bg-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-700/60 border border-slate-200/80 dark:border-slate-700/80 text-slate-900 dark:text-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-stats font-bold text-xs opacity-60">#{idx + 1}</span>
                      <span className="text-base">{m.avatarEmoji}</span>
                      <span className="font-heading font-semibold text-xs truncate">{m.name}</span>
                    </div>
                    <span className={`font-stats font-bold text-xs shrink-0 ${isSelected ? 'text-emerald-400 dark:text-emerald-600' : 'text-emerald-600 dark:text-emerald-400'}`}>
                      {m.handicapIndex > 0 ? m.handicapIndex.toFixed(1) : `+${Math.abs(m.handicapIndex).toFixed(1)}`}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Member Differential Inspection (Right 2 Columns) */}
          <div className="md:col-span-2 space-y-5">
            {selectedMember && (
              <>
                {/* Profile Banner */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-13 h-13 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-3xl shadow-xs">
                      {selectedMember.avatarEmoji}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-heading font-extrabold text-lg sm:text-xl text-slate-900 dark:text-slate-100">
                          {selectedMember.name}
                        </h4>
                        {selectedMember.nickname && (
                          <span className="text-xs font-semibold px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 rounded-md border border-emerald-200 dark:border-emerald-800">
                            "{selectedMember.nickname}"
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-slate-500 dark:text-slate-400 block mt-0.5">
                        Badge: {selectedMember.badgeTitle} · {selectedMember.roundsCount} eligible rounds
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide block">
                      Handicap Index
                    </span>
                    <span className="font-stats font-extrabold text-2xl sm:text-3xl text-emerald-600 dark:text-emerald-400">
                      {selectedMember.handicapIndex > 0 ? selectedMember.handicapIndex.toFixed(1) : `+${Math.abs(selectedMember.handicapIndex).toFixed(1)}`}
                    </span>
                  </div>
                </div>

                {/* Stat Cards Strip */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="p-2.5 bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-center">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase block">Scoring Avg</span>
                    <span className="font-stats font-bold text-base text-slate-900 dark:text-slate-100">{selectedMember.scoringAverage}</span>
                  </div>
                  <div className="p-2.5 bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-center">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase block">Avg Putts</span>
                    <span className="font-stats font-bold text-base text-emerald-600 dark:text-emerald-400">{selectedMember.avgPutts}</span>
                  </div>
                  <div className="p-2.5 bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-center">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase block">GIR %</span>
                    <span className="font-stats font-bold text-base text-red-500">{selectedMember.girPercent}%</span>
                  </div>
                  <div className="p-2.5 bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-center">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase block">Best Round</span>
                    <span className="font-stats font-bold text-base text-amber-500">{selectedMember.bestRound}</span>
                  </div>
                </div>

                {/* Best 8 of 20 Differentials List */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-300">
                      Recent Differentials (Lowest 8 Count toward Index)
                    </label>
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                      <Star className="w-3 h-3 fill-current" />
                      ★ Counting in Index
                    </span>
                  </div>

                  <div className="card-modern rounded-xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    {selectedMember.differentials.map((diff, index) => (
                      <div
                        key={diff.roundId || index}
                        className={`p-3 flex items-center justify-between text-xs transition-colors ${
                          diff.usedInIndex ? 'bg-emerald-50/60 dark:bg-emerald-950/30 font-semibold' : 'text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {diff.usedInIndex ? (
                            <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold">
                              ★
                            </span>
                          ) : (
                            <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center text-[10px]">
                              {index + 1}
                            </span>
                          )}
                          <div>
                            <span className="font-semibold text-slate-900 dark:text-slate-100">{diff.courseName}</span>
                            <span className="text-[11px] text-slate-400 ml-2">{diff.date}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <span className="font-stats text-slate-700 dark:text-slate-300">Score: {diff.grossScore}</span>
                          <span className="font-stats font-bold text-xs text-emerald-600 dark:text-emerald-400">
                            Diff: {diff.differential}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* View Full History Button */}
                {onSelectMemberForHistory && (
                  <div className="pt-2">
                    <button
                      onClick={() => {
                        onClose();
                        onSelectMemberForHistory(selectedMember);
                      }}
                      className="btn-modern w-full p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>View Complete Player Scorecard History</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
