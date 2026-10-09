import React from 'react';
import { X, Trophy, Users, Calendar, Flag, Award, Sparkles, CheckCircle2 } from 'lucide-react';
import { TeamEventRecord } from '../types';

interface TeamHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: TeamEventRecord | null;
  selectedTeamName?: string | null;
}

export const TeamHistoryModal: React.FC<TeamHistoryModalProps> = ({
  isOpen,
  onClose,
  event,
  selectedTeamName,
}) => {
  if (!isOpen || !event) return null;

  const targetTeamName = selectedTeamName || event.winningTeamName;
  const currentTeam = event.teamLeaderboard.find((t) => t.teamName === targetTeamName) || event.teamLeaderboard[0];
  const isWinner = currentTeam?.teamName === event.winningTeamName;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="card-elevated rounded-3xl max-w-2xl w-full p-6 space-y-6 shadow-2xl my-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-center justify-center text-amber-500 shrink-0 shadow-sm">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded border border-slate-200 dark:border-slate-700">
                  {event.format.toUpperCase()} SHOOTOUT
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {event.date} · {event.courseName}
                </span>
              </div>
              <h3 className="font-heading font-extrabold text-xl text-slate-900 dark:text-slate-100 mt-1">
                {currentTeam?.teamName}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Team Score Overview Banner */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5">
              {isWinner ? (
                <span className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                  <Award className="w-4 h-4 fill-current" />
                  Tournament Champions
                </span>
              ) : (
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                  Team Event Participant
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {event.eventName}
            </p>
          </div>

          <div className="text-right">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
              Team Score
            </span>
            <div className="flex items-baseline gap-2">
              <span className="font-stats font-extrabold text-2xl text-emerald-600 dark:text-emerald-400">
                {currentTeam?.grossScore} Gross
              </span>
              {currentTeam?.netScore && (
                <span className="text-xs font-stats text-slate-500 dark:text-slate-400">
                  ({currentTeam.netScore} Net)
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Players on Team */}
        <div className="space-y-2.5">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block uppercase tracking-wide">
            Team Foursome Members ({currentTeam?.playerNames.length || 0})
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {currentTeam?.playerNames.map((name, i) => (
              <div
                key={i}
                className="p-3 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 flex items-center gap-2.5 shadow-2xs"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0 font-stats">
                  #{i + 1}
                </div>
                <div className="truncate">
                  <span className="font-heading font-semibold text-xs text-slate-900 dark:text-slate-100 truncate block">
                    {name}
                  </span>
                  <span className="text-[11px] text-slate-400 block">
                    Bay Area Darts Golfer
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Shootout Leaderboard */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block uppercase tracking-wide">
              Full Event Leaderboard
            </label>
            <span className="text-[11px] text-slate-400 font-medium">
              {event.teamLeaderboard.length} Teams Competed
            </span>
          </div>

          <div className="card-modern rounded-2xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
            {event.teamLeaderboard.map((team, idx) => {
              const isSelected = team.teamName === currentTeam?.teamName;
              return (
                <div
                  key={team.teamName}
                  className={`p-3.5 flex items-center justify-between gap-3 transition-colors ${
                    isSelected
                      ? 'bg-emerald-50/60 dark:bg-emerald-950/30 font-semibold'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center text-xs font-stats font-bold shrink-0">
                      #{idx + 1}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-heading font-bold text-xs text-slate-900 dark:text-slate-100 truncate">
                          {team.teamName}
                        </span>
                        {idx === 0 && (
                          <span className="text-[10px] px-1.5 py-0.2 bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 rounded font-semibold">
                            Winner
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate block">
                        {team.playerNames.join(', ')}
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-stats font-bold text-sm text-slate-900 dark:text-slate-100">
                      {team.grossScore}
                    </span>
                    {team.netScore && (
                      <span className="font-stats text-[11px] text-slate-500 dark:text-slate-400 ml-1.5">
                        ({team.netScore} net)
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Event Story Notes */}
        {event.notes && (
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 italic">
            "{event.notes}"
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={onClose}
            className="btn-modern px-5 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 rounded-xl text-xs font-semibold cursor-pointer shadow-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
