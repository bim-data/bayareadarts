import React, { useState } from 'react';
import { X, Trophy, AlertCircle, ArrowUpRight, ArrowDownRight, Minus, Star } from 'lucide-react';
import { MemberProfile } from '../types';

interface HandicapLeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: MemberProfile[];
  onSelectMemberForHistory: (member: MemberProfile) => void;
}

export const HandicapLeaderboardModal: React.FC<HandicapLeaderboardModalProps> = ({ isOpen, onClose, members, onSelectMemberForHistory }) => {
  const [selectedMemberDiffs, setSelectedMemberDiffs] = useState<MemberProfile | null>(null);

  if (!isOpen) return null;

  // Only rank players who have established an index (at least 3 rounds)
  const rankedMembers = [...members]
    .filter((m) => m.roundsCount >= 3)
    .sort((a, b) => a.handicapIndex - b.handicapIndex);

  // Unranked players need more rounds
  const unrankedMembers = members.filter((m) => m.roundsCount < 3);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex sm:items-center justify-center p-0 sm:p-4 overflow-hidden">
      <div className="w-full sm:max-w-2xl h-[100dvh] sm:h-auto sm:max-h-[88vh] sm:rounded-3xl bg-white dark:bg-slate-900 border-0 sm:border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden text-slate-900 dark:text-slate-100 transition-colors">
        
        {/* Header */}
        <div className="shrink-0 p-4 sm:p-5 bg-emerald-50 dark:bg-emerald-950/40 border-b border-emerald-100 dark:border-emerald-800/60 flex items-center justify-between">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-heading font-extrabold text-xl text-slate-900 dark:text-slate-100">
                WHS Handicap Index Standings
              </h3>
              <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5">
                Official Bay Area Darts Rankings
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900 p-1.5 rounded-xl transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-6">
          
          {/* Rules/Info Banner */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl flex items-start gap-3 text-xs text-slate-600 dark:text-slate-400">
            <AlertCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong className="text-slate-900 dark:text-slate-200">How it works: </strong>
              The World Handicap System (WHS) calculates your index using the lowest 8 differentials from your last 20 18-hole rounds. You need at least 3 rounds to establish an initial index. Click any ranked player to see which rounds are counting toward their score.
            </div>
          </div>

          {/* Ranked Leaderboard */}
          {rankedMembers.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-heading font-bold text-sm text-slate-900 dark:text-slate-100 px-1">
                Official Rankings
              </h4>
              <div className="card-elevated rounded-2xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                {rankedMembers.map((member, index) => {
                  const isExpanded = selectedMemberDiffs?.id === member.id;
                  
                  return (
                    <div key={member.id}>
                      {/* Player Row */}
                      <div 
                        onClick={() => setSelectedMemberDiffs(isExpanded ? null : member)}
                        className={`p-3 sm:p-4 flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                          isExpanded ? 'bg-slate-50 dark:bg-slate-800/40' : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                        }`}
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-stats text-xs font-bold shrink-0 ${
                            index === 0 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 border border-amber-200 dark:border-amber-800' :
                            index === 1 ? 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600' :
                            index === 2 ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400 border border-orange-200 dark:border-orange-800' :
                            'bg-slate-50 text-slate-500 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700'
                          }`}>
                            {index === 0 ? '🏆' : `#${index + 1}`}
                          </div>
                          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 flex items-center justify-center text-xl shrink-0">
                            {member.avatarEmoji}
                          </div>
                          <div className="min-w-0">
                            <span className="font-heading font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100 truncate block">
                              {member.name}
                            </span>
                            <span className="text-xs text-slate-500 dark:text-slate-400 truncate block">
                              {member.roundsCount} rounds
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 shrink-0 text-right">
                          <div>
                            <div className="font-stats font-extrabold text-xl text-emerald-600 dark:text-emerald-400">
                              {member.handicapIndex > 0 ? member.handicapIndex.toFixed(1) : `+${Math.abs(member.handicapIndex).toFixed(1)}`}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Expandable Differentials List */}
                      {isExpanded && member.differentials && member.differentials.length > 0 && (
                        <div className="bg-slate-50 dark:bg-slate-900/50 p-4 border-t border-slate-100 dark:border-slate-800">
                          <div className="flex items-center justify-between mb-3 px-1">
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Last 20 Differentials</span>
                            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                              <Star className="w-3 h-3 fill-current" /> Counting in Index
                            </span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {member.differentials.map((diff, idx) => (
                              <div key={idx} className={`p-2.5 rounded-xl border text-xs flex items-center justify-between ${
                                diff.usedInIndex 
                                  ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800 shadow-2xs' 
                                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 opacity-60'
                              }`}>
                                <div className="flex items-center gap-2 min-w-0">
                                  {diff.usedInIndex ? (
                                    <Star className="w-3.5 h-3.5 text-emerald-500 fill-current shrink-0" />
                                  ) : (
                                    <span className="w-3.5 text-center text-slate-400 font-stats">{idx + 1}</span>
                                  )}
                                  <div className="truncate min-w-0">
                                    <span className={`block font-semibold truncate ${diff.usedInIndex ? 'text-slate-900 dark:text-slate-100' : 'text-slate-600 dark:text-slate-400'}`}>
                                      {diff.courseName}
                                    </span>
                                    <span className="block text-[10px] text-slate-400">{diff.date}</span>
                                  </div>
                                </div>
                                <div className="text-right shrink-0">
                                  <span className={`font-stats font-bold ${diff.usedInIndex ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-500'}`}>
                                    {diff.differential}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                          <button 
                            onClick={() => {
                              onClose();
                              onSelectMemberForHistory(member);
                            }}
                            className="mt-4 w-full py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold rounded-xl cursor-pointer"
                          >
                            View Full Player Scorecards
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Unranked Members */}
          {unrankedMembers.length > 0 && (
            <div className="space-y-3 pt-2">
              <h4 className="font-heading font-bold text-sm text-slate-500 dark:text-slate-400 px-1">
                Establishing Index (Need 3 Rounds)
              </h4>
              <div className="card-modern rounded-2xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
                {unrankedMembers.map((member) => (
                  <div key={member.id} className="p-3 sm:p-4 flex items-center justify-between gap-3 opacity-60 grayscale hover:grayscale-0 transition-all cursor-not-allowed">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 flex items-center justify-center font-stats text-xs font-bold shrink-0">
                        —
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 flex items-center justify-center text-xl shrink-0">
                        {member.avatarEmoji}
                      </div>
                      <div className="min-w-0">
                        <span className="font-heading font-bold text-sm sm:text-base text-slate-700 dark:text-slate-300 truncate block">
                          {member.name}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400 truncate block">
                          {member.roundsCount} / 3 rounds
                        </span>
                      </div>
                    </div>
                    <div className="font-stats font-bold text-base text-slate-400">
                      NH
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="shrink-0 p-3.5 sm:p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button onClick={onClose} className="btn-modern px-5 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 rounded-xl text-xs font-semibold cursor-pointer shadow-sm">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
