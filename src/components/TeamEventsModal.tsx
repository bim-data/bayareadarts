import React from 'react';
import { X, Trophy, Shield, Users, Calendar, Award, ChevronRight } from 'lucide-react';
import { TeamEventRecord } from '../types';

interface TeamEventsModalProps {
  isOpen: boolean;
  onClose: () => void;
  events: TeamEventRecord[];
  onSelectTeamForHistory?: (event: TeamEventRecord, teamName?: string) => void;
}

export const TeamEventsModal: React.FC<TeamEventsModalProps> = ({
  isOpen,
  onClose,
  events,
  onSelectTeamForHistory,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="card-elevated max-w-3xl w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden my-6 shadow-2xl text-slate-900 dark:text-slate-100 transition-colors">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-extrabold text-xl text-slate-900 dark:text-slate-100">
                Scrambles & Team Events Hall of Fame
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Archived scramble & best-ball shootouts for the Bay Area Darts crew
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

        <div className="p-5 sm:p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Isolation Notice Banner */}
          <div className="p-3.5 bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/60 rounded-xl text-xs text-amber-900 dark:text-amber-300 flex items-center gap-2.5">
            <Shield className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
            <div>
              <strong>Pure Team Records:</strong> These scramble and best-ball rounds record team glory and bragging rights without contaminating or skewing individual player WHS handicap calculations.
            </div>
          </div>

          {/* Events List */}
          <div className="space-y-4">
            {events.map((event) => (
              <div
                key={event.id}
                className="card-modern p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded border border-slate-200 dark:border-slate-700">
                        {event.format.toUpperCase()}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {event.date} · {event.courseName}
                      </span>
                    </div>
                    <h4 className="font-heading font-extrabold text-lg text-slate-900 dark:text-slate-100 mt-1">
                      {event.eventName}
                    </h4>
                  </div>

                  <div className="px-3 py-1.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-center shrink-0">
                    <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-400 uppercase block">Champions</span>
                    <span className="font-heading font-bold text-xs text-slate-900 dark:text-slate-100">
                      {event.winningTeamName}
                    </span>
                  </div>
                </div>

                {/* Leaderboard Table */}
                <div className="card-modern rounded-xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800">
                  {event.teamLeaderboard.map((team, idx) => (
                    <div
                      key={team.teamName}
                      onClick={() => onSelectTeamForHistory && onSelectTeamForHistory(event, team.teamName)}
                      className={`p-3 flex items-center justify-between gap-3 transition-colors cursor-pointer ${
                        idx === 0
                          ? 'bg-amber-50/50 dark:bg-amber-950/20'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="font-stats font-bold text-xs text-slate-400">
                          #{idx + 1}
                        </span>
                        <div>
                          <span className="font-heading font-bold text-xs text-slate-900 dark:text-slate-100 block">
                            {team.teamName}
                          </span>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate block">
                            {team.playerNames.join(', ')}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <div className="text-right">
                          <span className="font-stats font-bold text-sm text-slate-900 dark:text-slate-100">
                            {team.grossScore} Gross
                          </span>
                          {team.netScore && (
                            <span className="text-[11px] font-stats text-slate-400 ml-1.5">
                              ({team.netScore} net)
                            </span>
                          )}
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600" />
                      </div>
                    </div>
                  ))}
                </div>

                {event.notes && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                    "{event.notes}"
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="btn-modern px-5 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 rounded-xl text-xs font-semibold cursor-pointer shadow-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
