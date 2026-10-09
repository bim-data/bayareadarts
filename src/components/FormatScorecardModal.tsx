import React from 'react';
import { X, Trophy, Flag, Shield } from 'lucide-react';
import { Course, GameFormat, RoundSession } from '../types';

interface FormatScorecardModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: RoundSession;
  course: Course;
}

export const FormatScorecardModal: React.FC<FormatScorecardModalProps> = ({
  isOpen,
  onClose,
  session,
  course,
}) => {
  if (!isOpen) return null;

  const front9Holes = course.holes.slice(0, 9);
  const back9Holes = course.holes.slice(9, 18);
  const frontPar = front9Holes.reduce((acc, h) => acc + h.par, 0);
  const backPar = back9Holes.reduce((acc, h) => acc + h.par, 0);
  const totalPar = frontPar + backPar;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="card-elevated max-w-5xl w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden my-6 shadow-2xl text-slate-900 dark:text-slate-100 transition-colors">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <Flag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-extrabold text-xl text-slate-900 dark:text-slate-100">
                {session.courseName} · Full Scorecard Matrix
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Format: {session.format.toUpperCase()} · Tee: {session.teeName} · PIN: {session.roomCode}
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

        {/* Table Container */}
        <div className="p-4 sm:p-6 overflow-x-auto">
          <table className="w-full text-xs text-center border-collapse font-stats">
            <thead>
              {/* Hole Numbers Header */}
              <tr className="bg-slate-900 dark:bg-slate-800 text-white font-heading font-bold">
                <th className="p-2.5 text-left border-r border-slate-700 min-w-[130px]">Golfer</th>
                {front9Holes.map((h) => (
                  <th key={h.number} className="p-1.5 w-8 border-r border-slate-700">
                    {h.number}
                  </th>
                ))}
                <th className="p-1.5 w-10 bg-slate-800 dark:bg-slate-700 border-r border-slate-700 font-extrabold">OUT</th>
                {back9Holes.map((h) => (
                  <th key={h.number} className="p-1.5 w-8 border-r border-slate-700">
                    {h.number}
                  </th>
                ))}
                <th className="p-1.5 w-10 bg-slate-800 dark:bg-slate-700 border-r border-slate-700 font-extrabold">IN</th>
                <th className="p-1.5 w-12 bg-emerald-600 text-white font-extrabold">TOT</th>
              </tr>

              {/* Par Row */}
              <tr className="bg-slate-100 dark:bg-slate-800/60 text-slate-800 dark:text-slate-200 font-bold border-b border-slate-200 dark:border-slate-800">
                <td className="p-2 text-left font-heading text-slate-900 dark:text-slate-100 border-r border-slate-200 dark:border-slate-800">
                  PAR
                </td>
                {front9Holes.map((h) => (
                  <td key={h.number} className="p-1.5 border-r border-slate-200 dark:border-slate-800">
                    {h.par}
                  </td>
                ))}
                <td className="p-1.5 font-bold bg-slate-200 dark:bg-slate-700/60 border-r border-slate-200 dark:border-slate-800">
                  {frontPar}
                </td>
                {back9Holes.map((h) => (
                  <td key={h.number} className="p-1.5 border-r border-slate-200 dark:border-slate-800">
                    {h.par}
                  </td>
                ))}
                <td className="p-1.5 font-bold bg-slate-200 dark:bg-slate-700/60 border-r border-slate-200 dark:border-slate-800">
                  {backPar}
                </td>
                <td className="p-1.5 font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                  {totalPar}
                </td>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {session.players.map((player) => {
                const frontStrokes = front9Holes.map((h) => player.scores[h.number]?.strokes || 0);
                const backStrokes = back9Holes.map((h) => player.scores[h.number]?.strokes || 0);
                const outTotal = frontStrokes.reduce((acc, s) => acc + s, 0);
                const inTotal = backStrokes.reduce((acc, s) => acc + s, 0);
                const totalGross = outTotal + inTotal;

                return (
                  <tr key={player.playerId} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 bg-white dark:bg-slate-900">
                    {/* Golfer Name & Info */}
                    <td className="p-2.5 text-left border-r border-slate-200 dark:border-slate-800">
                      <div className="font-heading font-bold text-xs text-slate-900 dark:text-slate-100 truncate">
                        {player.name}
                      </div>
                      <div className="text-[10px] text-slate-400 font-stats">
                        Idx: {player.handicapIndex} (CH: {player.courseHandicap})
                      </div>
                    </td>

                    {/* Front 9 Holes */}
                    {front9Holes.map((h) => {
                      const strokes = player.scores[h.number]?.strokes || 0;
                      const diff = strokes > 0 ? strokes - h.par : null;

                      let cellStyle = 'text-slate-400';
                      if (diff !== null) {
                        if (diff < 0) cellStyle = 'bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 font-bold';
                        else if (diff === 0) cellStyle = 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-semibold';
                        else cellStyle = 'text-slate-800 dark:text-slate-200';
                      }

                      return (
                        <td key={h.number} className={`p-1.5 border-r border-slate-100 dark:border-slate-800 ${cellStyle}`}>
                          {strokes > 0 ? strokes : '-'}
                        </td>
                      );
                    })}

                    {/* OUT Subtotal */}
                    <td className="p-1.5 font-bold bg-slate-50 dark:bg-slate-800/40 border-r border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200">
                      {outTotal > 0 ? outTotal : '-'}
                    </td>

                    {/* Back 9 Holes */}
                    {back9Holes.map((h) => {
                      const strokes = player.scores[h.number]?.strokes || 0;
                      const diff = strokes > 0 ? strokes - h.par : null;

                      let cellStyle = 'text-slate-400';
                      if (diff !== null) {
                        if (diff < 0) cellStyle = 'bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 font-bold';
                        else if (diff === 0) cellStyle = 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-semibold';
                        else cellStyle = 'text-slate-800 dark:text-slate-200';
                      }

                      return (
                        <td key={h.number} className={`p-1.5 border-r border-slate-100 dark:border-slate-800 ${cellStyle}`}>
                          {strokes > 0 ? strokes : '-'}
                        </td>
                      );
                    })}

                    {/* IN Subtotal */}
                    <td className="p-1.5 font-bold bg-slate-50 dark:bg-slate-800/40 border-r border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200">
                      {inTotal > 0 ? inTotal : '-'}
                    </td>

                    {/* TOTAL Score */}
                    <td className="p-1.5 font-extrabold text-sm text-emerald-600 dark:text-emerald-400 bg-emerald-50/40 dark:bg-emerald-950/20">
                      {totalGross > 0 ? totalGross : '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
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
