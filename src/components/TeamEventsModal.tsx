import React from 'react';
import { X, Trophy, Shield } from 'lucide-react';
import { TeamEventRecord } from '../types';
import { ExpandableTeamEventCard } from './TeamHistoryModal'; // Import our new expandable team card!

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
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex sm:items-center justify-center p-0 sm:p-4 overflow-hidden">
      <div className="w-full sm:max-w-3xl h-[100dvh] sm:h-auto sm:max-h-[88vh] sm:rounded-3xl bg-white dark:bg-slate-900 border-0 sm:border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden text-slate-900 dark:text-slate-100 transition-colors">
        {/* Sticky Header */}
        <div className="shrink-0 p-4 sm:p-5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-xs shrink-0">
              <Trophy className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="font-heading font-extrabold text-lg sm:text-xl text-slate-900 dark:text-slate-100 truncate">
                Scrambles & Team Events Hall of Fame
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                Archived scramble & best-ball shootouts for the Bay Area Darts crew
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

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-6">
          {/* Isolation Notice Banner */}
          <div className="p-3.5 bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/60 rounded-xl text-xs text-amber-900 dark:text-amber-300 flex items-center gap-2.5">
            <Shield className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
            <div>
              <strong>Pure Team Records:</strong> These scramble and best-ball rounds record team glory and bragging rights without contaminating or skewing individual player WHS handicap calculations.
            </div>
          </div>

          {/* Events List using Expandable Cards */}
          <div className="space-y-3">
            {events.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400 border border-slate-200 dark:border-slate-800 rounded-xl">
                No team events have been recorded yet.
              </div>
            ) : (
              events.map((event) => (
                <ExpandableTeamEventCard key={event.id} event={event} />
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="shrink-0 p-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex justify-end">
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
