import React from 'react';
import { HoleInfo } from '../types';

interface CourseScorecardTableProps {
  holes: HoleInfo[];
  isEditing?: boolean;
  onUpdateHole?: (holeNumber: number, field: keyof HoleInfo, value: number) => void;
}

export const CourseScorecardTable: React.FC<CourseScorecardTableProps> = ({
  holes,
  isEditing = false,
  onUpdateHole,
}) => {
  // Sort holes by hole number
  const sortedHoles = [...holes].sort((a, b) => a.number - b.number);
  const is18 = sortedHoles.length > 9;

  const front9Holes = sortedHoles.filter((h) => h.number <= 9);
  const back9Holes = sortedHoles.filter((h) => h.number > 9 && h.number <= 18);

  const getHole = (num: number): HoleInfo => {
    return (
      sortedHoles.find((h) => h.number === num) || {
        number: num,
        par: 4,
        yardage: 350,
        handicapIndex: num,
      }
    );
  };

  const front9OutPar = front9Holes.reduce((acc, h) => acc + (Number(h.par) || 0), 0);
  const front9OutYds = front9Holes.reduce((acc, h) => acc + (Number(h.yardage) || 0), 0);

  const back9InPar = back9Holes.reduce((acc, h) => acc + (Number(h.par) || 0), 0);
  const back9InYds = back9Holes.reduce((acc, h) => acc + (Number(h.yardage) || 0), 0);

  const totalPar = front9OutPar + (is18 ? back9InPar : 0);
  const totalYds = front9OutYds + (is18 ? back9InYds : 0);

  const handleYardageChange = (holeNum: number, rawVal: string) => {
    if (!onUpdateHole) return;
    const cleanNum = rawVal.replace(/[^0-9]/g, '');
    const numVal = cleanNum === '' ? 0 : parseInt(cleanNum, 10);
    onUpdateHole(holeNum, 'yardage', numVal);
  };

  const handleParChange = (holeNum: number, delta: number) => {
    if (!onUpdateHole) return;
    const current = getHole(holeNum).par || 4;
    const nextVal = Math.max(3, Math.min(6, current + delta));
    onUpdateHole(holeNum, 'par', nextVal);
  };

  const handleHandicapChange = (holeNum: number, rawVal: string) => {
    if (!onUpdateHole) return;
    const cleanNum = rawVal.replace(/[^0-9]/g, '');
    const numVal = cleanNum === '' ? 1 : Math.max(1, Math.min(18, parseInt(cleanNum, 10)));
    onUpdateHole(holeNum, 'handicapIndex', numVal);
  };

  return (
    <div className="w-full overflow-x-auto pb-1 text-slate-900 dark:text-slate-100">
      <div className="min-w-[620px] max-w-full border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-2xs">
        
        {/* Front 9 Section */}
        <div className="border-b border-slate-200 dark:border-slate-800">
          {/* Header / Hole row */}
          <div className="flex items-center border-b border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/80">
            <div className="w-20 shrink-0 p-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-left border-r border-slate-200 dark:border-slate-700">
              Hole
            </div>
            {Array.from({ length: 9 }, (_, i) => i + 1).map((h) => (
              <div
                key={h}
                className="w-12 shrink-0 p-2 text-center text-[11px] font-bold text-slate-600 dark:text-slate-300 border-r border-slate-200 dark:border-slate-700 font-mono"
              >
                {h}
              </div>
            ))}
            <div className="w-14 shrink-0 p-2 text-center text-[11px] font-extrabold text-slate-700 dark:text-white bg-slate-200 dark:bg-slate-700 border-r border-slate-200 dark:border-slate-700">
              OUT
            </div>
            {is18 && (
              <div className="w-14 shrink-0 p-2 text-center text-[11px] font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10">
                TOTAL
              </div>
            )}
          </div>

          {/* Par Row */}
          <div className="flex items-center border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
            <div className="w-20 shrink-0 p-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-left border-r border-slate-200 dark:border-slate-700">
              Par
            </div>
            {Array.from({ length: 9 }, (_, i) => i + 1).map((h) => {
              const hole = getHole(h);
              return (
                <div
                  key={h}
                  className="w-12 h-9 shrink-0 flex items-center justify-center text-[11px] font-bold text-slate-700 dark:text-slate-200 border-r border-slate-200 dark:border-slate-700 font-mono"
                >
                  {isEditing ? (
                    <div className="flex items-center justify-center gap-0.5">
                      <button
                        type="button"
                        onClick={() => handleParChange(h, -1)}
                        className="w-3.5 h-6 rounded bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-center cursor-pointer transition-colors"
                        title="Decrease par"
                      >
                        -
                      </button>
                      <span className="font-mono font-bold text-xs w-3 text-center">
                        {hole.par}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleParChange(h, 1)}
                        className="w-3.5 h-6 rounded bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-center cursor-pointer transition-colors"
                        title="Increase par"
                      >
                        +
                      </button>
                    </div>
                  ) : (
                    <span>{hole.par}</span>
                  )}
                </div>
              );
            })}
            <div className="w-14 shrink-0 h-9 flex items-center justify-center text-[11px] font-extrabold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/80 border-r border-slate-200 dark:border-slate-700 font-mono">
              {front9OutPar}
            </div>
            {is18 && (
              <div className="w-14 shrink-0 h-9 flex items-center justify-center text-[11px] font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 font-mono">
                {totalPar}
              </div>
            )}
          </div>

          {/* Yardage Row */}
          <div className="flex items-center border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <div className="w-20 shrink-0 p-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-left border-r border-slate-200 dark:border-slate-700">
              Yardage
            </div>
            {Array.from({ length: 9 }, (_, i) => i + 1).map((h) => {
              const hole = getHole(h);
              return (
                <div
                  key={h}
                  className="w-12 h-9 shrink-0 flex items-center justify-center text-[11px] font-semibold text-slate-600 dark:text-slate-400 border-r border-slate-200 dark:border-slate-700 font-mono"
                >
                  {isEditing ? (
                    <input
                      type="text"
                      pattern="[0-9]*"
                      value={hole.yardage || ''}
                      onChange={(e) => handleYardageChange(h, e.target.value)}
                      placeholder="yds"
                      className="w-10 h-7 text-center text-xs font-mono font-bold bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded focus:ring-1 focus:ring-emerald-500 focus:outline-hidden text-slate-900 dark:text-white"
                    />
                  ) : (
                    <span>{hole.yardage || '-'}</span>
                  )}
                </div>
              );
            })}
            <div className="w-14 shrink-0 h-9 flex items-center justify-center text-[11px] font-bold text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/40 border-r border-slate-200 dark:border-slate-700 font-mono">
              {front9OutYds}
            </div>
            {is18 && (
              <div className="w-14 shrink-0 h-9 flex items-center justify-center text-[11px] font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 font-mono">
                {totalYds}
              </div>
            )}
          </div>

          {/* Handicap Index Row */}
          <div className="flex items-center bg-slate-50/70 dark:bg-slate-900/40">
            <div className="w-20 shrink-0 p-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-left border-r border-slate-200 dark:border-slate-700">
              Handicap
            </div>
            {Array.from({ length: 9 }, (_, i) => i + 1).map((h) => {
              const hole = getHole(h);
              return (
                <div
                  key={h}
                  className="w-12 h-9 shrink-0 flex items-center justify-center text-[11px] font-medium text-slate-500 dark:text-slate-400 border-r border-slate-200 dark:border-slate-700 font-mono"
                >
                  {isEditing ? (
                    <input
                      type="text"
                      pattern="[0-9]*"
                      value={hole.handicapIndex || ''}
                      onChange={(e) => handleHandicapChange(h, e.target.value)}
                      placeholder="1-18"
                      className="w-9 h-7 text-center text-xs font-mono font-bold bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded focus:ring-1 focus:ring-emerald-500 focus:outline-hidden text-slate-900 dark:text-white"
                    />
                  ) : (
                    <span>{hole.handicapIndex || '-'}</span>
                  )}
                </div>
              );
            })}
            <div className="w-14 shrink-0 h-9 flex items-center justify-center text-[10px] font-semibold text-slate-400 bg-slate-100 dark:bg-slate-800/40 border-r border-slate-200 dark:border-slate-700">
              -
            </div>
            {is18 && (
              <div className="w-14 shrink-0 h-9 flex items-center justify-center text-[10px] font-semibold text-slate-400 bg-emerald-500/5">
                -
              </div>
            )}
          </div>
        </div>

        {/* Back 9 Section (if 18 holes) */}
        {is18 && (
          <div>
            {/* Header / Hole row */}
            <div className="flex items-center border-b border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/80">
              <div className="w-20 shrink-0 p-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-left border-r border-slate-200 dark:border-slate-700">
                Hole
              </div>
              {Array.from({ length: 9 }, (_, i) => i + 10).map((h) => (
                <div
                  key={h}
                  className="w-12 shrink-0 p-2 text-center text-[11px] font-bold text-slate-600 dark:text-slate-300 border-r border-slate-200 dark:border-slate-700 font-mono"
                >
                  {h}
                </div>
              ))}
              <div className="w-14 shrink-0 p-2 text-center text-[11px] font-extrabold text-slate-700 dark:text-white bg-slate-200 dark:bg-slate-700 border-r border-slate-200 dark:border-slate-700">
                IN
              </div>
              <div className="w-14 shrink-0 p-2 text-center text-[11px] font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10">
                TOTAL
              </div>
            </div>

            {/* Par Row */}
            <div className="flex items-center border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
              <div className="w-20 shrink-0 p-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-left border-r border-slate-200 dark:border-slate-700">
                Par
              </div>
              {Array.from({ length: 9 }, (_, i) => i + 10).map((h) => {
                const hole = getHole(h);
                return (
                  <div
                    key={h}
                    className="w-12 h-9 shrink-0 flex items-center justify-center text-[11px] font-bold text-slate-700 dark:text-slate-200 border-r border-slate-200 dark:border-slate-700 font-mono"
                  >
                    {isEditing ? (
                      <div className="flex items-center justify-center gap-0.5">
                        <button
                          type="button"
                          onClick={() => handleParChange(h, -1)}
                          className="w-3.5 h-6 rounded bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-center cursor-pointer transition-colors"
                          title="Decrease par"
                        >
                          -
                        </button>
                        <span className="font-mono font-bold text-xs w-3 text-center">
                          {hole.par}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleParChange(h, 1)}
                          className="w-3.5 h-6 rounded bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-center cursor-pointer transition-colors"
                          title="Increase par"
                        >
                          +
                        </button>
                      </div>
                    ) : (
                      <span>{hole.par}</span>
                    )}
                  </div>
                );
              })}
              <div className="w-14 shrink-0 h-9 flex items-center justify-center text-[11px] font-extrabold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/80 border-r border-slate-200 dark:border-slate-700 font-mono">
                {back9InPar}
              </div>
              <div className="w-14 shrink-0 h-9 flex items-center justify-center text-[11px] font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 font-mono">
                {totalPar}
              </div>
            </div>

            {/* Yardage Row */}
            <div className="flex items-center border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <div className="w-20 shrink-0 p-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-left border-r border-slate-200 dark:border-slate-700">
                Yardage
              </div>
              {Array.from({ length: 9 }, (_, i) => i + 10).map((h) => {
                const hole = getHole(h);
                return (
                  <div
                    key={h}
                    className="w-12 h-9 shrink-0 flex items-center justify-center text-[11px] font-semibold text-slate-600 dark:text-slate-400 border-r border-slate-200 dark:border-slate-700 font-mono"
                  >
                    {isEditing ? (
                      <input
                        type="text"
                        pattern="[0-9]*"
                        value={hole.yardage || ''}
                        onChange={(e) => handleYardageChange(h, e.target.value)}
                        placeholder="yds"
                        className="w-10 h-7 text-center text-xs font-mono font-bold bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded focus:ring-1 focus:ring-emerald-500 focus:outline-hidden text-slate-900 dark:text-white"
                      />
                    ) : (
                      <span>{hole.yardage || '-'}</span>
                    )}
                  </div>
                );
              })}
              <div className="w-14 shrink-0 h-9 flex items-center justify-center text-[11px] font-bold text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/40 border-r border-slate-200 dark:border-slate-700 font-mono">
                {back9InYds}
              </div>
              <div className="w-14 shrink-0 h-9 flex items-center justify-center text-[11px] font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 font-mono">
                {totalYds}
              </div>
            </div>

            {/* Handicap Index Row */}
            <div className="flex items-center bg-slate-50/70 dark:bg-slate-900/40">
              <div className="w-20 shrink-0 p-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-left border-r border-slate-200 dark:border-slate-700">
                Handicap
              </div>
              {Array.from({ length: 9 }, (_, i) => i + 10).map((h) => {
                const hole = getHole(h);
                return (
                  <div
                    key={h}
                    className="w-12 h-9 shrink-0 flex items-center justify-center text-[11px] font-medium text-slate-500 dark:text-slate-400 border-r border-slate-200 dark:border-slate-700 font-mono"
                  >
                    {isEditing ? (
                      <input
                        type="text"
                        pattern="[0-9]*"
                        value={hole.handicapIndex || ''}
                        onChange={(e) => handleHandicapChange(h, e.target.value)}
                        placeholder="1-18"
                        className="w-9 h-7 text-center text-xs font-mono font-bold bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded focus:ring-1 focus:ring-emerald-500 focus:outline-hidden text-slate-900 dark:text-white"
                      />
                    ) : (
                      <span>{hole.handicapIndex || '-'}</span>
                    )}
                  </div>
                );
              })}
              <div className="w-14 shrink-0 h-9 flex items-center justify-center text-[10px] font-semibold text-slate-400 bg-slate-100 dark:bg-slate-800/40 border-r border-slate-200 dark:border-slate-700">
                -
              </div>
              <div className="w-14 shrink-0 h-9 flex items-center justify-center text-[10px] font-semibold text-slate-400 bg-emerald-500/5">
                -
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
