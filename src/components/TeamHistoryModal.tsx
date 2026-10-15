import React, { useState } from 'react';
import { ChevronDown, Trophy, Award, Edit3, Trash2, Check } from 'lucide-react';
import { TeamEventRecord, Course, HoleScore } from '../types';

interface ExpandableTeamEventCardProps {
  event: TeamEventRecord;
  courses?: Course[];
  onUpdateTeamEvent?: (eventId: string, data: Partial<TeamEventRecord>) => void;
  onDeleteTeamEvent?: (eventId: string) => void;
  defaultExpanded?: boolean;
}

export const ExpandableTeamEventCard: React.FC<ExpandableTeamEventCardProps> = ({ 
  event, courses = [], onUpdateTeamEvent, onDeleteTeamEvent, defaultExpanded = false 
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [isEditing, setIsEditing] = useState(false);
  const [editDate, setEditDate] = useState(event.date || '');
  const [editScores, setEditScores] = useState<Record<number, HoleScore>>((event as any).holeScores || {});
  const [editBuzzballs, setEditBuzzballs] = useState<number>((event as any).buzzballCount || 0);

  const course = courses.find(c => c.name === event.courseName) || courses[0];
  const getPar = (hNum: number) => course?.holes?.find((h) => h.number === hNum)?.par || 4;
  const currentTeam = event.teamLeaderboard[0];

  const handleStartEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    let startingScores: Record<number, HoleScore> = {};
    if ((event as any).holeScores) {
      startingScores = JSON.parse(JSON.stringify((event as any).holeScores));
    }
    if (Object.keys(startingScores).length < 18) {
      Array.from({length: 18}, (_, i) => i + 1).forEach((i) => {
        if (!startingScores[i]) {
          const par = getPar(i);
          startingScores[i] = { strokes: par, putts: 2, fir: par === 3 ? 'none' : 'hit', gir: true };
        }
      });
    }
    setEditScores(startingScores);
    setEditBuzzballs((event as any).buzzballCount || 0);
    setEditDate(event.date || '');
    setIsEditing(true);
    setIsExpanded(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditScores((event as any).holeScores || {});
    setEditBuzzballs((event as any).buzzballCount || 0);
    setEditDate(event.date || '');
  };

  const updateHole = (holeNum: number, field: keyof HoleScore, value: any) => {
    setEditScores(prev => ({
      ...prev,
      [holeNum]: { ...(prev[holeNum] || { strokes: 4, putts: 2, fir: 'none', gir: false }), [field]: value }
    }));
  };

  const handleSaveEdit = () => {
    if (!onUpdateTeamEvent) return;
    let gross = 0;
    Object.values(editScores).forEach(score => gross += (score.strokes || 4));

    const updatedLeaderboard = [...event.teamLeaderboard];
    if (updatedLeaderboard.length > 0) {
      updatedLeaderboard[0].grossScore = gross;
    }

    const payload = {
      date: editDate,
      holeScores: editScores,
      buzzballCount: editBuzzballs,
      teamLeaderboard: updatedLeaderboard
    };

    onUpdateTeamEvent(event.id, payload);
    setIsEditing(false);
  };

  const renderScore = (strokes: number | undefined, par: number) => {
    if (!strokes) return <span className="text-slate-400">-</span>;
    const diff = strokes - par;
    if (diff <= -2) return <span className="inline-flex items-center justify-center w-6 h-6 rounded-full border-2 border-amber-400 text-amber-500 font-bold bg-amber-50 dark:bg-amber-950/30">{strokes}</span>;
    if (diff === -1) return <span className="inline-flex items-center justify-center w-6 h-6 rounded-full border border-emerald-400 text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/30">{strokes}</span>;
    if (diff === 0) return <span className="font-bold text-slate-700 dark:text-slate-300">{strokes}</span>;
    if (diff === 1) return <span className="inline-flex items-center justify-center w-6 h-6 border border-slate-400 text-slate-800 dark:text-slate-200 font-bold">{strokes}</span>;
    return <span className="inline-flex items-center justify-center w-6 h-6 border-2 border-slate-500 text-slate-900 dark:text-white font-bold">{strokes}</span>;
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden transition-all shadow-xs">
      <div onClick={() => !isEditing && setIsExpanded(!isExpanded)} className={`p-3 sm:p-4 flex items-center justify-between gap-3 text-xs ${!isEditing ? 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50' : 'bg-slate-50 dark:bg-slate-800/30'} transition-colors`}>
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-center justify-center text-amber-500 shrink-0 shadow-sm">
            <Trophy className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h5 className="font-heading font-extrabold text-sm text-slate-900 dark:text-slate-100 truncate flex items-center gap-2">
              {event.eventName}
              {!isEditing && onUpdateTeamEvent && (
                <button onClick={handleStartEdit} className="p-1 text-slate-400 hover:text-emerald-600 transition-colors cursor-pointer" title="Edit Scorecard">
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              )}
            </h5>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 flex-wrap mt-0.5">
              <span className="font-semibold text-emerald-600 dark:text-emerald-400 capitalize">{event.format}</span>
              <span>·</span>
              <span className="truncate">{event.date}</span>
              {((event as any).buzzballCount || 0) > 0 && !isEditing && (
                <span className="flex items-center gap-0.5 font-bold text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-950/30 px-1.5 py-0.5 rounded ml-1">
                  🍹 {(event as any).buzzballCount}
                </span>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">Score</span>
            <span className="font-stats font-extrabold text-sm text-emerald-600 dark:text-emerald-400">{currentTeam?.grossScore} Gross</span>
          </div>
          {!isEditing && (
            <div className={`w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
              <ChevronDown className="w-3.5 h-3.5" />
            </div>
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="p-3 sm:p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30 animate-fadeIn space-y-4 overflow-x-auto">
          {isEditing ? (
            <div className="space-y-3 min-w-max">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2 border-b border-slate-200 dark:border-slate-700/60 pb-3">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Edit Team Round</span>
                  <input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} className="px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-slate-100" />
                  <div className="flex items-center gap-1.5 bg-amber-100/50 dark:bg-amber-900/30 px-2 py-1 rounded-lg border border-amber-200/50 dark:border-amber-800/50">
                    <span className="text-[10px] uppercase font-bold text-amber-700 dark:text-amber-500">🍹 Drinks</span>
                    <button type="button" onClick={() => setEditBuzzballs(Math.max(0, editBuzzballs - 1))} className="w-5 h-5 rounded bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs shadow-2xs cursor-pointer">-</button>
                    <span className="font-stats font-bold text-xs w-4 text-center text-slate-900 dark:text-slate-100">{editBuzzballs}</span>
                    <button type="button" onClick={() => setEditBuzzballs(editBuzzballs + 1)} className="w-5 h-5 rounded bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs shadow-2xs cursor-pointer">+</button>
                  </div>
                </div>
                <div className="flex gap-2 self-end sm:self-auto">
                  {onDeleteTeamEvent && (
                    <button onClick={() => { if(window.confirm('Delete this team round?')) onDeleteTeamEvent(event.id); }} className="px-3 py-1.5 rounded-lg text-xs font-bold border border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 cursor-pointer flex items-center gap-1 transition-colors">
                      <Trash2 className="w-3.5 h-3.5"/> Delete
                    </button>
                  )}
                  <button onClick={handleCancelEdit} className="px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700">Cancel</button>
                  <button onClick={handleSaveEdit} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1 cursor-pointer"><Check className="w-3 h-3"/> Save</button>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {Array.from({length: 18}, (_, i) => i + 1).map(hNum => {
                  const score = editScores[hNum] || { strokes: getPar(hNum), putts: 2, fir: 'none', gir: false };
                  return (
                    <div key={hNum} className="p-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900">
                      <div className="text-[10px] font-bold text-slate-500 mb-1.5 text-center">Hole {hNum} (Par {getPar(hNum)})</div>
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">Score</span>
                        <div className="flex items-center gap-1.5">
                          <button type="button" onClick={() => updateHole(hNum, 'strokes', Math.max(1, (score.strokes||getPar(hNum))-1))} className="w-5 h-5 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700">-</button>
                          <span className="w-4 text-center font-bold text-slate-900 dark:text-slate-100">{score.strokes || getPar(hNum)}</span>
                          <button type="button" onClick={() => updateHole(hNum, 'strokes', (score.strokes||getPar(hNum))+1)} className="w-5 h-5 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700">+</button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">Putts</span>
                        <div className="flex items-center gap-1.5">
                          <button type="button" onClick={() => updateHole(hNum, 'putts', Math.max(0, (score.putts||2)-1))} className="w-5 h-5 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700">-</button>
                          <span className="w-4 text-center font-bold text-slate-900 dark:text-slate-100">{score.putts || 2}</span>
                          <button type="button" onClick={() => updateHole(hNum, 'putts', (score.putts||2)+1)} className="w-5 h-5 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700">+</button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <div className="min-w-max border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-2xs">
              {(event as any).holeScores ? (
                <>
                  <div className="overflow-hidden border-b border-slate-200 dark:border-slate-800">
                    <div className="flex items-center border-b border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/80">
                      <div className="w-16 shrink-0 p-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-left border-r border-slate-200 dark:border-slate-700">Hole</div>
                      {Array.from({length: 9}, (_, i) => i + 1).map(h => (
                        <div key={h} className="w-10 shrink-0 p-2 text-center text-[11px] font-bold text-slate-600 dark:text-slate-300 border-r border-slate-200 dark:border-slate-700">{h}</div>
                      ))}
                      <div className="w-12 flex-1 p-2 text-center text-[11px] font-extrabold text-slate-700 dark:text-white bg-slate-200 dark:bg-slate-700">OUT</div>
                    </div>
                    <div className="flex items-center border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                      <div className="w-16 shrink-0 p-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-left border-r border-slate-200 dark:border-slate-700">Par</div>
                      {Array.from({length: 9}, (_, i) => i + 1).map(h => (
                        <div key={h} className="w-10 shrink-0 p-2 text-center text-[11px] font-bold text-slate-500 border-r border-slate-200 dark:border-slate-700">{getPar(h)}</div>
                      ))}
                      <div className="w-12 flex-1 p-2 text-center text-[11px] font-extrabold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20">
                        {Array.from({length: 9}, (_, i) => getPar(i + 1)).reduce((a, b) => a + b, 0)}
                      </div>
                    </div>
                    <div className="flex items-center bg-white dark:bg-slate-900">
                      <div className="w-16 shrink-0 p-2 border-r border-slate-200 dark:border-slate-700 flex flex-col justify-center">
                        <span className="text-[11px] font-bold text-slate-900 dark:text-white leading-tight truncate">{currentTeam?.teamName}</span>
                      </div>
                      {Array.from({length: 9}, (_, i) => i + 1).map(h => (
                        <div key={h} className="w-10 h-10 shrink-0 flex items-center justify-center font-stats text-sm border-r border-slate-100 dark:border-slate-800/50">
                          {renderScore((event as any).holeScores![h]?.strokes, getPar(h))}
                        </div>
                      ))}
                      <div className="w-12 flex-1 h-10 flex items-center justify-center font-stats text-sm font-bold text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/30">
                        {Array.from({length: 9}, (_, i) => (event as any).holeScores![i + 1]?.strokes || 0).reduce((a, b) => a + b, 0) || '-'}
                      </div>
                    </div>
                  </div>
                  <div className="overflow-hidden">
                    <div className="flex items-center border-b border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/80">
                      <div className="w-16 shrink-0 p-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-left border-r border-slate-200 dark:border-slate-700">Hole</div>
                      {Array.from({length: 9}, (_, i) => i + 10).map(h => (
                        <div key={h} className="w-10 shrink-0 p-2 text-center text-[11px] font-bold text-slate-600 dark:text-slate-300 border-r border-slate-200 dark:border-slate-700">{h}</div>
                      ))}
                      <div className="w-12 shrink-0 p-2 text-center text-[11px] font-extrabold text-slate-700 dark:text-white border-r border-slate-300 dark:border-slate-600 bg-slate-200 dark:bg-slate-700">IN</div>
                      <div className="w-12 flex-1 p-2 text-center text-[11px] font-extrabold text-white bg-emerald-600">TOT</div>
                    </div>
                    <div className="flex items-center border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                      <div className="w-16 shrink-0 p-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-left border-r border-slate-200 dark:border-slate-700">Par</div>
                      {Array.from({length: 9}, (_, i) => i + 10).map(h => (
                        <div key={h} className="w-10 shrink-0 p-2 text-center text-[11px] font-bold text-slate-500 border-r border-slate-200 dark:border-slate-700">{getPar(h)}</div>
                      ))}
                      <div className="w-12 shrink-0 p-2 text-center text-[11px] font-extrabold text-slate-600 dark:text-slate-400 border-r border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-800/80">
                        {Array.from({length: 9}, (_, i) => getPar(i + 10)).reduce((a, b) => a + b, 0)}
                      </div>
                      <div className="w-12 flex-1 p-2 text-center text-[11px] font-extrabold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20">
                        {Array.from({length: 18}, (_, i) => getPar(i + 1)).reduce((a, b) => a + b, 0)}
                      </div>
                    </div>
                    <div className="flex items-center bg-white dark:bg-slate-900">
                      <div className="w-16 shrink-0 p-2 border-r border-slate-200 dark:border-slate-700 flex flex-col justify-center">
                        <span className="text-[11px] font-bold text-slate-900 dark:text-white leading-tight truncate">{currentTeam?.teamName}</span>
                      </div>
                      {Array.from({length: 9}, (_, i) => i + 10).map(h => (
                        <div key={h} className="w-10 h-10 shrink-0 flex items-center justify-center font-stats text-sm border-r border-slate-100 dark:border-slate-800/50">
                          {renderScore((event as any).holeScores![h]?.strokes, getPar(h))}
                        </div>
                      ))}
                      <div className="w-12 h-10 shrink-0 flex items-center justify-center font-stats text-sm font-bold text-slate-800 dark:text-slate-200 border-r border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/30">
                        {Array.from({length: 9}, (_, i) => (event as any).holeScores![i + 10]?.strokes || 0).reduce((a, b) => a + b, 0) || '-'}
                      </div>
                      <div className="w-12 flex-1 h-10 flex items-center justify-center font-stats text-sm font-extrabold text-emerald-700 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/10">
                        {currentTeam?.grossScore}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-xs text-slate-500 text-center italic py-4">
                  No hole-by-hole scorecard was saved for this team round. Click the edit icon to add scores!
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export const TeamHistoryModal: React.FC<any> = () => null;
