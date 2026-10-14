import React, { useState } from 'react';
import { ChevronDown, Trophy, Award } from 'lucide-react';
import { TeamEventRecord } from '../types';

interface ExpandableTeamEventCardProps {
  event: TeamEventRecord;
  defaultExpanded?: boolean;
}

export const ExpandableTeamEventCard: React.FC<ExpandableTeamEventCardProps> = ({ event, defaultExpanded = false }) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden transition-all shadow-xs">
      <div 
        onClick={() => setIsExpanded(!isExpanded)} 
        className="p-3 sm:p-4 flex items-center justify-between gap-3 text-xs cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-center justify-center text-amber-500 shrink-0 shadow-sm">
            <Trophy className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h5 className="font-heading font-extrabold text-sm text-slate-900 dark:text-slate-100 truncate">
              {event.eventName}
            </h5>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 flex-wrap mt-0.5">
              <span className="font-semibold text-emerald-600 dark:text-emerald-400 capitalize">
                {event.format}
              </span>
              <span>·</span>
              <span className="truncate">{event.date}</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">Win Score</span>
            <span className="font-stats font-extrabold text-sm text-emerald-600 dark:text-emerald-400">{event.teamLeaderboard[0]?.grossScore} Gross</span>
          </div>
          <div className={`w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
            <ChevronDown className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="p-3 sm:p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30 animate-fadeIn space-y-4">
          
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Event Leaderboard ({event.teamLeaderboard.length} Teams)
            </label>
            <span className="text-[10px] text-slate-400">{event.courseName}</span>
          </div>

          <div className="card-modern rounded-xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800/60 bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-800">
            {event.teamLeaderboard.map((team, idx) => (
              <div key={team.teamName} className="p-3 flex items-center justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-stats font-bold shrink-0 mt-0.5 ${idx === 0 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}>
                    {idx === 0 ? <Award className="w-3.5 h-3.5" /> : `#${idx + 1}`}
                  </span>
                  <div className="min-w-0 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-heading font-bold text-xs text-slate-900 dark:text-slate-100 truncate">
                        {team.teamName}
                      </span>
                    </div>
                    {/* Roster Names */}
                    {team.playerNames && team.playerNames.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {team.playerNames.map((pName, i) => (
                          <span key={i} className="text-[9px] px-1.5 py-0.5 rounded font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                            {pName.split(' ')[0]}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="font-stats font-extrabold text-sm text-slate-900 dark:text-slate-100 block">
                    {team.grossScore}
                  </span>
                  {team.netScore && (
                    <span className="font-stats text-[10px] text-slate-500 dark:text-slate-400">
                      ({team.netScore} net)
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {event.notes && (
            <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 text-[11px] text-blue-700 dark:text-blue-300 italic">
              "{event.notes}"
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Keeping the empty modal export just in case `App.tsx` tries to render it.
export const TeamHistoryModal: React.FC<any> = () => null;
